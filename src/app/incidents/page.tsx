
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Incident, Comment, Investigation } from '@/types';
import { FilePlus2, Download, MessageSquare, User, Clock, FileSearch, Loader2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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

const incidentFormSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  type: z.enum(['Incident', 'Accident']),
  severity: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Open', 'Under Investigation', 'Closed']),
  assigned_to: z.string().optional(),
  person_involved: z.string().optional(),
  witnesses: z.string().optional(),
  area: z.string().min(3, "Area is required."),
  date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date and time.',
  }),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

const newIncidentFormSchema = incidentFormSchema.omit({ status: true });
type NewIncidentFormValues = z.infer<typeof newIncidentFormSchema>;


const IncidentReportForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
    const { addIncident } = useAppData();
    const { user } = useAuth();
    const { toast } = useToast();
    const form = useForm<NewIncidentFormValues>({
        resolver: zodResolver(newIncidentFormSchema),
        defaultValues: {
            description: '',
            type: 'Incident',
            severity: 'Low',
            area: '',
            assigned_to: '',
            person_involved: '',
            witnesses: '',
            date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        },
    });

    const onSubmit = (values: NewIncidentFormValues) => {
        const incidentData = {
          ...values,
          date: new Date(values.date).toISOString(),
          reported_by: user?.displayName || 'System',
        }
        addIncident(incidentData);
        toast({
            title: 'Incident Reported',
            description: 'The new incident has been logged.',
        });
        setOpen(false);
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                 <DialogHeader>
                    <DialogTitle>Report a New Incident</DialogTitle>
                    <DialogDescription>
                        Fill out the details below. You can start an investigation after reporting.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
                    <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Describe the incident in detail..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="type" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Type</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="Incident">Incident</SelectItem><SelectItem value="Accident">Accident</SelectItem></SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="severity" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Severity</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
                                </Select><FormMessage />
                            </FormItem>
                        )} />
                    </div>
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date and Time of Incident</FormLabel>
                                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="area" render={({ field }) => (
                            <FormItem><FormLabel>Area</FormLabel><FormControl><Input placeholder="e.g., Warehouse Section B" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="person_involved" render={({ field }) => (
                            <FormItem><FormLabel>Person Involved (Optional)</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="witnesses" render={({ field }) => (
                            <FormItem><FormLabel>Witnesses (comma-separated)</FormLabel><FormControl><Input placeholder="e.g., Mike, Bob" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="assigned_to" render={({ field }) => (
                            <FormItem><FormLabel>Assigned To (Optional)</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Report Incident</Button>
                </DialogFooter>
            </form>
        </Form>
    );
};


const IncidentDetailsDialog = ({
  incident,
  isOpen,
  onOpenChange,
}: {
  incident: Incident | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { incidents, updateIncident, addCommentToIncident, createInvestigationForIncident } = useAppData();
  const { toast } = useToast();
  const router = useRouter();
  const [newComment, setNewComment] = useState('');
  const [isCreatingInvestigation, setIsCreatingInvestigation] = useState(false);

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      description: '',
      type: 'Incident',
      severity: 'Low',
      status: 'Open',
      assigned_to: '',
      person_involved: '',
      witnesses: '',
      area: '',
      date: '',
    },
  });
  
  const currentIncident = incident ? incidents.find(i => i.incident_id === incident.incident_id) || null : null;

  useEffect(() => {
    if (currentIncident) {
      form.reset({
        description: currentIncident.description,
        type: currentIncident.type,
        severity: currentIncident.severity,
        status: currentIncident.status,
        assigned_to: currentIncident.assigned_to || '',
        person_involved: currentIncident.person_involved || '',
        witnesses: currentIncident.witnesses || '',
        area: currentIncident.area,
        date: format(parseISO(currentIncident.date), "yyyy-MM-dd'T'HH:mm"),
      });
      setNewComment('');
    }
  }, [currentIncident, form, isOpen]);

  if (!currentIncident) return null;

  const handleStartInvestigation = async () => {
    setIsCreatingInvestigation(true);
    try {
      const newInvestigationId = await createInvestigationForIncident(currentIncident);
      if (newInvestigationId) {
        toast({
          title: 'Investigation Started',
          description: `An investigation has been created for incident ${currentIncident.display_id}.`,
        });
        onOpenChange(false);
        router.push(`/investigations?id=${newInvestigationId}`);
      } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to create investigation or get its ID.'
          });
      }
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Could not start investigation.'
      });
    } finally {
      setIsCreatingInvestigation(false);
    }
  };

  const handleSubmit = (values: IncidentFormValues) => {
    const updatedIncident = { 
        ...currentIncident,
        ...values,
        date: new Date(values.date).toISOString(),
        assigned_to: values.assigned_to || undefined,
        person_involved: values.person_involved || undefined,
        witnesses: values.witnesses || undefined,
    };
    updateIncident(updatedIncident);
    toast({ title: 'Incident Updated', description: `Incident ${currentIncident.display_id} has been updated.` });
    onOpenChange(false);
  };

  const handleAddComment = () => {
    if (newComment.trim()) {
      addCommentToIncident(currentIncident.incident_id, { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() });
      setNewComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Incident Details: {currentIncident.display_id}</DialogTitle>
           <DialogDescription>
            Reported on {format(new Date(currentIncident.date), 'PPP p')} in {currentIncident.area}
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh]">
          <div className="md:col-span-2 overflow-y-auto pr-4 space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 flex flex-col h-full">
                <div className="space-y-6 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                       <FormField
                          control={form.control}
                          name="type"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      <SelectItem value="Incident">Incident</SelectItem>
                                      <SelectItem value="Accident">Accident</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                       <FormField
                          control={form.control}
                          name="status"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Status</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      <SelectItem value="Open">Open</SelectItem>
                                      <SelectItem value="Under Investigation">Under Investigation</SelectItem>
                                      <SelectItem value="Closed">Closed</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                       <FormField
                          control={form.control}
                          name="severity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Severity</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                  <SelectContent>
                                      <SelectItem value="Low">Low</SelectItem>
                                      <SelectItem value="Medium">Medium</SelectItem>
                                      <SelectItem value="High">High</SelectItem>
                                  </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                    </div>
                     <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Date and Time of Incident</FormLabel>
                                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl><Textarea rows={4} {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField control={form.control} name="area" render={({ field }) => (
                            <FormItem><FormLabel>Area</FormLabel><FormControl><Input placeholder="e.g., Warehouse Section B" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="assigned_to" render={({ field }) => (
                            <FormItem><FormLabel>Assigned To</FormLabel><FormControl><Input placeholder="e.g., Safety Manager" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="person_involved" render={({ field }) => (
                            <FormItem><FormLabel>Person Involved</FormLabel><FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="witnesses" render={({ field }) => (
                            <FormItem><FormLabel>Witnesses</FormLabel><FormControl><Input placeholder="e.g., Mike, Bob" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
                <DialogFooter className="!justify-between pt-4 mt-auto border-t">
                  <div>
                    {currentIncident.investigation_id ? (
                      <Button type="button" variant="outline" asChild>
                        <Link href={`/investigations?id=${currentIncident.investigation_id}`}>View Investigation</Link>
                      </Button>
                    ) : (
                      <Button type="button" variant="outline" onClick={handleStartInvestigation} disabled={isCreatingInvestigation}>
                        {isCreatingInvestigation ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <FileSearch className="mr-2 h-4 w-4" />
                        )}
                        Start Investigation
                      </Button>
                    )}
                  </div>
                  <Button type="submit">Save & Close</Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
          <div className="md:col-span-1 flex flex-col gap-4 border-l pl-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments ({currentIncident.comments.length})</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {currentIncident.comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar>
                    <AvatarImage src={`https://placehold.co/40x40.png?text=${comment.user.charAt(0)}`} />
                    <AvatarFallback>{comment.user.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-sm">{comment.user}</p>
                      <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</p>
                    </div>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg mt-1">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-auto">
               <Textarea 
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={2}
              />
              <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>Add Comment</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function IncidentsPage() {
  const { incidents, deleteIncident, users } = useAppData();
  const { user: authUser } = useAuth();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDetailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [isNewIncidentOpen, setNewIncidentOpen] = useState(false);
  const { toast } = useToast();

  const userRole = authUser?.uid === 'admin-user-id-001' 
    ? 'Administrator' 
    : users.find(u => u.id === authUser?.uid)?.role;
  
  const isAdmin = userRole === 'Administrator';
    
  const typeVariant: { [key in Incident['type']]: 'destructive' | 'secondary' } = {
    'Accident': 'destructive',
    'Incident': 'secondary',
  };

  const severityVariant: { [key in Incident['severity']]: 'destructive' | 'secondary' | 'default' } = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'default',
  };

  const statusVariant: { [key in Incident['status']]: 'destructive' | 'secondary' | 'default' | 'outline' } = {
    'Open': 'secondary',
    'Under Investigation': 'default',
    'Closed': 'outline',
  };

  const handleRowClick = (incident: Incident) => {
    setSelectedIncident(incident);
    setDetailsDialogOpen(true);
  }

  const handleDelete = (e: React.MouseEvent, incidentId: string) => {
    e.stopPropagation();
    deleteIncident(incidentId);
    toast({
        title: 'Incident Deleted',
        description: 'The incident has been permanently removed.',
        variant: 'destructive',
    });
  };
  
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Incident Log</h2>
           <Dialog open={isNewIncidentOpen} onOpenChange={setNewIncidentOpen}>
                <DialogTrigger asChild>
                    <Button>
                        <FilePlus2 className="mr-2 h-4 w-4" /> Add New Incident
                    </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                    <IncidentReportForm setOpen={setNewIncidentOpen} />
                </DialogContent>
            </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Incidents</CardTitle>
            <CardDescription>A comprehensive list of all recorded safety incidents. Click on a row to view details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="w-[30%]">Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Person Involved</TableHead>
                  <TableHead>Witnesses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.incident_id} onClick={() => handleRowClick(incident)} className="cursor-pointer">
                    <TableCell className="font-medium">{incident.display_id}</TableCell>
                    <TableCell>{new Date(incident.date).toLocaleDateString()}</TableCell>
                    <TableCell>{incident.area}</TableCell>
                    <TableCell>
                      <Badge variant={typeVariant[incident.type]}>{incident.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">{incident.description}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
                    </TableCell>
                    <TableCell>{incident.person_involved || 'N/A'}</TableCell>
                    <TableCell>{incident.witnesses || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        {isAdmin && (
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={(e) => e.stopPropagation()}>
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            This will permanently delete incident <span className="font-mono">{incident.display_id}</span>. This action cannot be undone.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                        <AlertDialogAction onClick={(e) => handleDelete(e, incident.incident_id)}>Delete</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <IncidentDetailsDialog 
        incident={selectedIncident}
        isOpen={isDetailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </AppShell>
  );
}
