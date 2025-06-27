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
import { mockCorrectiveActions, mockIncidents, mockObservations } from '@/lib/mockData';
import type { CorrectiveAction, Incident, Observation } from '@/types';
import { PlusCircle, Siren, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';

const actionFormSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters.'),
  responsible_person: z.string().min(2, 'Responsible person is required.'),
  due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
  linkType: z.enum(['incident', 'observation']).optional(),
  linked_id: z.string().optional(),
});

type ActionFormValues = z.infer<typeof actionFormSchema>;

const CreateActionForm = ({
  onAddAction,
  setOpen,
}: {
  onAddAction: (action: CorrectiveAction) => void;
  setOpen: (open: boolean) => void;
}) => {
  const { toast } = useToast();
  const form = useForm<ActionFormValues>({
    resolver: zodResolver(actionFormSchema),
    defaultValues: {
      description: '',
      responsible_person: '',
    },
  });

  const linkType = form.watch('linkType');

  const onSubmit = (data: ActionFormValues) => {
    const newAction: CorrectiveAction = {
      action_id: `ACT${String(Math.floor(Math.random() * 900) + 100)}`,
      description: data.description,
      responsible_person: data.responsible_person,
      due_date: new Date(data.due_date).toISOString(),
      status: 'Pending',
      related_to_incident: data.linkType === 'incident' ? data.linked_id : undefined,
      related_to_observation: data.linkType === 'observation' ? data.linked_id : undefined,
    };

    onAddAction(newAction);
    toast({
      title: 'Corrective Action Created',
      description: 'The new action has been added to the list.',
    });
    setOpen(false);
    form.reset();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create a New Corrective Action</DialogTitle>
          <DialogDescription>Fill in the details to create a new action item.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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

          <FormField
            control={form.control}
            name="linkType"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Link to (Optional)</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex space-x-4"
                  >
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="incident" />
                      </FormControl>
                      <FormLabel className="font-normal">Incident</FormLabel>
                    </FormItem>
                    <FormItem className="flex items-center space-x-2 space-y-0">
                      <FormControl>
                        <RadioGroupItem value="observation" />
                      </FormControl>
                      <FormLabel className="font-normal">Observation</FormLabel>
                    </FormItem>
                  </RadioGroup>
                </FormControl>
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
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={`Select a ${linkType}`}
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(linkType === 'incident' ? mockIncidents : mockObservations).map(
                        (item) => (
                          <SelectItem
                            key={
                              'incident_id' in item ? item.incident_id : item.observation_id
                            }
                            value={
                              'incident_id' in item ? item.incident_id : item.observation_id
                            }
                          >
                            {'incident_id' in item ? item.incident_id : item.observation_id}
                            : {item.description.substring(0, 50)}...
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
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Create Action</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function CorrectiveActionsPage() {
  const [actions, setActions] = useState<CorrectiveAction[]>(mockCorrectiveActions);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const statusVariant: { [key in CorrectiveAction['status']]: 'destructive' | 'secondary' | 'default' | 'outline' } = {
    'Overdue': 'destructive',
    'Pending': 'secondary',
    'In Progress': 'default',
    'Completed': 'outline',
  };

  const handleAddAction = (newAction: CorrectiveAction) => {
    setActions((prevActions) => [newAction, ...prevActions]);
  };

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
            <DialogContent>
              <CreateActionForm onAddAction={handleAddAction} setOpen={setCreateDialogOpen} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Track all corrective actions from incidents and observations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actions.map((action) => (
                  <TableRow key={action.action_id}>
                    <TableCell className="font-medium">{action.action_id}</TableCell>
                    <TableCell className="max-w-sm truncate">{action.description}</TableCell>
                    <TableCell>
                      {action.related_to_incident && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/incidents">
                            <Siren className="mr-2 h-4 w-4 text-red-500" />
                            {action.related_to_incident}
                          </Link>
                        </Button>
                      )}
                      {action.related_to_observation && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link href="/observations">
                            <Eye className="mr-2 h-4 w-4 text-blue-500" />
                            {action.related_to_observation}
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
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
