'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import type { SafetyWalk, Observation, Comment } from '@/types';
import { PlusCircle, Trash2, CheckCircle2, PlayCircle, Clock, MessageSquare, User, Users, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Slider } from '@/components/ui/slider';


const walkFormSchema = z.object({
  walker: z.string().min(2, 'Walker name is required.'),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
  people_involved: z.string().optional(),
  safety_feeling_scale: z.number().min(1).max(5).optional(),
  checklist_items: z.array(z.object({ item: z.string().min(3, 'Checklist item must be at least 3 characters.') })).min(1, 'At least one checklist item is required.'),
});

type WalkFormValues = z.infer<typeof walkFormSchema>;

const CreateWalkForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addSafetyWalk } = useAppData();
  const { toast } = useToast();
  const form = useForm<WalkFormValues>({
    resolver: zodResolver(walkFormSchema),
    defaultValues: {
      walker: '',
      people_involved: '',
      safety_feeling_scale: 3,
      checklist_items: [{ item: 'PPE Compliance' }, { item: 'Machine Guarding' }, { item: 'Housekeeping' }],
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'checklist_items',
  });

  const onSubmit = (values: WalkFormValues) => {
    const newWalk: SafetyWalk = {
      safety_walk_id: `SWALK${Date.now()}`,
      status: 'Scheduled',
      comments: [],
      ...values,
      date: new Date(values.date).toISOString(),
      checklist_items: values.checklist_items.map(item => ({ ...item, checked: false })),
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
          <DialogDescription>Schedule a new safety walk and define its checklist.</DialogDescription>
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
                  <div className="flex items-center gap-4 pt-2">
                    <Slider
                      defaultValue={[3]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={(value) => field.onChange(value[0])}
                      className="w-[90%]"
                    />
                    <span className="w-[10%] text-center font-bold text-lg text-primary">{field.value}</span>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Separator />
          <div>
            <FormLabel>Checklist Items</FormLabel>
            <div className="space-y-2 mt-2">
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2">
                  <FormField
                    control={form.control}
                    name={`checklist_items.${index}.item`}
                    render={({ field }) => (
                      <FormItem className="flex-grow">
                        <FormControl><Input {...field} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => append({ item: '' })}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Item
            </Button>
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

    const form = useForm<{
        status: SafetyWalk['status'];
        checklist_items: { item: string; checked: boolean }[];
    }>();
    
    useEffect(() => {
        if (walk) {
            form.reset({
                status: walk.status,
                checklist_items: [...walk.checklist_items]
            });
        }
    }, [walk, form]);

    if (!walk) return null;
    
    const handleSave = () => {
        const formValues = form.getValues();
        const allItemsChecked = formValues.checklist_items.every(item => item.checked);
        let finalStatus = formValues.status;
        
        if (formValues.status === 'In Progress' && allItemsChecked) {
            finalStatus = 'Completed';
        }

        const updatedWalk: SafetyWalk = {
            ...walk,
            status: finalStatus,
            checklist_items: formValues.checklist_items,
        };
        
        if (newComment.trim()) {
            addCommentToSafetyWalk(walk.safety_walk_id, {
                user: 'Safety Manager',
                comment: newComment.trim(),
                date: new Date().toISOString(),
            });
             // We need to add the comment to the updatedWalk object as well so it appears instantly
            updatedWalk.comments.push({user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString()});
            setNewComment('');
        }
        
        updateSafetyWalk(updatedWalk);
        toast({ title: 'Safety Walk Updated' });
        onOpenChange(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                 <DialogHeader>
                    <DialogTitle>Safety Walk Details: {walk.safety_walk_id}</DialogTitle>
                    <DialogDescription>
                        Walk on {format(new Date(walk.date), 'PPP')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh]">
                    <div className="md:col-span-2 space-y-6 overflow-y-auto pr-4">
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
                            <form>
                                <FormField
                                    control={form.control}
                                    name="status"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Status</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                                <Separator className="my-6" />
                                <div>
                                    <h3 className="text-lg font-semibold mb-4">Checklist Items</h3>
                                    <div className="space-y-2">
                                    {walk.checklist_items.map((item, index) => (
                                        <FormField
                                            key={index}
                                            control={form.control}
                                            name={`checklist_items.${index}.checked`}
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                                                     <FormControl>
                                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                                                     </FormControl>
                                                     <div className="space-y-1 leading-none">
                                                        <FormLabel>{item.item}</FormLabel>
                                                     </div>
                                                </FormItem>
                                            )}
                                        />
                                    ))}
                                    </div>
                                </div>
                            </form>
                        </Form>
                    </div>
                    <div className="md:col-span-1 flex flex-col gap-4">
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
                            <Button size="sm" onClick={handleSave} disabled={!newComment.trim() && !form.formState.isDirty}>
                                {newComment.trim() ? 'Save and Add Comment' : 'Save Changes'}
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
    const checkedItems = walk.checklist_items.filter(item => item.checked).length;
    return (checkedItems / totalItems) * 100;
  }
  
  const handleRowClick = (walk: SafetyWalk) => {
    const currentWalkState = safetyWalks.find(w => w.safety_walk_id === walk.safety_walk_id);
    setSelectedWalk(currentWalkState || walk);
    setDetailsOpen(true);
  };

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
                      <TableCell className="font-medium">{walk.safety_walk_id}</TableCell>
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
        walk={selectedWalk}
        isOpen={isDetailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AppShell>
  );
}
