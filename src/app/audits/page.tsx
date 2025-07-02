
'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import type { SafetyWalk, PredefinedChecklistItem, SafetyWalkChecklistItem } from '@/types';
import { PlusCircle, Trash2, CheckCircle2, PlayCircle, Clock, MessageSquare, User, Users, Star, Edit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';


const walkFormSchema = z.object({
  walker: z.string().min(2, 'Walker name is required.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
  people_involved: z.string().optional(),
  safety_feeling_scale: z.number().min(1).max(5).optional(),
  checklist_items: z.array(z.object({
    id: z.string(),
    text: z.string(),
  })).min(1, 'At least one checklist item is required.'),
});

type WalkFormValues = z.infer<typeof walkFormSchema>;

const CreateWalkForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addSafetyWalk, predefinedChecklistItems } = useAppData();
  const { toast } = useToast();
  const [hoveredStars, setHoveredStars] = useState<number | null>(null);
  const [newItemId, setNewItemId] = useState('');

  const defaultPpeItem = predefinedChecklistItems.find(i => i.text === 'PPE Compliance');
  const defaultHousekeepingItem = predefinedChecklistItems.find(i => i.text === 'Housekeeping & Slip/Trip Hazards');

  const defaultItems = [];
  if (defaultPpeItem) defaultItems.push({ id: defaultPpeItem.id, text: defaultPpeItem.text });
  if (defaultHousekeepingItem) defaultItems.push({ id: defaultHousekeepingItem.id, text: defaultHousekeepingItem.text });


  const form = useForm<WalkFormValues>({
    resolver: zodResolver(walkFormSchema),
    defaultValues: {
      walker: '',
      date: '',
      people_involved: '',
      safety_feeling_scale: 3,
      checklist_items: defaultItems,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'checklist_items',
  });

  const onSubmit = (values: WalkFormValues) => {
    const checklistItems = values.checklist_items.map(item => ({
        item: item.text,
        status: 'Pending' as const,
        comment: '',
     }));

    const newWalk: SafetyWalk = {
      safety_walk_id: `SWALK${Date.now()}`,
      status: 'Scheduled',
      comments: [],
      walker: values.walker,
      date: new Date(values.date).toISOString(),
      people_involved: values.people_involved,
      safety_feeling_scale: values.safety_feeling_scale,
      checklist_items: checklistItems,
    };
    addSafetyWalk(newWalk);
    toast({
      title: 'Safety Walk Created',
      description: `The new walk for ${values.walker} has been scheduled.`,
    });
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create New Safety Walk</DialogTitle>
          <DialogDescription>Schedule a new safety walk. Default items can be removed, and more can be added from your predefined list.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="walker" render={({ field }) => (
              <FormItem><FormLabel>Walker / Team</FormLabel><FormControl><Input placeholder="e.g., Safety Team" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
           <FormField control={form.control} name="people_involved" render={({ field }) => (
              <FormItem><FormLabel>People Involved / Observed</FormLabel><FormControl><Input placeholder="e.g., John Doe, Mechanic Team" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          <FormField
            control={form.control}
            name="safety_feeling_scale"
            render={({ field }) => (
              <FormItem>
                <FormLabel>How safe does the involved person feel? (1=Unsafe, 5=Very Safe)</FormLabel>
                <FormControl>
                  <div className="flex items-center gap-2 pt-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          "h-8 w-8 cursor-pointer transition-colors",
                          (hoveredStars ?? field.value ?? 0) >= star
                            ? "text-yellow-400 fill-yellow-400"
                            : "text-gray-300"
                        )}
                        onClick={() => field.onChange(star)}
                        onMouseEnter={() => setHoveredStars(star)}
                        onMouseLeave={() => setHoveredStars(null)}
                      />
                    ))}
                    <span className="text-lg font-bold text-primary w-12 text-center">
                      {field.value} / 5
                    </span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <div>
            <h3 className="text-lg font-semibold">Checklist Items</h3>
            <FormDescription>Default items are added. Add more from the list below or remove items as needed.</FormDescription>
            <div className="space-y-2 mt-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center justify-between gap-2 border p-3 rounded-md bg-muted/30">
                  <span className="font-medium">{field.text}</span>
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
              {fields.length === 0 && <p className="text-sm text-muted-foreground pt-2">No checklist items. Please add at least one.</p>}
              <FormField control={form.control} name="checklist_items" render={() => <FormMessage />} />
            </div>
          </div>
          <Separator />
          <div>
            <FormLabel>Add a predefined item</FormLabel>
            <div className="flex items-center gap-2 mt-2">
              <Select onValueChange={setNewItemId} value={newItemId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an item to add..." />
                </SelectTrigger>
                <SelectContent>
                  {predefinedChecklistItems
                    .filter(item => !fields.some(field => field.id === item.id))
                    .map(item => (
                      <SelectItem key={item.id} value={item.id}>{item.text}</SelectItem>
                    ))
                  }
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  const itemToAdd = predefinedChecklistItems.find(i => i.id === newItemId);
                  if (itemToAdd) {
                    append({ id: itemToAdd.id, text: itemToAdd.text });
                    setNewItemId('');
                  }
                }}
                disabled={!newItemId}
              >
                <PlusCircle className="mr-2 h-4 w-4" /> Add
              </Button>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create Walk</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


const SafetyWalkDetailsDialog = ({ walk, isOpen, onOpenChange }: { walk: SafetyWalk | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { updateSafetyWalk, addCommentToSafetyWalk } = useAppData();
    const [newComment, setNewComment] = useState('');
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);

    const form = useForm<{
        status: SafetyWalk['status'];
        checklist_items: SafetyWalkChecklistItem[];
    }>({
        defaultValues: {
            status: 'Scheduled',
            checklist_items: [],
        },
    });
    
    useEffect(() => {
        if (walk) {
            form.reset({
                status: walk.status,
                checklist_items: walk.checklist_items ? [...walk.checklist_items.map(item => ({ ...item }))] : []
            });
            setIsEditing(false);
        }
    }, [walk, form, isOpen]);

    if (!walk) return null;
    
    const isLocked = walk.status === 'Completed' && !isEditing;

    const onValidSubmit = (data: { status: SafetyWalk['status'], checklist_items: SafetyWalkChecklistItem[] }) => {
        const allItemsAnswered = data.checklist_items.every(item => item.status !== 'Pending');
        let finalStatus = data.status;
        
        if (data.status === 'In Progress' && allItemsAnswered) {
            finalStatus = 'Completed';
        }

        const updatedWalk: SafetyWalk = {
            ...walk,
            status: finalStatus,
            checklist_items: data.checklist_items,
        };
        
        updateSafetyWalk(updatedWalk);
        toast({ title: 'Safety Walk Updated' });

        if(finalStatus === 'Completed') {
          setIsEditing(false); // relock if now completed
        }
    };
    
    const handleAddComment = () => {
        if(newComment.trim()) {
            addCommentToSafetyWalk(walk.safety_walk_id, {
                user: 'Safety Manager',
                comment: newComment.trim(),
                date: new Date().toISOString(),
            });
            setNewComment('');
        }
    };

    const handleEdit = () => {
        form.setValue('status', 'In Progress', { shouldDirty: true });
        setIsEditing(true);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>Safety Walk Details: {walk.display_id}</DialogTitle>
                    <DialogDescription>
                        Walk on {format(new Date(walk.date), 'PPP')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh]">
                    <div className="md:col-span-2 flex flex-col">
                        <div className="flex-1 space-y-6 overflow-y-auto pr-4">
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">Walker / Team</p>
                                            <p className="text-muted-foreground">{walk.walker}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">People Involved</p>
                                            <p className="text-muted-foreground">{walk.people_involved || 'N/A'}</p>
                                        </div>
                                    </div>
                                </div>
                                {walk.safety_feeling_scale && (
                                    <div className="flex items-center gap-2 mt-4">
                                        <Star className="h-4 w-4 text-muted-foreground" />
                                        <div>
                                            <p className="font-semibold">Perceived Safety Rating</p>
                                            <div className="flex items-center">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} className={`h-5 w-5 ${i < walk.safety_feeling_scale! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                ))}
                                                <span className="ml-2 text-muted-foreground">({walk.safety_feeling_scale} out of 5)</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <Separator />
                            <Form {...form}>
                                <form className="space-y-6">
                                    <FormField
                                        control={form.control}
                                        name="status"
                                        render={({ field }) => (
                                            <FormItem>
                                            <FormLabel>Status</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLocked}>
                                                <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                                    <SelectItem value="Completed">Completed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            </FormItem>
                                        )}
                                    />
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-4">Checklist Items</h3>
                                        <div className="space-y-4">
                                        {form.watch('checklist_items')?.map((item, index) => (
                                            <Card key={index} className="p-4 bg-muted/30">
                                                <FormLabel>{item.item}</FormLabel>
                                                <FormField
                                                    control={form.control}
                                                    name={`checklist_items.${index}.status`}
                                                    render={({ field }) => (
                                                    <FormItem className="mt-2">
                                                        <FormControl>
                                                        <RadioGroup
                                                            onValueChange={field.onChange}
                                                            value={field.value}
                                                            className="flex gap-4 pt-2"
                                                            disabled={isLocked}
                                                        >
                                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pass" /></FormControl><FormLabel className="font-normal">Pass</FormLabel></FormItem>
                                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Fail" /></FormControl><FormLabel className="font-normal">Fail</FormLabel></FormItem>
                                                            <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="font-normal">N/A</FormLabel></FormItem>
                                                        </RadioGroup>
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                    )}
                                                />
                                                {form.watch(`checklist_items.${index}.status`) === 'Fail' && (
                                                    <FormField
                                                        control={form.control}
                                                        name={`checklist_items.${index}.comment`}
                                                        render={({ field }) => (
                                                            <FormItem className="mt-4">
                                                            <FormLabel>Comments</FormLabel>
                                                            <FormControl><Textarea placeholder="Describe the issue..." {...field} value={field.value ?? ''} disabled={isLocked} /></FormControl>
                                                            <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                )}
                                            </Card>
                                        ))}
                                        </div>
                                    </div>
                                </form>
                            </Form>
                        </div>
                        <DialogFooter className="mt-auto pt-4 border-t">
                            {isLocked ? (
                                <Button onClick={handleEdit}>
                                    <Edit className="mr-2 h-4 w-4" /> Re-open and Edit
                                </Button>
                            ) : (
                                <Button onClick={form.handleSubmit(onValidSubmit)} disabled={!form.formState.isDirty}>
                                    Save Changes
                                </Button>
                            )}
                        </DialogFooter>
                    </div>
                    <div className="md:col-span-1 flex flex-col gap-4 border-l pl-6">
                        <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</h3>
                        <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                            {walk.comments.map((comment, index) => (
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
                            <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2}/>
                            <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                                Add Comment
                            </Button>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function SafetyWalksPage() {
  const { safetyWalks } = useAppData();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedWalk, setSelectedWalk] = useState<SafetyWalk | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const statusInfo: { [key in SafetyWalk['status']]: { variant: 'default' | 'secondary' | 'outline', icon: React.ElementType } } = {
    'Completed': { variant: 'default', icon: CheckCircle2 },
    'In Progress': { variant: 'secondary', icon: PlayCircle },
    'Scheduled': { variant: 'outline', icon: Clock },
  };

  const calculateProgress = (walk: SafetyWalk) => {
    if (walk.status === 'Completed') return 100;
    if (walk.status === 'Scheduled') return 0;
    const totalItems = walk.checklist_items.length;
    if (totalItems === 0) return 50;
    const completedItems = walk.checklist_items.filter(item => item.status !== 'Pending').length;
    return (completedItems / totalItems) * 100;
  }
  
  const handleRowClick = (walk: SafetyWalk) => {
    setSelectedWalk(walk);
    setDetailsOpen(true);
  };

  const currentSelectedWalk = selectedWalk
    ? safetyWalks.find(w => w.safety_walk_id === selectedWalk.safety_walk_id) || null
    : null;

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Safety Walks</h2>
          <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Create New Walk
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
                <CreateWalkForm setOpen={setCreateOpen} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Safety Walks</CardTitle>
            <CardDescription>A proactive tool to observe work environments, identify potential hazards, and engage with employees in real-time to foster a strong safety culture.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Walker</TableHead>
                  <TableHead>People Involved</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {safetyWalks.map((walk) => {
                  const Icon = statusInfo[walk.status].icon;
                  return (
                    <TableRow key={walk.safety_walk_id} onClick={() => handleRowClick(walk)} className="cursor-pointer">
                      <TableCell className="font-medium">{walk.display_id}</TableCell>
                      <TableCell>{new Date(walk.date).toLocaleDateString()}</TableCell>
                      <TableCell>{walk.walker}</TableCell>
                      <TableCell>{walk.people_involved || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo[walk.status].variant}>
                            <Icon className="mr-2 h-4 w-4"/>
                            {walk.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={calculateProgress(walk)} className="w-[60%]" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <SafetyWalkDetailsDialog
        walk={currentSelectedWalk}
        isOpen={isDetailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AppShell>
  );
}
