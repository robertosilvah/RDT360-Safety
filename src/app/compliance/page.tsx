'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { UserPlus, Edit, Trash2, PlusCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isPast, format, formatDistanceToNowStrict } from 'date-fns';
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import type { ComplianceRecord } from '@/types';
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
import { Separator } from '@/components/ui/separator';

const trainingSchema = z.object({
  course: z.string().min(1, "Course name is required."),
  date: z.string().refine(val => val && !isNaN(Date.parse(val)), { message: "A valid date is required." }),
});

const complianceFormSchema = z.object({
  employee_id: z.string().min(1, "Please select an employee."),
  cert_renewals_due: z.string().optional(),
  next_review_date: z.string().refine(val => val && !isNaN(Date.parse(val)), { message: "A valid next review date is required." }),
  training_completed: z.array(trainingSchema).min(1, "At least one training record is required."),
});

type ComplianceFormValues = z.infer<typeof complianceFormSchema>;

const ComplianceForm = ({
  setOpen,
  record,
  isEdit,
}: {
  setOpen: (open: boolean) => void;
  record?: ComplianceRecord;
  isEdit: boolean;
}) => {
  const { users, complianceRecords, addComplianceRecord, updateComplianceRecord } = useAppData();
  const { toast } = useToast();

  const form = useForm<ComplianceFormValues>({
    resolver: zodResolver(complianceFormSchema),
    defaultValues: {
      employee_id: record?.employee_id || '',
      cert_renewals_due: record?.cert_renewals_due === 'N/A' || !record?.cert_renewals_due ? '' : format(new Date(record.cert_renewals_due), "yyyy-MM-dd"),
      next_review_date: record ? format(new Date(record.next_review_date), "yyyy-MM-dd") : '',
      training_completed: record?.training_completed.map(t => ({ ...t, date: format(new Date(t.date), "yyyy-MM-dd") })) || [{ course: '', date: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'training_completed',
  });

  const onSubmit = (data: ComplianceFormValues) => {
    const employee = users.find(u => u.id === data.employee_id);
    if (!employee) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected employee not found.' });
      return;
    }

    const newRecord: ComplianceRecord = {
      employee_id: data.employee_id,
      name: employee.name,
      cert_renewals_due: data.cert_renewals_due ? new Date(data.cert_renewals_due).toISOString() : 'N/A',
      next_review_date: new Date(data.next_review_date).toISOString(),
      training_completed: data.training_completed.map(t => ({...t, date: new Date(t.date).toISOString() })),
    };

    if (isEdit) {
      updateComplianceRecord(newRecord);
      toast({ title: 'Record Updated' });
    } else {
      addComplianceRecord(newRecord);
      toast({ title: 'Record Added' });
    }
    setOpen(false);
  };
  
  const availableUsers = isEdit 
    ? users 
    : users.filter(u => !complianceRecords.some(cr => cr.employee_id === u.id));

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Compliance Record' : 'Add New Compliance Record'}</DialogTitle>
          <DialogDescription>
            {isEdit ? `Update the compliance record for ${record?.name}.` : 'Add a new employee compliance record.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
          <FormField
            control={form.control}
            name="employee_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employee</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isEdit}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an employee" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {availableUsers.map(user => (
                      <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cert_renewals_due"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Certification Renewal</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="next_review_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Next Review Date</FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />
          <div>
            <h3 className="text-lg font-medium mb-2">Training History</h3>
            <div className="space-y-4">
              {fields.map((field, index) => (
                <Card key={field.id} className="p-4 relative bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`training_completed.${index}.course`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name</FormLabel>
                          <FormControl><Input placeholder="e.g., Fire Safety" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`training_completed.${index}.date`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Completion Date</FormLabel>
                          <FormControl><Input type="date" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => remove(index)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </Card>
              ))}
              <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ course: '', date: '' })}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Training Record
              </Button>
            </div>
             <FormField control={form.control} name="training_completed" render={() => <FormMessage />} />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save Changes' : 'Add Record'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function CompliancePage() {
  const { complianceRecords, users, removeComplianceRecord } = useAppData();
  const { toast } = useToast();
  const [isDialogOpen, setDialogOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ComplianceRecord | null>(null);

  const handleOpenDialog = (record?: ComplianceRecord) => {
    setSelectedRecord(record || null);
    setDialogOpen(true);
  };
  
  const handleRemoveRecord = (employeeId: string) => {
    removeComplianceRecord(employeeId);
    toast({
        title: 'Record Removed',
        description: 'The compliance record has been removed.',
        variant: 'destructive',
    });
  };

  const sortedRecords = [...complianceRecords].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Employee Compliance</h2>
          <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()}>
                <UserPlus className="mr-2 h-4 w-4" /> Add Employee Record
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <ComplianceForm setOpen={setDialogOpen} record={selectedRecord || undefined} isEdit={!!selectedRecord} />
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Training & Certification Status</CardTitle>
            <CardDescription>Track employee compliance with safety training and certifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Last Training Completed</TableHead>
                  <TableHead>Certification Renewal</TableHead>
                  <TableHead>Next Review</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedRecords.map((record) => {
                  const lastTraining = record.training_completed.length > 0 ? [...record.training_completed].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] : null;
                  const isRenewalDue = record.cert_renewals_due !== 'N/A' && isPast(new Date(record.cert_renewals_due));
                  
                  return (
                    <TableRow key={record.employee_id}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{lastTraining ? `${lastTraining.course} on ${new Date(lastTraining.date).toLocaleDateString()}` : 'N/A'}</TableCell>
                      <TableCell>
                        {record.cert_renewals_due === 'N/A' ? (
                          <Badge variant="outline">N/A</Badge>
                        ) : (
                          <Badge variant={isRenewalDue ? 'destructive' : 'default'}>
                            {new Date(record.cert_renewals_due).toLocaleDateString()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNowStrict(new Date(record.next_review_date), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(record)}>
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
                                This will permanently delete the compliance record for {record.name}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleRemoveRecord(record.employee_id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
