

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Observation, Area, CorrectiveAction, User } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Camera, Eye, Siren, User as UserIcon, Users, FileText, ClipboardCheck, Upload, Download, Trash2, Edit, Wrench, FilePlus2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { storage, db } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL, uploadString } from 'firebase/storage';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchAndUploadImageAction } from '@/app/actions';
import { Label } from '@/components/ui/label';


const baseObservationSchema = z.object({
  report_type: z.enum(['Safety Concern', 'Positive Observation', 'Near Miss'], {
    required_error: 'You need to select a report type.',
  }),
  submitted_by: z.string().min(2, { message: 'Your name must be at least 2 characters.' }),
  date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date and time.',
  }),
  areaId: z.string().min(1, { message: 'Please select an area.' }),
  person_involved: z.string().optional(),
  risk_level: z.coerce.number().min(1).max(4),
  description: z.string().min(10, { message: 'Description must be at least 10 characters.' }),
  actions: z.string().min(10, { message: 'Actions taken must be at least 10 characters.' }),
  unsafe_category: z.enum(['Unsafe Behavior', 'Unsafe Condition', 'N/A'], {
    required_error: 'You need to select a category.',
  }),
});

const observationFormSchema = baseObservationSchema.extend({
    createAction: z.boolean().default(false).optional(),
    actionDescription: z.string().optional(),
    actionResponsiblePerson: z.string().optional(),
    actionDueDate: z.string().optional(),
}).refine(data => {
    if (data.createAction) {
        return data.actionDescription && data.actionResponsiblePerson && data.actionDueDate && !isNaN(Date.parse(data.actionDueDate));
    }
    return true;
}, {
    message: 'If creating a corrective action, its description, responsible person, and a valid due date are required.',
    path: ['actionDescription'],
});

const editObservationFormSchema = baseObservationSchema;
type EditObservationFormValues = z.infer<typeof editObservationFormSchema>;

const AreaSelectOptions = ({ areas, level = 0 }: { areas: Area[]; level?: number }) => {
  return (
    <>
      {areas.map((area) => (
        <React.Fragment key={area.area_id}>
          <SelectItem value={area.area_id}>
            <span style={{ paddingLeft: `${level * 1.25}rem` }}>{area.name}</span>
          </SelectItem>
          {area.children && <AreaSelectOptions areas={area.children} level={level + 1} />}
        </React.Fragment>
      ))}
    </>
  );
};

const findAreaPathById = (areas: Area[], id: string, path: string[] = []): string => {
  for (const area of areas) {
    const newPath = [...path, area.name];
    if (area.area_id === id) {
      return newPath.join(' / ');
    }
    if (area.children) {
      const foundPath = findAreaPathById(area.children, id, newPath);
      if (foundPath) return foundPath;
    }
  }
  return 'Unknown Area';
};

export const riskLabels: { [key: number]: string } = {
  1: '1 - Low',
  2: '2 - Medium',
  3: '3 - High',
  4: '4 - Critical',
};

const riskVariant: { [key: number]: 'outline' | 'secondary' | 'default' | 'destructive' } = {
  1: 'outline',
  2: 'secondary',
  3: 'default',
  4: 'destructive',
};


const ObservationForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addObservation, addCorrectiveAction, uploadSettings, areas } = useAppData();
  const { user: authUser } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof observationFormSchema>>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      submitted_by: authUser?.displayName || '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      description: '',
      actions: '',
      person_involved: '',
      risk_level: 1,
      areaId: '',
      createAction: false,
      actionDescription: '',
      actionResponsiblePerson: '',
      actionDueDate: '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = uploadSettings?.imageMaxSizeMB || 5;
      const maxSizeInBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `The image must be smaller than ${maxSizeMB}MB.`,
        });
        if (e.target) e.target.value = '';
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof observationFormSchema>) {
    setIsSubmitting(true);
    try {
      let imageUrl: string | undefined = undefined;
      if (selectedFile) {
        toast({ title: "Uploading image...", description: "Please wait." });
        const storageRef = ref(storage, `observations/${Date.now()}_${selectedFile.name}`);
        await uploadBytes(storageRef, selectedFile);
        imageUrl = await getDownloadURL(storageRef);
      }

      const newObservationData: Omit<Observation, 'observation_id' | 'display_id' | 'status'> = {
          report_type: values.report_type,
          submitted_by: values.submitted_by,
          date: new Date(values.date).toISOString(),
          areaId: values.areaId,
          person_involved: values.person_involved,
          risk_level: values.risk_level as Observation['risk_level'],
          description: values.description,
          actions: values.actions,
          unsafe_category: values.unsafe_category,
      };
      
      const observationWithImage = { ...newObservationData, ...(imageUrl && { imageUrl }) };
      const newObservationRef = await addObservation(observationWithImage);

      if (values.createAction && values.actionDescription && values.actionResponsiblePerson && values.actionDueDate) {
          const newActionData: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'> = {
              description: values.actionDescription,
              responsible_person: values.actionResponsiblePerson,
              due_date: new Date(values.actionDueDate).toISOString(),
              status: 'Pending',
              related_to_observation: newObservationRef.id,
          };
          await addCorrectiveAction(newActionData);
          toast({
              title: 'Observation & Action Created',
              description: 'The observation and a linked corrective action have been submitted.',
          });
      } else {
          toast({
              title: 'Observation Submitted',
              description: 'Your observation has been successfully submitted.',
          });
      }

      form.reset();
      setImagePreview(null);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setOpen(false);
    } catch (error) {
        console.error("Failed to submit observation:", error);
        toast({
            variant: "destructive",
            title: "Submission Failed",
            description: "There was an error submitting your observation. Please try again.",
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Submit an Observation</DialogTitle>
          <DialogDescription>
            Fill out the form below to document a safety observation.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
          <FormField
            control={form.control}
            name="report_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Safety Report</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a report type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                    <SelectItem value="Positive Observation">
                      Positive Observation
                    </SelectItem>
                    <SelectItem value="Near Miss">Near Miss</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="submitted_by"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Person Documenting</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date and Time</FormLabel>
                <FormControl>
                  <Input type="datetime-local" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="areaId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area where it happened</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an area or operation" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <AreaSelectOptions areas={areas} />
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="person_involved"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Person Involved (optional)</FormLabel>
                <FormControl>
                  <Input placeholder="Name of person involved" {...field} value={field.value ?? ''} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="risk_level"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Risk Evaluation (1-4)</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={String(field.value)}
                    className="flex space-x-4"
                  >
                    {[1, 2, 3, 4].map((level) => (
                      <FormItem
                        key={level}
                        className="flex items-center space-x-2 space-y-0"
                      >
                        <FormControl>
                          <RadioGroupItem value={String(level)} />
                        </FormControl>
                        <FormLabel className="font-normal">{riskLabels[level]}</FormLabel>
                      </FormItem>
                    ))}
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Brief Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe what you observed..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="actions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Immediate Actions Taken</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Describe immediate actions taken..."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="unsafe_category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Unsafe Behavior or Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Unsafe Behavior">Unsafe Behavior</SelectItem>
                    <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                    <SelectItem value="N/A">N/A</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="space-y-2">
            <FormLabel htmlFor="photo">Picture</FormLabel>
            <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} ref={fileInputRef} />
          </div>
          {imagePreview && (
            <div className="mt-4 relative w-full aspect-video">
              <Image
                src={imagePreview}
                alt="Observation preview"
                fill
                className="rounded-md object-cover"
                data-ai-hint="observation photo"
              />
            </div>
          )}
          
          <Separator />

          <FormField
            control={form.control}
            name="createAction"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    Create Corrective Action
                  </FormLabel>
                  <FormDescription>
                    Check this box to create a linked corrective action for this observation.
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          {form.watch('createAction') && (
            <div className="space-y-4 p-4 border rounded-md bg-muted/30">
              <FormField
                control={form.control}
                name="actionDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Action Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe the required follow-up action..." {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="actionResponsiblePerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Responsible Person</FormLabel>
                      <FormControl><Input placeholder="e.g., Facility Manager" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="actionDueDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl><Input type="date" {...field} value={field.value ?? ''} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Observation
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


const EditObservationDialog = ({
  observation,
  isOpen,
  onOpenChange,
  areas,
}: {
  observation: Observation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  areas: Area[];
}) => {
  const { updateObservation } = useAppData();
  const { toast } = useToast();
  const form = useForm<EditObservationFormValues>({
    resolver: zodResolver(editObservationFormSchema),
    defaultValues: {
      report_type: 'Safety Concern',
      submitted_by: '',
      date: '',
      areaId: '',
      person_involved: '',
      risk_level: 1,
      description: '',
      actions: '',
      unsafe_category: 'N/A',
    },
  });

  useEffect(() => {
    if (observation) {
      form.reset({
        ...observation,
        date: format(new Date(observation.date), "yyyy-MM-dd'T'HH:mm"),
      });
    }
  }, [observation, form]);

  if (!observation) return null;

  const handleUpdate = async (values: EditObservationFormValues) => {
    const updatedObservationData: Observation = {
      ...observation,
      ...values,
      date: new Date(values.date).toISOString(),
      risk_level: values.risk_level as Observation['risk_level'],
    };
    await updateObservation(updatedObservationData);
    toast({ title: "Observation Updated", description: "The observation has been successfully updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Observation: {observation.display_id}</DialogTitle>
          <DialogDescription>
            Modify the details of the observation below.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdate)} className="space-y-6">
              <FormField
                control={form.control}
                name="report_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type of Safety Report</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a report type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                        <SelectItem value="Positive Observation">Positive Observation</SelectItem>
                        <SelectItem value="Near Miss">Near Miss</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="submitted_by"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Documenting</FormLabel>
                    <FormControl><Input {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date and Time</FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="areaId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Area where it happened</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an area or operation" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <AreaSelectOptions areas={areas} />
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="person_involved"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Person Involved (optional)</FormLabel>
                    <FormControl><Input placeholder="Name of person involved" {...field} value={field.value ?? ''} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="risk_level"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Risk Evaluation (1-4)</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={(value) => field.onChange(parseInt(value))}
                        defaultValue={String(field.value)}
                        className="flex space-x-4"
                      >
                        {[1, 2, 3, 4].map((level) => (
                          <FormItem key={level} className="flex items-center space-x-2 space-y-0">
                            <FormControl><RadioGroupItem value={String(level)} /></FormControl>
                            <FormLabel className="font-normal">{riskLabels[level]}</FormLabel>
                          </FormItem>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brief Description</FormLabel>
                    <FormControl><Textarea placeholder="Describe what you observed..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="actions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Immediate Actions Taken</FormLabel>
                    <FormControl><Textarea placeholder="Describe immediate actions taken..." {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="unsafe_category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unsafe Behavior or Condition</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Unsafe Behavior">Unsafe Behavior</SelectItem>
                        <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                        <SelectItem value="N/A">N/A</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ObservationDetailsDialog = ({
  observation,
  isOpen,
  onOpenChange,
  areas,
}: {
  observation: Observation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  areas: Area[];
}) => {
  if (!observation) return null;

  const areaPath = findAreaPathById(areas, observation.areaId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Observation Details: {observation.display_id}</DialogTitle>
          <DialogDescription>
            {observation.report_type} reported on {format(new Date(observation.date), 'PPP p')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <UserIcon className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Person Documenting</p>
                <p className="text-sm text-muted-foreground">{observation.submitted_by}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Person Involved</p>
                <p className="text-sm text-muted-foreground">{observation.person_involved || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Unsafe Behavior/Condition</p>
                <p className="text-sm text-muted-foreground">{observation.unsafe_category}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Siren className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Risk Level</p>
                <Badge variant={riskVariant[observation.risk_level]}>
                  {riskLabels[observation.risk_level]}
                </Badge>
              </div>
            </div>
          </div>
          {observation.safety_walk_id && (
            <>
            <Separator />
            <div className="flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
                <div>
                    <p className="text-sm font-medium">Linked To</p>
                    <Button variant="link" className="p-0 h-auto" asChild>
                        <Link href={`/audits`}>Safety Walk: {observation.safety_walk_id}</Link>
                    </Button>
                </div>
            </div>
            </>
          )}
          <Separator />
          <div>
            <h4 className="font-semibold text-sm mb-2">Description</h4>
            <p className="text-sm text-muted-foreground">{observation.description}</p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-2">Actions Taken</h4>
            <p className="text-sm text-muted-foreground">{observation.actions}</p>
          </div>
          {observation.imageUrl && (
            <div>
              <h4 className="font-semibold text-sm mb-2">Attached Photo</h4>
              <div className="relative w-full aspect-video rounded-md overflow-hidden">
                <Image
                  src={observation.imageUrl}
                  alt={`Photo for ${observation.observation_id}`}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Helper function to parse a single CSV row, handling quoted fields.
const parseCsvRow = (row: string): string[] => {
  const values: string[] = [];
  let currentVal = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"') {
      // If we're in quotes and the next character is also a quote, it's an escaped quote
      if (inQuotes && i + 1 < row.length && row[i + 1] === '"') {
        currentVal += '"';
        i++; // Skip the next character
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // If it's a comma and we're not in quotes, it's a field separator
      values.push(currentVal.trim());
      currentVal = '';
    } else {
      // Any other character is part of the current value
      currentVal += char;
    }
  }
  values.push(currentVal.trim()); // Add the last value
  return values;
};


interface ObservationTableProps {
  observations: Observation[];
  title: string;
  description: string;
  emptyMessage: string;
  isAdmin: boolean;
  currentUser: User | null;
  onRowClick: (observation: Observation) => void;
  onEditClick: (event: React.MouseEvent, observation: Observation) => void;
  onDelete: (event: React.MouseEvent, observationId: string) => void;
}

const ObservationTable: React.FC<ObservationTableProps> = ({
  observations,
  title,
  description,
  emptyMessage,
  isAdmin,
  currentUser,
  onRowClick,
  onEditClick,
  onDelete,
}) => {

  const statusVariant: { [key in Observation['status']]: 'outline' | 'default' } = {
    Open: 'default',
    Closed: 'outline',
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Risk</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Photo</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {observations.length > 0 ? (
              observations.map((obs) => {
                const canEdit = isAdmin || (currentUser && currentUser.displayName === obs.submitted_by);
                return (
                  <TableRow key={obs.observation_id} onClick={() => onRowClick(obs)} className="cursor-pointer">
                    <TableCell className="font-medium">{obs.display_id}</TableCell>
                    <TableCell>{new Date(obs.date).toLocaleDateString()}</TableCell>
                    <TableCell>{obs.report_type}</TableCell>
                    <TableCell>
                      <Badge variant={riskVariant[obs.risk_level]}>
                        {riskLabels[obs.risk_level]}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{obs.description}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[obs.status]}>{obs.status}</Badge>
                    </TableCell>
                    <TableCell>
                      {obs.imageUrl ? (
                        <div className="w-16 h-12 relative">
                          <Image
                            src={obs.imageUrl}
                            alt={`Observation ${obs.observation_id}`}
                            fill
                            className="rounded-md object-cover"
                            data-ai-hint="safety observation"
                          />
                        </div>
                      ) : (
                        <div className="w-16 h-12 flex items-center justify-center bg-muted rounded-md">
                          <Camera className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        <Button variant="ghost" size="icon" onClick={(e) => onEditClick(e, obs)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {isAdmin && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete observation <span className="font-mono">{obs.display_id}</span>. This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={(e) => onDelete(e, obs.observation_id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default function ObservationsPage() {
  const { observations, deleteObservation, users, areas } = useAppData();
  const { user: authUser } = useAuth();
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [isNewObservationOpen, setNewObservationOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentUser = users.find(u => u.id === authUser?.uid) || null;
  const isAdmin = currentUser?.role === 'Administrator';
  const canExport = isAdmin || currentUser?.role === 'Manager';

  const myObservations = observations.filter(
    (obs) => authUser && obs.submitted_by === authUser.displayName
  );

  const handleRowClick = (observation: Observation) => {
    setSelectedObservation(observation);
    setDetailsOpen(true);
  };
  
  const handleEditClick = (e: React.MouseEvent, observation: Observation) => {
    e.stopPropagation();
    setEditingObservation(observation);
  };

  const handleDelete = (e: React.MouseEvent, observationId: string) => {
    e.stopPropagation();
    deleteObservation(observationId);
    toast({
        title: 'Observation Deleted',
        description: 'The observation has been permanently removed.',
        variant: 'destructive',
    });
  };

  const handleExport = () => {
    const headers = [
      'observation_id', 'report_type', 'submitted_by', 'date', 'areaId', 
      'person_involved', 'risk_level', 'description', 'actions', 
      'unsafe_category', 'status', 'imageUrl', 'safety_walk_id'
    ] as (keyof Observation)[];

    const csvRows = [
      headers.join(','),
      ...observations.map(obs => {
        const values = headers.map(header => {
          const value = header in obs ? obs[header as keyof Observation] : '';
          const stringValue = String(value ?? '');
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        });
        return values.join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'observations_export.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({ title: "Export Successful", description: "Observations exported to CSV." });
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
        setIsSubmitting(true);
        const text = event.target?.result as string;
        if (!text) {
            toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not read file.' });
            setIsSubmitting(false);
            return;
        }

        try {
            const rows = text.split(/\r\n|\n|\r/).filter(row => row.trim() !== '');
            if (rows.length < 2) {
              toast({ variant: 'destructive', title: 'Import Failed', description: 'CSV file is empty or has no data rows.' });
              setIsSubmitting(false);
              return;
            }

            const headers = parseCsvRow(rows[0]);
            const requiredHeaders = ['report_type', 'submitted_by', 'areaId', 'description'];
            for(const reqHeader of requiredHeaders) {
                if (!headers.includes(reqHeader)) {
                    toast({ variant: 'destructive', title: 'Import Failed', description: `Missing required CSV column: ${reqHeader}` });
                    setIsSubmitting(false);
                    return;
                }
            }
            
            const obsCollection = collection(db, 'observations');
            const currentObsCount = observations.length;
            const observationsToCommit: Omit<Observation, 'observation_id'>[] = [];
            const imageUrlsToProcess: { index: number, url: string }[] = [];

            for (let i = 1; i < rows.length; i++) {
                const values = parseCsvRow(rows[i]);
                if (values.length !== headers.length) {
                    console.warn(`Skipping malformed row ${i + 1}: Check column count. Expected ${headers.length}, got ${values.length}.`);
                    continue;
                }
                
                const obsData: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                    obsData[header] = values[index];
                });

                if (!obsData.report_type || !obsData.submitted_by || !obsData.areaId || !obsData.description) {
                    console.warn(`Skipping row ${i+1} due to missing required data.`);
                    continue;
                }
                
                const displayId = `OBS${String(currentObsCount + observationsToCommit.length + 1).padStart(3, '0')}`;
                
                const newObservation: Omit<Observation, 'observation_id'> = {
                    display_id: displayId,
                    status: 'Open',
                    report_type: obsData.report_type as Observation['report_type'] || 'Safety Concern',
                    submitted_by: obsData.submitted_by,
                    date: obsData.date ? new Date(obsData.date).toISOString() : new Date().toISOString(),
                    areaId: obsData.areaId,
                    person_involved: obsData.person_involved || '',
                    risk_level: (parseInt(obsData.risk_level, 10) as Observation['risk_level']) || 1,
                    description: obsData.description,
                    actions: obsData.actions || 'No immediate actions logged.',
                    unsafe_category: obsData.unsafe_category as Observation['unsafe_category'] || 'N/A',
                };
                observationsToCommit.push(newObservation);
                if (obsData.imageUrl) {
                    imageUrlsToProcess.push({ index: observationsToCommit.length - 1, url: obsData.imageUrl });
                }
            }
            
            const enrichedObservations = [...observationsToCommit] as Omit<Observation, 'observation_id'>[];
            if (imageUrlsToProcess.length > 0) {
              toast({ title: "Processing images...", description: `Found ${imageUrlsToProcess.length} images to import.` });
            }

            const imageProcessingPromises = imageUrlsToProcess.map(async ({ index, url }) => {
                try {
                    const dataUri = await fetchAndUploadImageAction(url);
                    if (dataUri) {
                        const storageRef = ref(storage, `observations/imported/${Date.now()}_${index}.jpg`);
                        const uploadResult = await uploadString(storageRef, dataUri, 'data_url');
                        const downloadUrl = await getDownloadURL(uploadResult.ref);
                        if (enrichedObservations[index]) {
                           (enrichedObservations[index] as any).imageUrl = downloadUrl;
                        }
                    }
                } catch (error) {
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`Failed to process image for row ${index + 2}: ${errorMessage}`);
                    toast({
                        variant: 'destructive',
                        title: `Image Upload Failed (Row ${index + 2})`,
                        description: `Could not upload image from URL. See console for details.`,
                        duration: 5000,
                    });
                }
            });

            await Promise.all(imageProcessingPromises);

            if (enrichedObservations.length > 0) {
              const batch = writeBatch(db);
              enrichedObservations.forEach(obs => {
                  const newDocRef = doc(obsCollection);
                  const cleanObs = { ...obs };
                  if (!cleanObs.imageUrl) delete (cleanObs as any).imageUrl;
                  if (!cleanObs.safety_walk_id) delete (cleanObs as any).safety_walk_id;
                  if (!cleanObs.person_involved) delete (cleanObs as any).person_involved;

                  batch.set(newDocRef, cleanObs);
              });
              await batch.commit();
              toast({ title: 'Import Successful', description: `${enrichedObservations.length} new observations imported.` });
            } else {
              toast({ title: 'Import Complete', description: 'No new valid observations to import.' });
            }

        } catch (error) {
            console.error('Import error:', error);
            toast({ variant: 'destructive', title: 'Import Failed', description: 'There was an error parsing the CSV file.' });
        } finally {
            setIsSubmitting(false);
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsText(file);
  };
  
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Safety Observations</h2>
             <Dialog open={isNewObservationOpen} onOpenChange={setNewObservationOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <FilePlus2 className="mr-2 h-4 w-4" /> Add New Observation
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <ObservationForm setOpen={setNewObservationOpen} />
                </DialogContent>
            </Dialog>
        </div>
        
        <Tabs defaultValue="all">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Observations</TabsTrigger>
            <TabsTrigger value="my">My Observations</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Observation History</CardTitle>
                        <CardDescription>
                        A list of all submitted safety observations. Click a row to see details.
                        </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                        {isAdmin && (
                            <>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept=".csv"
                                    onChange={handleFileImport}
                                />
                                <Button variant="outline" size="sm" onClick={handleImportClick} disabled={isSubmitting}>
                                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                    Import
                                </Button>
                            </>
                        )}
                        {canExport && (
                           <Button variant="outline" size="sm" onClick={handleExport}>
                                <Download className="mr-2 h-4 w-4" /> Export
                            </Button>
                        )}
                    </div>
                </div>
              </CardHeader>
              <CardContent>
                <ObservationTable
                    observations={observations}
                    title="All Observations"
                    description="A list of all submitted safety observations."
                    emptyMessage="No observations have been recorded yet."
                    isAdmin={isAdmin}
                    currentUser={currentUser}
                    onRowClick={handleRowClick}
                    onEditClick={handleEditClick}
                    onDelete={handleDelete}
                />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="my" className="mt-4">
              <ObservationTable
                  observations={myObservations}
                  title="My Submitted Observations"
                  description="A list of all safety observations you have submitted."
                  emptyMessage="You have not submitted any observations yet."
                  isAdmin={isAdmin}
                  currentUser={currentUser}
                  onRowClick={handleRowClick}
                  onEditClick={handleEditClick}
                  onDelete={handleDelete}
              />
          </TabsContent>
        </Tabs>
        
        <ObservationDetailsDialog
          observation={selectedObservation}
          isOpen={isDetailsOpen}
          onOpenChange={setDetailsOpen}
          areas={areas}
        />
        <EditObservationDialog
          observation={editingObservation}
          isOpen={!!editingObservation}
          onOpenChange={(open) => !open && setEditingObservation(null)}
          areas={areas}
        />
      </div>
    </AppShell>
  );
}
