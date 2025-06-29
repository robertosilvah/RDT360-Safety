
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CorrectiveAction, Incident, Observation, Comment } from '@/types';
import { PlusCircle, Siren, Eye, MessageSquare, User, Clock, CheckCircle, AlertTriangle, List, Truck, FileSearch } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KanbanSquare } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';

const actionFormSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  responsible_person: z.string().min(2, 'Responsible person is required.'),
  due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Overdue']).optional(),
  linkType: z.enum(['incident', 'observation']).optional(),
  linked_id: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

const ActionForm = ({
  onSave,
  setOpen,
  initialValues,
  isEdit = false,
  incidents,
  observations,
}: {
  onSave: (data: ActionFormValues, actionId?: string) => void;
  setOpen: (open: boolean) => void;
  initialValues?: CorrectiveAction;
  isEdit?: boolean;
  incidents: Incident[];
  observations: Observation[];
}) => {
  const { toast } = useToast();
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      description: initialValues?.description || '',
      responsible_person: initialValues?.responsible_person || '',
      due_date: initialValues ? format(new Date(initialValues.due_date), "yyyy-MM-dd") : '',
      status: initialValues?.status || 'Pending',
      linkType: initialValues?.related_to_incident ? 'incident' : initialValues?.related_to_observation ? 'observation' : undefined,
      linked_id: initialValues?.related_to_incident || initialValues?.related_to_observation || undefined,
    },
  });

  const linkType = form.watch('linkType');

  useEffect(() => {
    if (initialValues) {
        form.reset({
            description: initialValues.description,
            responsible_person: initialValues.responsible_person,
            due_date: format(new Date(initialValues.due_date), "yyyy-MM-dd"),
            status: initialValues.status,
            linkType: initialValues.related_to_incident ? 'incident' : initialValues.related_to_observation ? 'observation' : undefined,
            linked_id: initialValues.related_to_incident || initialValues.related_to_observation,
        });
    }
  }, [initialValues, form]);


  const onSubmit = (data: ActionFormValues) => {
    onSave(data, initialValues?.action_id);
    toast({
      title: isEdit ? 'Corrective Action Updated' : 'Corrective Action Created',
      description: isEdit ? 'The action has been updated.' : 'The new action has been added to the list.',
    });
    setOpen(false);
    if (!isEdit) form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Corrective Action' : 'Create a New Corrective Action'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details for this action item.' : 'Fill in the details to create a new action item.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="Describe the required action..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="responsible_person"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Responsible Person</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., John Doe" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="due_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Due Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {isEdit && <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Status</FormLabel>
                 <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />}

          <FormField
            control={form.control}
            name="linkType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Link to (Optional)</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                    <FormControl><SelectTrigger><SelectValue placeholder="Select an incident or observation"/></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="incident">Incident</SelectItem>
                        <SelectItem value="observation">Observation</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {linkType && (
            <FormField
              control={form.control}
              name="linked_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Select {linkType === 'incident' ? 'Incident' : 'Observation'}</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={`Select a ${linkType}`} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(linkType === 'incident' ? incidents : observations).map(
                        (item) => (
                          <SelectItem
                            key={'incident_id' in item ? item.incident_id : item.observation_id}
                            value={'incident_id' in item ? item.incident_id : item.observation_id}
                          >
                            {item.display_id}: {item.description.substring(0, 50)}...
                          </SelectItem>
                        )
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Create Action'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const ActionDetailsDialog = ({
    action, isOpen, onOpenChange,
} : {
    action: CorrectiveAction | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    const { correctiveActions, updateCorrectiveAction, addCommentToAction, incidents, observations } = useAppData();
    const [newComment, setNewComment] = useState('');
    
    if (!action) return null;

    const handleSave = (values: ActionFormValues) => {
        const actionToUpdate = correctiveActions.find(a => a.action_id === action.action_id);
        if (!actionToUpdate) return;
        
        const updatedAction = { 
            ...actionToUpdate, 
            ...values,
            due_date: values.due_date ? new Date(values.due_date).toISOString() : actionToUpdate.due_date,
        };
        updateCorrectiveAction(updatedAction);

        if (newComment.trim()) {
            addCommentToAction(action.action_id, { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() });
            setNewComment('');
        }
    }

    const handleAddComment = () => {
        if(newComment.trim()) {
            addCommentToAction(action.action_id, { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() });
            setNewComment('');
        }
    }
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <div className="max-h-[80vh] grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <ActionForm onSave={handleSave} setOpen={onOpenChange} initialValues={action} isEdit incidents={incidents} observations={observations} />
                    </div>
                    <div className="md:col-span-1 space-y-4 pt-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</h3>
                        <div className="space-y-4 max-h-[calc(70vh-150px)] overflow-y-auto pr-2">
                           {action.comments.map((comment, index) => (
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
                        <div className="flex flex-col gap-2">
                            <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2}/>
                            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>Add Comment</Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

const statusVariant: { [key in CorrectiveAction['status']]: 'destructive' | 'secondary' | 'default' | 'outline' } = {
  'Overdue': 'destructive',
  'Pending': 'secondary',
  'In Progress': 'default',
  'Completed': 'outline',
};

const statusIcons: { [key in CorrectiveAction['status']]: React.ElementType } = {
  'Pending': Clock,
  'In Progress': Siren,
  'Completed': CheckCircle,
  'Overdue': AlertTriangle,
}

const KanbanCard = ({ action, onClick }: { action: CorrectiveAction; onClick: () => void }) => {
    const Icon = statusIcons[action.status];
    return (
        <Card className="mb-2 cursor-pointer hover:shadow-md" onClick={onClick}>
            <CardContent className="p-3">
                <p className="font-semibold text-sm mb-2">{action.description}</p>
                <div className="text-xs text-muted-foreground space-y-1">
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3" />
                        <span>{action.responsible_person}</span>
                    </div>
                     <div className="flex items-center gap-2">
                        <Icon className="h-3 w-3" />
                        <span>Due: {new Date(action.due_date).toLocaleDateString()}</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};


export default function CorrectiveActionsPage() {
  const { correctiveActions: actions, addCorrectiveAction, incidents, observations, investigations } = useAppData();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const handleSaveAction = (values: ActionFormValues) => {
      const newAction: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'> = {
        description: values.description,
        responsible_person: values.responsible_person,
        due_date: new Date(values.due_date).toISOString(),
        status: 'Pending',
        related_to_incident: values.linkType === 'incident' ? values.linked_id : undefined,
        related_to_observation: values.linkType === 'observation' ? values.linked_id : undefined,
      };
      addCorrectiveAction(newAction);
  };
  
  const openDetailsDialog = (action: CorrectiveAction) => {
    const currentActionState = actions.find(a => a.action_id === action.action_id);
    setSelectedAction(currentActionState || action);
    setDetailsOpen(true);
  }
  
  const kanbanStatuses: CorrectiveAction['status'][] = ['Pending', 'In Progress', 'Overdue', 'Completed'];

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Corrective Actions</h2>
          <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Action
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ActionForm onSave={handleSaveAction} setOpen={setCreateDialogOpen} incidents={incidents} observations={observations}/>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="kanban">
            <TabsList>
                <TabsTrigger value="kanban"><KanbanSquare className="mr-2 h-4 w-4"/>Kanban View</TabsTrigger>
                <TabsTrigger value="table"><List className="mr-2 h-4 w-4"/>Table View</TabsTrigger>
            </TabsList>
            <TabsContent value="kanban" className="pt-4">
                <div className="flex gap-4 overflow-x-auto pb-4">
                    {kanbanStatuses.map(status => (
                        <div key={status} className="flex-shrink-0 w-80">
                            <Card className="bg-muted/40 h-full">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        {React.createElement(statusIcons[status], { className: "h-5 w-5" })}
                                        <span>{status}</span>
                                        <Badge variant="secondary" className="ml-auto">{actions.filter(a => a.status === status).length}</Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 h-[60vh] overflow-y-auto">
                                    {actions.filter(a => a.status === status).map(action => (
                                        <KanbanCard key={action.action_id} action={action} onClick={() => openDetailsDialog(action)} />
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </TabsContent>
            <TabsContent value="table" className="pt-4">
                <Card>
                <CardHeader>
                    <CardTitle>All Action Items</CardTitle>
                    <CardDescription>Track all corrective actions from incidents and observations. Click a row to see details.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead className="w-[40%]">Description</TableHead>
                        <TableHead>Related To</TableHead>
                        <TableHead>Responsible</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {actions.map((action) => {
                          const incident = action.related_to_incident ? incidents.find(i => i.incident_id === action.related_to_incident) : null;
                          const observation = action.related_to_observation ? observations.find(o => o.observation_id === action.related_to_observation) : null;
                          const investigation = action.related_to_investigation ? investigations.find(i => i.investigation_id === action.related_to_investigation) : null;
                          
                          return (
                            <TableRow key={action.action_id} onClick={() => openDetailsDialog(action)} className="cursor-pointer">
                                <TableCell className="font-medium">{action.display_id}</TableCell>
                                <TableCell className="max-w-sm truncate">{action.description}</TableCell>
                                <TableCell>
                                {incident && (
                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                    <Link href="/incidents">
                                        <Siren className="mr-2 h-4 w-4 text-red-500" />
                                        {incident.display_id}
                                    </Link>
                                    </Button>
                                )}
                                {observation && (
                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                    <Link href="/observations">
                                        <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                        {observation.display_id}
                                    </Link>
                                    </Button>
                                )}
                                {action.related_to_forklift_inspection && (
                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                    <Link href="/forklift-inspections">
                                        <Truck className="mr-2 h-4 w-4 text-green-500" />
                                        {action.related_to_forklift_inspection}
                                    </Link>
                                    </Button>
                                )}
                                {investigation && (
                                    <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
                                    <Link href={`/investigations?id=${investigation.investigation_id}`}>
                                        <FileSearch className="mr-2 h-4 w-4 text-purple-500" />
                                        {investigation.display_id}
                                    </Link>
                                    </Button>
                                )}
                                </TableCell>
                                <TableCell>{action.responsible_person}</TableCell>
                                <TableCell>{new Date(action.due_date).toLocaleDateString()}</TableCell>
                                <TableCell>
                                <Badge variant={statusVariant[action.status]}>{action.status}</Badge>
                                </TableCell>
                            </TableRow>
                          )
                        })}
                    </TableBody>
                    </Table>
                </CardContent>
                </Card>
            </TabsContent>
        </Tabs>

        <ActionDetailsDialog 
            action={selectedAction}
            isOpen={isDetailsOpen}
            onOpenChange={setDetailsOpen}
        />
      </div>
    </AppShell>
  );
}
