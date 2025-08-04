
'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { WorkHoursLog } from '@/types';

const workHoursFormSchema = z.object({
  log_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'A valid date is required.' }),
  hours_worked: z.coerce.number().min(1, 'Hours worked must be greater than 0.'),
  notes: z.string().optional(),
});

type WorkHoursFormValues = z.infer<typeof workHoursFormSchema>;

const WorkHoursForm = ({
  log,
  onSave,
  setOpen,
  isEdit = false,
}: {
  log?: WorkHoursLog;
  onSave: (data: WorkHoursFormValues, isEdit: boolean, logId?: string) => void;
  setOpen: (open: boolean) => void;
  isEdit?: boolean;
}) => {
  const form = useForm<WorkHoursFormValues>({
    resolver: zodResolver(workHoursFormSchema),
    defaultValues: {
      log_date: log ? format(new Date(log.log_date), 'yyyy-MM-dd') : '',
      hours_worked: log?.hours_worked || 0,
      notes: log?.notes || '',
    },
  });

  const onSubmit = (data: WorkHoursFormValues) => {
    onSave(data, isEdit, log?.id);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Work Hours Log' : 'Add New Work Hours Log'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details for this log entry.' : 'Log the total hours worked for a specific day.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="log_date"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hours_worked"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Hours Worked</FormLabel>
                <FormControl><Input type="number" placeholder="e.g., 800" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (optional)</FormLabel>
                <FormControl><Input placeholder="e.g., Includes overtime for Project X" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Log'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


export default function WorkHoursPage() {
  const { workHours, addWorkHoursLog, updateWorkHoursLog, removeWorkHoursLog } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkHoursLog | undefined>(undefined);
  const { toast } = useToast();

  const handleSave = (data: WorkHoursFormValues, isEdit: boolean, logId?: string) => {
    const logData = {
        log_date: new Date(data.log_date).toISOString(),
        hours_worked: data.hours_worked,
        notes: data.notes,
    }
    if (isEdit && logId) {
      updateWorkHoursLog({ id: logId, ...logData });
      toast({ title: 'Log Updated', description: 'The work hours log has been updated.' });
    } else {
      addWorkHoursLog(logData);
      toast({ title: 'Log Added', description: 'The new work hours have been logged.' });
    }
  };

  const openForm = (log?: WorkHoursLog) => {
    setEditingLog(log);
    setFormOpen(true);
  };
  
  const sortedLogs = [...workHours].sort((a,b) => new Date(b.log_date).getTime() - new Date(a.log_date).getTime());

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Work Hours Log</CardTitle>
                <CardDescription>Log total person-hours worked. This is used for calculating safety metrics like LTIFR.</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
                <DialogTrigger asChild>
                <Button onClick={() => openForm()}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Log Entry
                </Button>
                </DialogTrigger>
                <DialogContent>
                <WorkHoursForm
                    log={editingLog}
                    onSave={handleSave}
                    setOpen={setFormOpen}
                    isEdit={!!editingLog}
                />
                </DialogContent>
            </Dialog>
            </CardHeader>
            <CardContent>
            <Table>
                <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Hours Worked</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {sortedLogs.map((log) => (
                    <TableRow key={log.id}>
                    <TableCell className="font-medium">{format(new Date(log.log_date), 'PPP')}</TableCell>
                    <TableCell>{log.hours_worked.toLocaleString()}</TableCell>
                    <TableCell>{log.notes || 'N/A'}</TableCell>
                    <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => openForm(log)}>
                        <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete the log for {format(new Date(log.log_date), 'PPP')}. This action cannot be undone.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => removeWorkHoursLog(log.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                        </AlertDialog>
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
