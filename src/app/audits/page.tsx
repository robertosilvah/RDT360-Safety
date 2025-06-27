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
import { useAppData } from '@/context/AppDataContext';
import type { SafetyWalk, Observation, Area } from '@/types';
import { FileUp, CheckCircle2, PlayCircle, Clock, Eye, PlusCircle, Check, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { mockAreas } from '@/lib/mockData';
import { riskLabels } from '@/app/observations/page';
import Link from 'next/link';

const observationFormSchema = z.object({
  report_type: z.enum(['Safety Concern', 'Positive Observation', 'Near Miss']),
  submitted_by: z.string().min(2),
  description: z.string().min(10),
  actions: z.string().min(10),
  risk_level: z.coerce.number().min(1).max(4),
  unsafe_category: z.enum(['Unsafe Behavior', 'Unsafe Condition', 'N/A']),
});

type ObservationFormValues = z.infer<typeof observationFormSchema>;

const AddObservationForm = ({
  safetyWalk,
  setOpen,
}: {
  safetyWalk: SafetyWalk;
  setOpen: (open: boolean) => void;
}) => {
  const { addObservation } = useAppData();
  const { toast } = useToast();
  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationFormSchema),
    defaultValues: { risk_level: 1 },
  });

  const onSubmit = (values: ObservationFormValues) => {
    const newObservation: Observation = {
      observation_id: `OBS${Date.now()}`,
      safety_walk_id: safetyWalk.safety_walk_id,
      areaId: mockAreas.find(a => a.name.includes(safetyWalk.walker))?.area_id || mockAreas[0].area_id, // Simplified area linking
      date: new Date().toISOString(),
      status: 'Open',
      ...values,
    };
    addObservation(newObservation);
    toast({
      title: 'Observation Created',
      description: 'The new observation has been linked to this safety walk.',
    });
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Add Observation for {safetyWalk.safety_walk_id}</DialogTitle>
          <DialogDescription>Create a new observation linked to this safety walk.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField control={form.control} name="report_type" render={({ field }) => (
            <FormItem>
              <FormLabel>Report Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                <SelectItem value="Safety Concern">Safety Concern</SelectItem>
                <SelectItem value="Positive Observation">Positive Observation</SelectItem>
                <SelectItem value="Near Miss">Near Miss</SelectItem>
              </SelectContent></Select><FormMessage />
            </FormItem>
          )} />
          <FormField control={form.control} name="submitted_by" render={({ field }) => (
            <FormItem><FormLabel>Your Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="description" render={({ field }) => (
            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Describe what you observed..." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="actions" render={({ field }) => (
            <FormItem><FormLabel>Immediate Actions Taken</FormLabel><FormControl><Textarea placeholder="Describe what actions were taken..." {...field} /></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="risk_level" render={({ field }) => (
            <FormItem><FormLabel>Risk Evaluation</FormLabel><FormControl><RadioGroup onValueChange={(v) => field.onChange(parseInt(v))} defaultValue={String(field.value)} className="flex space-x-4">
              {[1, 2, 3, 4].map((level) => (<FormItem key={level} className="flex items-center space-x-2"><FormControl><RadioGroupItem value={String(level)} /></FormControl><FormLabel className="font-normal">{riskLabels[level]}</FormLabel></FormItem>))}
            </RadioGroup></FormControl><FormMessage /></FormItem>
          )} />
           <FormField control={form.control} name="unsafe_category" render={({ field }) => (
            <FormItem>
              <FormLabel>Unsafe Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent>
                  <SelectItem value="Unsafe Behavior">Unsafe Behavior</SelectItem>
                  <SelectItem value="Unsafe Condition">Unsafe Condition</SelectItem>
                  <SelectItem value="N/A">N/A</SelectItem>
              </SelectContent></Select><FormMessage />
            </FormItem>
          )} />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create Observation</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


const SafetyWalkDetailsDialog = ({ walk, isOpen, onOpenChange }: { walk: SafetyWalk | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
    const { observations } = useAppData();
    const [isAddObservationOpen, setAddObservationOpen] = useState(false);

    if (!walk) return null;

    const linkedObservations = observations.filter(obs => obs.safety_walk_id === walk.safety_walk_id);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>Safety Walk Details: {walk.safety_walk_id}</DialogTitle>
                    <DialogDescription>
                        Walk conducted by {walk.walker} on {format(new Date(walk.date), 'PPP')}.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-2">Checklist Items</h3>
                        <ul className="space-y-2">
                            {walk.checklist_items.map((item, index) => (
                                <li key={index} className="flex items-center gap-2 text-sm">
                                    {item.checked ? <Check className="h-4 w-4 text-green-500" /> : <X className="h-4 w-4 text-red-500" />}
                                    <span>{item.item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                    <Separator />
                    <div>
                        <div className="flex justify-between items-center mb-2">
                           <h3 className="text-lg font-semibold">Linked Observations ({linkedObservations.length})</h3>
                           <Dialog open={isAddObservationOpen} onOpenChange={setAddObservationOpen}>
                                <DialogTrigger asChild>
                                    <Button size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Observation</Button>
                                </DialogTrigger>
                                <DialogContent><AddObservationForm safetyWalk={walk} setOpen={setAddObservationOpen} /></DialogContent>
                           </Dialog>
                        </div>
                        <Card>
                            <CardContent className="pt-4">
                               {linkedObservations.length > 0 ? (
                                <Table>
                                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Description</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                                    <TableBody>
                                        {linkedObservations.map(obs => (
                                            <TableRow key={obs.observation_id}>
                                                <TableCell><Button variant="link" asChild><Link href={`/observations?id=${obs.observation_id}`}>{obs.observation_id}</Link></Button></TableCell>
                                                <TableCell>{obs.description}</TableCell>
                                                <TableCell><Badge variant={obs.status === 'Open' ? 'default' : 'outline'}>{obs.status}</Badge></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                               ) : <p className="text-sm text-muted-foreground text-center p-4">No observations linked to this safety walk.</p>}
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default function SafetyWalksPage() {
  const { safetyWalks } = useAppData();
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
    if (totalItems === 0) return 50; // In progress but no items yet
    const checkedItems = walk.checklist_items.filter(item => item.checked).length;
    return (checkedItems / totalItems) * 100;
  }
  
  const handleRowClick = (walk: SafetyWalk) => {
    setSelectedWalk(walk);
    setDetailsOpen(true);
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Safety Walk Tracker</h2>
          <Button>
            <FileUp className="mr-2 h-4 w-4" /> Create New Walk
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled & Completed Safety Walks</CardTitle>
            <CardDescription>Track and manage all safety walks. Click a row for details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Walker</TableHead>
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
