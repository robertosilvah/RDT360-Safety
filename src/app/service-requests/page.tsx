
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { mockAreas } from '@/lib/mockData';
import type { ServiceRequest, Area, Comment } from '@/types';
import { MessageSquare, User, Clock, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const requestFormSchema = z.object({
  submitted_by: z.string().min(2, 'Submitter name is required.'),
  areaId: z.string().min(1, 'Please select an area.'),
  request_type: z.enum(['Maintenance', 'PPE Request', 'Information', 'Other']),
  description: z.string().min(10, 'Description must be at least 10 characters.'),
});

type RequestFormValues = z.infer<typeof requestFormSchema>;

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


const RequestDetailsDialog = ({
  request,
  isOpen,
  onOpenChange,
}: {
  request: ServiceRequest | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  const { updateServiceRequest, addCommentToServiceRequest } = useAppData();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');

  const form = useForm<{
    status: ServiceRequest['status'];
    assigned_to: string;
  }>({
    defaultValues: {
      status: request?.status || 'Open',
      assigned_to: request?.assigned_to || '',
    },
  });

  useEffect(() => {
    if (request) {
      form.reset({
        status: request.status,
        assigned_to: request.assigned_to || '',
      });
      setNewComment('');
    }
  }, [request, form, isOpen]);

  if (!request) return null;

  const handleSubmit = (values: { status: ServiceRequest['status']; assigned_to: string }) => {
    const updatedRequest = { ...request, ...values, assigned_to: values.assigned_to || undefined };
    updateServiceRequest(updatedRequest);

    if (newComment.trim()) {
      addCommentToServiceRequest(request.request_id, {
        user: 'Safety Manager',
        comment: newComment.trim(),
        date: new Date().toISOString(),
      });
    }

    toast({ title: 'Service Request Updated', description: `Request ${request.request_id} has been updated.` });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Request Details: {request.request_id}</DialogTitle>
          <DialogDescription>
            Submitted by {request.submitted_by} on {format(new Date(request.date), 'PPP')}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
          <Card>
            <CardHeader><CardTitle>{request.request_type}</CardTitle></CardHeader>
            <CardContent><p className="text-muted-foreground">{request.description}</p></CardContent>
          </Card>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assigned To</FormLabel>
                      <FormControl><Input placeholder="e.g., Maintenance Team" {...field} /></FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="!justify-end pt-4">
                <Button type="submit">Save Changes</Button>
              </DialogFooter>
            </form>
          </Form>
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageSquare className="h-5 w-5" /> Comments ({request.comments.length})
            </h3>
            <div className="space-y-4">
              {request.comments.map((comment, index) => (
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
              <div className="flex gap-3 pt-4">
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

export default function ServiceRequestsPage() {
  const { serviceRequests, addServiceRequest } = useAppData();
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ServiceRequest | null>(null);
  const { toast } = useToast();

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: {
      submitted_by: '',
      areaId: '',
      request_type: 'Maintenance',
      description: '',
    },
  });

  const onSubmit = (values: RequestFormValues) => {
    const newRequest: ServiceRequest = {
      request_id: `SR${Date.now()}`,
      date: new Date().toISOString(),
      status: 'Open',
      comments: [],
      ...values,
    };
    addServiceRequest(newRequest);
    toast({ title: 'Service Request Submitted', description: 'Your request has been sent to the safety team.' });
    form.reset();
  };

  const handleRowClick = (request: ServiceRequest) => {
    const currentRequestState = serviceRequests.find(r => r.request_id === request.request_id);
    setSelectedRequest(currentRequestState || request);
    setDetailsOpen(true);
  };

  const statusVariant: { [key in ServiceRequest['status']]: 'destructive' | 'secondary' | 'default' } = {
    'Open': 'secondary',
    'In Progress': 'default',
    'Completed': 'outline',
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Service Requests</h2>

        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Submit a Request</CardTitle>
              <CardDescription>Need something? Fill out the form below.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="submitted_by"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Your Name</FormLabel>
                        <FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="areaId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Relevant Area</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select an area" /></SelectTrigger></FormControl>
                          <SelectContent><AreaSelectOptions areas={mockAreas} /></SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="request_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                          <SelectContent>
                            <SelectItem value="Maintenance">Maintenance</SelectItem>
                            <SelectItem value="PPE Request">PPE Request</SelectItem>
                            <SelectItem value="Information">Information</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
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
                        <FormControl><Textarea placeholder="Please provide details about your request..." {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full">
                    <PlusCircle className="mr-2 h-4 w-4" /> Submit Request
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Request History</CardTitle>
              <CardDescription>A log of all submitted requests. Click a row to see details and manage.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assigned To</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceRequests.map((request) => (
                    <TableRow key={request.request_id} onClick={() => handleRowClick(request)} className="cursor-pointer">
                      <TableCell className="font-medium">{request.request_id}</TableCell>
                      <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                      <TableCell>{request.request_type}</TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[request.status]}>{request.status}</Badge>
                      </TableCell>
                      <TableCell>{request.assigned_to || 'Unassigned'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
       <RequestDetailsDialog
          request={selectedRequest}
          isOpen={isDetailsOpen}
          onOpenChange={setDetailsOpen}
        />
    </AppShell>
  );
}
