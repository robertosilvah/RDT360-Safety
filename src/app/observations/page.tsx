'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockObservations, mockAreas } from '@/lib/mockData';
import type { Observation, Area } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Image from 'next/image';
import { Camera, Check, Clock, Edit, Eye, FileText, User, Users } from 'lucide-react';
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
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

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
});

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

const riskLabels: { [key: number]: string } = {
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
  const [observations, setObservations] = useState(mockObservations);
  const [selectedObservation, setSelectedObservation] = useState<Observation | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const statusVariant: { [key in Observation['status']]: 'outline' | 'default' } = {
    Open: 'default',
    Closed: 'outline',
  };

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const form = useForm<z.infer<typeof observationFormSchema>>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: {
      submitted_by: '',
      description: '',
      actions: '',
      person_involved: '',
      risk_level: 1,
      areaId: '',
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

  function onSubmit(values: z.infer<typeof observationFormSchema>) {
    console.log({ ...values, file: selectedFile });
    // Here you would typically handle the form submission, e.g., send to a server
    // For now, we just log it and reset.
    alert('Observation submitted!');
    form.reset();
    setSelectedFile(null);
    setImagePreview(null);
  }

  const handleRowClick = (observation: Observation) => {
    setSelectedObservation(observation);
    setDetailsOpen(true);
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
                              onValueChange={field.onChange}
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
                          <FormLabel>Actions Taken</FormLabel>
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
                    <Button type="submit" className="w-full">
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
                <CardTitle>Observation History</CardTitle>
                <CardDescription>
                  A list of all submitted safety observations. Click a row to see details.
                </CardDescription>
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {observations.map((obs) => (
                      <TableRow key={obs.observation_id} onClick={() => handleRowClick(obs)} className="cursor-pointer">
                        <TableCell className="font-medium">{obs.observation_id}</TableCell>
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
                      </TableRow>
                    ))}
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
      </div>
    </AppShell>
  );
}
