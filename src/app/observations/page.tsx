

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
import { mockAreas } from '@/lib/mockDataLocal';
import type { Observation, Area, CorrectiveAction } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Camera, Eye, Siren, User, Users, FileText, ClipboardCheck, Upload, Download, Trash2, Edit } from 'lucide-react';
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
import { storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const observationFormSchema = z.object({
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

const editObservationFormSchema = observationFormSchema.omit({ createAction: true, actionDescription: true, actionResponsiblePerson: true, actionDueDate: true });
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

const EditObservationDialog = ({
  observation,
  isOpen,
  onOpenChange,
}: {
  observation: Observation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { updateObservation } = useAppData();
  const { toast } = useToast();
  const form = useForm<EditObservationFormValues>({
    resolver: zodResolver(editObservationFormSchema),
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
    };
    await updateObservation(updatedObservationData);
    toast({ title: "Observation Updated", description: "The observation has been successfully updated." });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Observation: {observation.observation_id}</DialogTitle>
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
                        <AreaSelectOptions areas={mockAreas} />
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
                    <FormControl><Input placeholder="Name of person involved" {...field} /></FormControl>
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
}: {
  observation: Observation | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!observation) return null;

  const areaPath = findAreaPathById(mockAreas, observation.areaId);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Observation Details: {observation.observation_id}</DialogTitle>
          <DialogDescription>
            {observation.report_type} reported on {format(new Date(observation.date), 'PPP p')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
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

export default function ObservationsPage() {
  const { observations, addObservation, deleteObservation, addCorrectiveAction, users, updateObservation } = useAppData();
  const { user: authUser } = useAuth();
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [editingObservation, setEditingObservation] = useState<Observation | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine user role, special handling for mock admin user
  const userRole = authUser?.uid === 'admin-user-id-001' 
    ? 'Administrator' 
    : users.find(u => u.id === authUser?.uid)?.role;

  const isAdmin = userRole === 'Administrator';
  const canExport = isAdmin || userRole === 'Manager';

  const statusVariant: { [key in Observation['status']]: 'outline' | 'default' } = {
    Open: 'default',
    Closed: 'outline',
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof observationFormSchema>>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      submitted_by: authUser?.displayName || '',
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

      const newObservationData: Omit<Observation, 'observation_id' | 'status'> = {
          report_type: values.report_type,
          submitted_by: values.submitted_by,
          date: new Date(values.date).toISOString(),
          areaId: values.areaId,
          person_involved: values.person_involved,
          risk_level: values.risk_level,
          description: values.description,
          actions: values.actions,
          unsafe_category: values.unsafe_category,
          imageUrl: imageUrl,
      };
      
      // In a real app, you would get the new observation ID back from the server
      // to link the corrective action. For this prototype, we are creating it unlinked.
      const newObservationRef = await addObservation(newObservationData);

      if (values.createAction && values.actionDescription && values.actionResponsiblePerson && values.actionDueDate) {
          const newActionData: Omit<CorrectiveAction, 'action_id' | 'comments'> = {
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
        const text = event.target?.result as string;
        if (!text) {
            toast({ variant: 'destructive', title: 'Import Failed', description: 'Could not read file.' });
            return;
        }

        try {
            const rows = text.split('\n').filter(row => row.trim() !== '');
            if (rows.length < 2) {
              toast({ variant: 'destructive', title: 'Import Failed', description: 'CSV file is empty or has no data rows.' });
              return;
            }

            const headers = rows[0].split(',').map(h => h.trim());
            const requiredHeaders = ['report_type', 'submitted_by', 'areaId', 'description'];
            for(const reqHeader of requiredHeaders) {
                if (!headers.includes(reqHeader)) {
                    toast({ variant: 'destructive', title: 'Import Failed', description: `Missing required CSV column: ${reqHeader}` });
                    return;
                }
            }
            
            let importedCount = 0;
            for (let i = 1; i < rows.length; i++) {
                const values = rows[i].split(',');
                const obsData: { [key: string]: string } = {};
                headers.forEach((header, index) => {
                    obsData[header] = values[index]?.trim();
                });

                const newObservation: Omit<Observation, 'observation_id' | 'status'> = {
                    report_type: obsData.report_type as Observation['report_type'] || 'Safety Concern',
                    submitted_by: obsData.submitted_by,
                    date: obsData.date || new Date().toISOString(),
                    areaId: obsData.areaId,
                    person_involved: obsData.person_involved,
                    risk_level: (parseInt(obsData.risk_level, 10) as Observation['risk_level']) || 1,
                    description: obsData.description,
                    actions: obsData.actions || 'No immediate actions logged.',
                    unsafe_category: obsData.unsafe_category as Observation['unsafe_category'] || 'N/A',
                    imageUrl: obsData.imageUrl,
                    safety_walk_id: obsData.safety_walk_id
                };
                await addObservation(newObservation);
                importedCount++;
            }

            if (importedCount > 0) {
              toast({ title: 'Import Successful', description: `${importedCount} new observations imported.` });
            } else {
              toast({ title: 'Import Complete', description: 'No new observations to import.' });
            }

        } catch (error) {
            console.error('Import error:', error);
            toast({ variant: 'destructive', title: 'Import Failed', description: 'There was an error parsing the CSV file.' });
        } finally {
            if (e.target) e.target.value = '';
        }
    };
    reader.readAsText(file);
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Safety Observations</h2>

        <div className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Submit an Observation</CardTitle>
                <CardDescription>
                  Fill out the form below to document a safety observation.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                              <AreaSelectOptions areas={mockAreas} />
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
                            <Input placeholder="Name of person involved" {...field} />
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
                      <Input id="photo" type="file" accept="image/*" onChange={handleFileChange} />
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
                              <FormControl><Textarea placeholder="Describe the required follow-up action..." {...field} /></FormControl>
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
                                <FormControl><Input placeholder="e.g., Facility Manager" {...field} /></FormControl>
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
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}

                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Submit Observation
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-3">
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
                                <Button variant="outline" size="sm" onClick={handleImportClick}>
                                    <Upload className="mr-2 h-4 w-4" /> Import
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
                    {observations.map((obs) => {
                      const canEdit = isAdmin || (authUser && authUser.displayName === obs.submitted_by);
                      return (
                        <TableRow key={obs.observation_id} onClick={() => handleRowClick(obs)} className="cursor-pointer">
                          <TableCell className="font-medium">{obs.observation_id.substring(0, 8)}...</TableCell>
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
                                <Button variant="ghost" size="icon" onClick={(e) => handleEditClick(e, obs)}>
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
                                                  This will permanently delete observation <span className="font-mono">{obs.observation_id}</span>. This action cannot be undone.
                                              </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                              <AlertDialogCancel onClick={(e) => e.stopPropagation()}>Cancel</AlertDialogCancel>
                                              <AlertDialogAction onClick={(e) => handleDelete(e, obs.observation_id)}>Delete</AlertDialogAction>
                                          </AlertDialogFooter>
                                      </AlertDialogContent>
                                  </AlertDialog>
                              )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
        <ObservationDetailsDialog
          observation={selectedObservation}
          isOpen={isDetailsOpen}
          onOpenChange={setDetailsOpen}
        />
        <EditObservationDialog
          observation={editingObservation}
          isOpen={!!editingObservation}
          onOpenChange={(open) => !open && setEditingObservation(null)}
        />
      </div>
    </AppShell>
  );
}
