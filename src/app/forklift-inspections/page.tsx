
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
  CardFooter
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { useAppData } from '@/context/AppDataContext';
import { FORKLIFT_CHECKLIST_QUESTIONS } from '@/lib/mockData';
import type { ForkliftInspection } from '@/types';
import { PlusCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

// Schema for the corrective action creation dialog
const actionFormSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  responsible_person: z.string().min(2, "Responsible person is required."),
  due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
});
type ActionFormValues = z.infer<typeof actionFormSchema>;

// Schema for the main inspection form
const inspectionFormSchema = z.object({
  forklift_id: z.string().min(1, 'Please select a forklift.'),
  operator_name: z.string().min(2, 'Operator name is required.'),
  checklist: z.array(z.object({
    id: z.string(),
    question: z.string(),
    status: z.enum(['Pass', 'Fail', 'N/A'], { required_error: "Please select a status."}),
    comment: z.string().optional(),
    actionId: z.string().optional(),
  })),
});
type InspectionFormValues = z.infer<typeof inspectionFormSchema>;


// Dialog component for creating a corrective action for a failed item
const ActionCreateDialog = ({ 
    isOpen, 
    setOpen,
    forkliftId,
    checklistItem,
    onActionCreated
}: {
    isOpen: boolean;
    setOpen: (open: boolean) => void;
    forkliftId: string;
    checklistItem: { id: string, question: string };
    onActionCreated: (actionId: string) => void;
}) => {
    const { addCorrectiveAction } = useAppData();
    const { toast } = useToast();
    const form = useForm<ActionFormValues>({
        resolver: zodResolver(actionFormSchema),
        defaultValues: {
            description: `Forklift ${forkliftId}: Fix issue with "${checklistItem.question}"`,
            responsible_person: 'Maintenance',
        },
    });

    const onSubmit = (data: ActionFormValues) => {
        const newAction = {
            related_to_forklift_inspection: `${forkliftId}-${checklistItem.id}`,
            description: data.description,
            responsible_person: data.responsible_person,
            due_date: new Date(data.due_date).toISOString(),
            status: 'Pending' as const,
        };
        addCorrectiveAction(newAction);
        // This is tricky without getting the created action back.
        // For now, we'll just indicate something was created.
        onActionCreated("New Action"); 
        toast({ title: "Corrective Action Created", description: `An action has been created.` });
        setOpen(false);
    }

    return (
        <Dialog open={isOpen} onOpenChange={setOpen}>
            <DialogContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <DialogHeader>
                            <DialogTitle>Create Corrective Action</DialogTitle>
                            <DialogDescription>
                                Create a corrective action for the failed check on "{checklistItem.question}".
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                    <Textarea {...field} />
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
                                    <Input placeholder="e.g., Maintenance Lead" {...field} />
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
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit">Create Action</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

const ForkliftInspectionDetailsDialog = ({ 
    inspection,
    isOpen,
    onOpenChange
}: {
    inspection: ForkliftInspection | null;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}) => {
    if (!inspection) return null;

    const statusVariant: { [key in 'Pass' | 'Fail' | 'N/A']: 'outline' | 'destructive' | 'secondary' } = {
        'Pass': 'outline',
        'Fail': 'destructive',
        'N/A': 'secondary',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Inspection Details: {inspection.display_id}</DialogTitle>
                    <DialogDescription>
                        For Forklift {inspection.forklift_id} by {inspection.operator_name} on {new Date(inspection.date).toLocaleString()}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-4">
                     <Card>
                        <CardHeader>
                            <CardTitle>Checklist Results</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[50%]">Item</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Comment / Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {inspection.checklist.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{item.question}</TableCell>
                                            <TableCell><Badge variant={statusVariant[item.status]}>{item.status}</Badge></TableCell>
                                            <TableCell>
                                                {item.comment}
                                                {item.actionId && (
                                                    <Button variant="link" asChild className="p-0 h-auto font-semibold">
                                                        <Link href="/actions">Action: {item.actionId}</Link>
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                    <div className="p-4 border rounded-md bg-muted/50">
                        <h4 className="font-semibold text-base">Operator Signature</h4>
                        <p className="text-sm text-muted-foreground mt-2">
                            This inspection was submitted by <strong>{inspection.operator_name}</strong> on {new Date(inspection.date).toLocaleString()}.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}


export default function ForkliftInspectionPage() {
  const { forkliftInspections, addForkliftInspection, forklifts } = useAppData();
  const { toast } = useToast();
  const [actionDialogState, setActionDialogState] = useState<{isOpen: boolean; itemIndex: number | null}>({isOpen: false, itemIndex: null});
  const [selectedInspection, setSelectedInspection] = useState<ForkliftInspection | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: {
      forklift_id: '',
      operator_name: '',
      checklist: FORKLIFT_CHECKLIST_QUESTIONS.map(item => ({...item, status: 'Pass', comment: '', actionId: ''})),
    },
  });

  const { fields, update } = useFieldArray({
    control: form.control,
    name: 'checklist',
  });

  const forkliftId = form.watch('forklift_id');
  
  const onSubmit = (data: InspectionFormValues) => {
    const newInspection: Omit<ForkliftInspection, 'inspection_id' | 'display_id'> = {
        date: new Date().toISOString(),
        ...data,
    };
    addForkliftInspection(newInspection);
    toast({ title: 'Inspection Submitted', description: 'The forklift inspection has been successfully recorded.' });
    form.reset({
      forklift_id: '',
      operator_name: '',
      checklist: FORKLIFT_CHECKLIST_QUESTIONS.map(item => ({...item, status: 'Pass', comment: '', actionId: ''})),
    });
  };

  const openActionDialog = (index: number) => {
    if (!forkliftId) {
        toast({
            variant: "destructive",
            title: "Forklift Not Selected",
            description: "Please select a forklift before creating an action.",
        });
        return;
    }
    setActionDialogState({ isOpen: true, itemIndex: index });
  };
  
  const handleActionCreated = (actionId: string) => {
    if (actionDialogState.itemIndex !== null) {
        form.setValue(`checklist.${actionDialogState.itemIndex}.actionId`, actionId);
    }
  };

  const handleRowClick = (inspection: ForkliftInspection) => {
    setSelectedInspection(inspection);
    setDetailsOpen(true);
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Forklift Inspections</h2>
        
        <div className="grid gap-6 lg:grid-cols-2">
            <Card className="lg:col-span-1">
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <CardHeader>
                            <CardTitle>Start New Inspection</CardTitle>
                            <CardDescription>Fill out the pre-use checklist for a forklift.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6 max-h-[65vh] overflow-y-auto pr-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="forklift_id"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Forklift ID</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select a forklift" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {forklifts.map(fl => <SelectItem key={fl.id} value={fl.id}>{fl.id} - {fl.name}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="operator_name"
                                    render={({ field }) => (
                                        <FormItem>
                                        <FormLabel>Operator Name</FormLabel>
                                        <FormControl><Input placeholder="e.g., Jane Doe" {...field} /></FormControl>
                                        <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            
                            {fields.map((field, index) => (
                                <Card key={field.id} className="p-4 bg-muted/30">
                                    <FormLabel>{index + 1}. {field.question}</FormLabel>
                                    <FormField
                                        control={form.control}
                                        name={`checklist.${index}.status`}
                                        render={({ field: radioField }) => (
                                        <FormItem className="mt-2">
                                            <FormControl>
                                            <RadioGroup onValueChange={radioField.onChange} defaultValue={radioField.value} className="flex gap-4">
                                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Pass" /></FormControl><FormLabel className="font-normal">Pass</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Fail" /></FormControl><FormLabel className="font-normal">Fail</FormLabel></FormItem>
                                                <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="font-normal">N/A</FormLabel></FormItem>
                                            </RadioGroup>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    {form.watch(`checklist.${index}.status`) === 'Fail' && (
                                       <div className="mt-4 space-y-2">
                                            <FormField
                                                control={form.control}
                                                name={`checklist.${index}.comment`}
                                                render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Comments</FormLabel>
                                                    <FormControl><Textarea placeholder="Describe the issue..." {...field} value={field.value ?? ''} /></FormControl>
                                                </FormItem>
                                                )}
                                            />
                                            {form.watch(`checklist.${index}.actionId`) ? (
                                                <div className="text-sm font-medium text-primary">
                                                    Action Created: {form.watch(`checklist.${index}.actionId`)}
                                                </div>
                                            ) : (
                                                <Button type="button" size="sm" variant="secondary" onClick={() => openActionDialog(index)}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Create Corrective Action
                                                </Button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            ))}

                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full">Submit Inspection</Button>
                        </CardFooter>
                    </form>
                </Form>
            </Card>

            <Card className="lg:col-span-1">
                <CardHeader>
                    <CardTitle>Inspection History</CardTitle>
                    <CardDescription>A log of the most recent forklift inspections. Click a row to view details.</CardDescription>
                </CardHeader>
                <CardContent className="max-h-[75vh] overflow-y-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Forklift</TableHead>
                                <TableHead>Operator</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Failed Items</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {forkliftInspections.map(insp => {
                                const failedItems = insp.checklist.filter(item => item.status === 'Fail');
                                return (
                                <TableRow key={insp.inspection_id} onClick={() => handleRowClick(insp)} className="cursor-pointer">
                                    <TableCell className="font-medium">{insp.display_id}</TableCell>
                                    <TableCell>{insp.forklift_id}</TableCell>
                                    <TableCell>{insp.operator_name}</TableCell>
                                    <TableCell>{new Date(insp.date).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        {failedItems.length > 0 ? (
                                            <div className="flex items-center gap-2 text-destructive">
                                                <AlertTriangle className="h-4 w-4" />
                                                <span>{failedItems.length}</span>
                                            </div>
                                        ): (
                                            <span>0</span>
                                        )}
                                    </TableCell>
                                </TableRow>
                            )})}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
        
        {actionDialogState.isOpen && actionDialogState.itemIndex !== null && (
             <ActionCreateDialog 
                isOpen={actionDialogState.isOpen}
                setOpen={(isOpen) => setActionDialogState({isOpen, itemIndex: null})}
                forkliftId={forkliftId}
                checklistItem={form.getValues(`checklist.${actionDialogState.itemIndex}`)}
                onActionCreated={handleActionCreated}
             />
        )}

        <ForkliftInspectionDetailsDialog
            inspection={selectedInspection}
            isOpen={isDetailsOpen}
            onOpenChange={setDetailsOpen}
        />
      </div>
    </AppShell>
  );
}
