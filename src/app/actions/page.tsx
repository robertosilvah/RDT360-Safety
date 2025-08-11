

'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { CorrectiveAction, Incident, Observation, Comment } from '@/types';
import { PlusCircle, Siren, Eye, MessageSquare, User, Clock, CheckCircle, AlertTriangle, List, Truck, FileSearch, UserSquare, KanbanSquare as KanbanSquareIcon, Paperclip, PauseCircle } from 'lucide-react';
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
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { KanbanSquare } from 'lucide-react';
import { useAppData } from '@/context/AppDataContext';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

const actionFormSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  responsible_person: z.string().min(2, 'Responsible person is required.'),
  due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
  status: z.enum(['Pending', 'In Progress', 'Completed', 'Overdue', 'On Hold']).optional(),
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
                        <SelectItem value="On Hold">On Hold</SelectItem>
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
                            key={'incident_id' in item ? item.incident_id! : item.observation_id!}
                            value={'incident_id' in item ? item.incident_id! : item.observation_id!}
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
          <Button type="submit">{isEdit ? 'Save & Close' : 'Create Action'}</Button>
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
    const { user } = useAuth();
    const { correctiveActions, updateCorrectiveAction, addCommentToAction, incidents, observations, uploadSettings } = useAppData();
    const [newComment, setNewComment] = useState('');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();
    
    const currentAction = action ? correctiveActions.find(a => a.action_id === action.action_id) || null : null;
    
    useEffect(() => {
        if (!isOpen) {
            setNewComment('');
            setImageFile(null);
            setImagePreview(null);
        }
    }, [isOpen]);

    if (!currentAction) return null;

    const handleSave = (values: ActionFormValues) => {
        const actionToUpdate = correctiveActions.find(a => a.action_id === currentAction.action_id);
        if (!actionToUpdate) return;
        
        const updatedAction = { 
            ...actionToUpdate, 
            description: values.description,
            responsible_person: values.responsible_person,
            due_date: values.due_date ? new Date(values.due_date).toISOString() : actionToUpdate.due_date,
            status: values.status || actionToUpdate.status,
            comments: [...actionToUpdate.comments], // Start with existing comments
        };
        
        const logs: string[] = [];

        if(updatedAction.status !== actionToUpdate.status) {
            logs.push(`Status changed from ${actionToUpdate.status} to ${updatedAction.status}.`);
        }
        if(format(parseISO(updatedAction.due_date), 'yyyy-MM-dd') !== format(parseISO(actionToUpdate.due_date), 'yyyy-MM-dd')) {
            logs.push(`Due date changed from ${format(parseISO(actionToUpdate.due_date), 'P')} to ${format(parseISO(updatedAction.due_date), 'P')}.`);
        }
        if(updatedAction.responsible_person !== actionToUpdate.responsible_person) {
            logs.push(`Responsible person changed from ${actionToUpdate.responsible_person} to ${updatedAction.responsible_person}.`);
        }
        if(updatedAction.description !== actionToUpdate.description) {
            logs.push(`Description was edited.`);
        }

        if (logs.length > 0) {
            updatedAction.comments.push({
                user: 'System Log',
                comment: logs.join('\n'),
                date: new Date().toISOString()
            });
        }
        
        updateCorrectiveAction(updatedAction);
        toast({
            title: 'Corrective Action Updated',
            description: 'The action has been updated.',
        });
    }

    const handleAddComment = () => {
        if(newComment.trim() || imageFile) {
            const comment: Omit<Comment, 'date' | 'user'> = {
                comment: newComment.trim(),
            };
            addCommentToAction(currentAction.action_id, comment, imageFile);
            setNewComment('');
            setImageFile(null);
            setImagePreview(null);
        }
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const maxSizeMB = uploadSettings?.imageMaxSizeMB || 5;
            if (file.size > maxSizeMB * 1024 * 1024) {
                toast({ variant: 'destructive', title: 'File too large', description: `Image must be smaller than ${maxSizeMB}MB.` });
                return;
            }
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };
    
    const getAvatarInitials = (name: string) => name === 'System Log' ? 'SL' : name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
    
    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <div className="max-h-[80vh] grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 space-y-6">
                        <ActionForm onSave={handleSave} setOpen={onOpenChange} initialValues={currentAction} isEdit incidents={incidents} observations={observations} />
                         <div className="text-xs text-muted-foreground">
                            Created on: {format(new Date(currentAction.created_date), 'PPP p')}
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-4 pt-2">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</h3>
                        <div className="space-y-4 max-h-[calc(70vh-220px)] overflow-y-auto pr-2">
                           {currentAction.comments.map((comment, index) => (
                                <div key={index} className="flex gap-3">
                                <Avatar>
                                    <AvatarImage src={comment.user !== 'System Log' ? `https://placehold.co/40x40.png?text=${getAvatarInitials(comment.user)}` : undefined} />
                                    <AvatarFallback>{getAvatarInitials(comment.user)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                    <p className="font-semibold text-sm">{comment.user}</p>
                                    <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</p>
                                    </div>
                                    <div className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg mt-1 space-y-2 whitespace-pre-wrap">
                                      <p>{comment.comment}</p>
                                      {comment.imageUrl && (
                                        <div className="relative aspect-video rounded-md overflow-hidden">
                                           <Image src={comment.imageUrl} alt="Comment attachment" fill className="object-cover" />
                                        </div>
                                      )}
                                    </div>
                                </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2">
                            {imagePreview && (
                                <div className="relative aspect-video rounded-md overflow-hidden">
                                    <Image src={imagePreview} alt="Comment preview" fill className="object-cover" />
                                </div>
                            )}
                            <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2}/>
                            <div className="flex justify-between items-center">
                                <Button size="sm" variant="ghost" type="button" onClick={() => imageInputRef.current?.click()}><Paperclip className="h-4 w-4" /></Button>
                                <input type="file" ref={imageInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() && !imageFile}>Add Comment</Button>
                            </div>
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
  'On Hold': 'outline',
};

const statusIcons: { [key in CorrectiveAction['status']]: React.ElementType } = {
  'Pending': Clock,
  'In Progress': Siren,
  'Completed': CheckCircle,
  'Overdue': AlertTriangle,
  'On Hold': PauseCircle,
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

const kanbanStatuses: CorrectiveAction['status'][] = ['Pending', 'In Progress', 'On Hold', 'Overdue', 'Completed'];

const CorrectiveActionsView = ({
    actions,
    openDetailsDialog,
    incidents,
    observations,
    investigations,
}: {
    actions: CorrectiveAction[];
    openDetailsDialog: (action: CorrectiveAction) => void;
    incidents: Incident[];
    observations: Observation[];
    investigations: any[];
}) => (
    <Tabs defaultValue="kanban" className="pt-4">
        <TabsList>
            <TabsTrigger value="kanban"><KanbanSquareIcon className="mr-2 h-4 w-4"/>Kanban View</TabsTrigger>
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
);

export default function CorrectiveActionsPage() {
  const { correctiveActions: allActions, addCorrectiveAction, incidents, observations, investigations } = useAppData();
  const { user } = useAuth();
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<CorrectiveAction | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);
  const { toast } = useToast();

  const myActions = useMemo(() => {
    if (!user?.displayName) return [];
    return allActions.filter(action => action.responsible_person === user.displayName);
  }, [allActions, user]);

  const handleSaveAction = (values: ActionFormValues) => {
      const baseAction = {
        description: values.description,
        responsible_person: values.responsible_person,
        due_date: new Date(values.due_date).toISOString(),
      };
      
      const linkedAction: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments' | 'created_date' | 'completion_date' | 'type' | 'status'> = {
          ...baseAction
      };
      
      if (values.linkType === 'incident' && values.linked_id) {
          linkedAction.related_to_incident = values.linked_id;
      }
      if (values.linkType === 'observation' && values.linked_id) {
          linkedAction.related_to_observation = values.linked_id;
      }

      addCorrectiveAction(linkedAction);
      toast({
        title: 'Corrective Action Created',
        description: 'The new action has been added to the list.',
      });
  };
  
  const openDetailsDialog = (action: CorrectiveAction) => {
    setSelectedAction(action);
    setDetailsOpen(true);
  }
  
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

        <Tabs defaultValue="all">
            <TabsList>
                <TabsTrigger value="all"><KanbanSquare className="mr-2 h-4 w-4"/>All Actions</TabsTrigger>
                <TabsTrigger value="my"><UserSquare className="mr-2 h-4 w-4"/>My Actions</TabsTrigger>
            </TabsList>
            <TabsContent value="all">
                <CorrectiveActionsView
                    actions={allActions}
                    openDetailsDialog={openDetailsDialog}
                    incidents={incidents}
                    observations={observations}
                    investigations={investigations}
                />
            </TabsContent>
            <TabsContent value="my">
                 <CorrectiveActionsView
                    actions={myActions}
                    openDetailsDialog={openDetailsDialog}
                    incidents={incidents}
                    observations={observations}
                    investigations={investigations}
                />
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
