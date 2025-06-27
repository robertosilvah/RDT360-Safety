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
import type { Incident, Comment } from '@/types';
import { FilePlus2, Download, MessageSquare, User, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppData } from '@/context/AppDataContext';

const incidentFormSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  type: z.enum(['Incident', 'Accident']),
  severity: z.enum(['Low', 'Medium', 'High']),
  status: z.enum(['Open', 'Under Investigation', 'Closed']),
  assigned_to: z.string().optional(),
});

type IncidentFormValues = z.infer<typeof incidentFormSchema>;

const IncidentDetailsDialog = ({
  incident,
  isOpen,
  onOpenChange,
}: {
  incident: Incident | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { updateIncident, addCommentToIncident } = useAppData();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');

  const form = useForm<IncidentFormValues>({
    resolver: zodResolver(incidentFormSchema),
    defaultValues: {
      description: '',
      type: 'Incident',
      severity: 'Low',
      status: 'Open',
      assigned_to: '',
    },
  });
  
  useEffect(() => {
    if (incident) {
      form.reset({
        description: incident.description,
        type: incident.type,
        severity: incident.severity,
        status: incident.status,
        assigned_to: incident.assigned_to || '',
      });
      setNewComment('');
    }
  }, [incident, form, isOpen]);

  if (!incident) return null;

  const handleSubmit = (values: IncidentFormValues) => {
    const updatedIncident = { ...incident, ...values, assigned_to: values.assigned_to || undefined };
    updateIncident(updatedIncident);

    if (newComment.trim()) {
      addCommentToIncident(incident.incident_id, { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() });
    }
    
    toast({ title: 'Incident Updated', description: `Incident ${incident.incident_id} has been updated.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Incident Details: {incident.incident_id}</DialogTitle>
           <DialogDescription>
            Reported on {format(new Date(incident.date), 'PPP')} in {incident.area}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
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
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl><Input placeholder="e.g., Safety Manager" {...field} /></FormControl>
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
              <DialogFooter className="!justify-end">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>

          <Separator />
          
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5" /> Comments ({incident.comments.length})
            </h3>
            <div className="space-y-4">
              {incident.comments.map((comment, index) => (
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
              <div className="flex gap-3">
                 <Avatar>
                    <AvatarImage src={`https://placehold.co/40x40.png?text=SM`} />
                    <AvatarFallback>SM</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                     <Textarea 
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={2}
                    />
                    <Button size="sm" className="mt-2" onClick={() => handleSubmit(form.getValues())} disabled={!newComment.trim()}>Add Comment</Button>
                  </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};


export default function IncidentsPage() {
  const { incidents } = useAppData();
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  const [isDialogOpen, setDialogOpen] = useState(false);
    
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
    const currentIncidentState = incidents.find(i => i.incident_id === incident.incident_id);
    setSelectedIncident(currentIncidentState || incident);
    setDialogOpen(true);
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Incident Log</h2>
          <Button>
            <FilePlus2 className="mr-2 h-4 w-4" /> Add New Incident
          </Button>
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
                  <TableHead className="w-[40%]">Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned To</TableHead>
                  <TableHead>Docs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.incident_id} onClick={() => handleRowClick(incident)} className="cursor-pointer">
                    <TableCell className="font-medium">{incident.incident_id}</TableCell>
                    <TableCell>{new Date(incident.date).toLocaleDateString()}</TableCell>
                    <TableCell>{incident.area}</TableCell>
                    <TableCell>
                      <Badge variant={typeVariant[incident.type]}>{incident.type}</Badge>
                    </TableCell>
                    <TableCell className="max-w-md truncate">{incident.description}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[incident.status]}>{incident.status}</Badge>
                    </TableCell>
                    <TableCell>{incident.assigned_to || 'N/A'}</TableCell>
                    <TableCell>
                        {incident.linked_docs.length > 0 && (
                            <Button variant="outline" size="icon" onClick={(e) => e.stopPropagation()}>
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download Document</span>
                            </Button>
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
        isOpen={isDialogOpen}
        onOpenChange={setDialogOpen}
      />
    </AppShell>
  );
}
