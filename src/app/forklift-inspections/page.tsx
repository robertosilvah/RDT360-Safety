
'use client';

import React, { useState, Suspense, useEffect, useMemo } from 'react';
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
    DialogTrigger,
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
import type { Forklift, ForkliftInspection } from '@/types';
import { PlusCircle, AlertTriangle, Printer, Truck, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useSearchParams } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { isToday, format } from 'date-fns';

// Schema for the corrective action creation dialog
const actionFormSchema = z.object({
  description: z.string().min(10, "Description must be at least 10 characters."),
  responsible_person: z.string().min(2, "Responsible person is required."),
  due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), {
    message: 'Please enter a valid date.',
  }),
});
type ActionFormValues = z.infer<typeof actionFormSchema>;

const statusEnum = z.enum(['Pass', 'Fail', 'N/A'], { required_error: "Please select a status."});

// Schema for the main inspection form
const inspectionFormSchema = z.object({
  forklift_id: z.string().min(1, 'Please select a forklift.'),
  operator_name: z.string().min(2, 'Operator name is required.'),
  checklist: z.array(z.object({
    id: z.string(),
    question: z.string(),
    status: statusEnum,
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
            due_date: '',
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

const NewInspectionForm = ({ setOpen, defaultForkliftId }: { setOpen: (open: boolean) => void; defaultForkliftId?: string; }) => {
    const { addForkliftInspection, forklifts } = useAppData();
    const { toast } = useToast();
    const [actionDialogState, setActionDialogState] = useState<{ isOpen: boolean; itemIndex: number | null }>({ isOpen: false, itemIndex: null });

    const form = useForm<InspectionFormValues>({
        resolver: zodResolver(inspectionFormSchema),
        defaultValues: {
            forklift_id: defaultForkliftId || '',
            operator_name: '',
            checklist: FORKLIFT_CHECKLIST_QUESTIONS.map(item => ({ ...item, status: undefined, comment: '', actionId: '' })),
        },
    });

    const { fields } = useFieldArray({
        control: form.control,
        name: 'checklist',
    });

    const forkliftId = form.watch('forklift_id');
    
    useEffect(() => {
        if (defaultForkliftId) {
            form.setValue('forklift_id', defaultForkliftId);
        }
    }, [defaultForkliftId, form]);

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
            checklist: FORKLIFT_CHECKLIST_QUESTIONS.map(item => ({ ...item, status: undefined, comment: '', actionId: '' })),
        });
        setOpen(false);
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

    return (
        <>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>Start New Inspection</DialogTitle>
                        <DialogDescription>Fill out the pre-use checklist for a forklift.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 max-h-[65vh] overflow-y-auto pr-4 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="forklift_id"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Forklift ID</FormLabel>
                                        <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!!defaultForkliftId}>
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
                                                <RadioGroup onValueChange={radioField.onChange} value={radioField.value} className="flex gap-4">
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
                    </div>
                    <DialogFooter>
                       <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                       <Button type="submit">Submit Inspection</Button>
                    </DialogFooter>
                </form>
            </Form>

            {actionDialogState.isOpen && actionDialogState.itemIndex !== null && (
                <ActionCreateDialog
                    isOpen={actionDialogState.isOpen}
                    setOpen={(isOpen) => setActionDialogState({ isOpen, itemIndex: null })}
                    forkliftId={forkliftId}
                    checklistItem={form.getValues(`checklist.${actionDialogState.itemIndex}`)}
                    onActionCreated={handleActionCreated}
                />
            )}
        </>
    );
};

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

    const handlePrint = () => {
        window.open(`/forklift-inspections/${inspection.inspection_id}`, '_blank');
    };

    const statusVariant: { [key in 'Pass' | 'Fail' | 'N/A']: 'outline' | 'destructive' | 'secondary' } = {
        'Pass': 'outline',
        'Fail': 'destructive',
        'N/A': 'secondary',
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="flex justify-between items-center">
                        <span>Inspection Details: {inspection.display_id}</span>
                         <Button type="button" variant="ghost" size="icon" onClick={handlePrint}>
                            <Printer className="h-5 w-5" />
                            <span className="sr-only">Print</span>
                        </Button>
                    </DialogTitle>
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

const ForkliftStatusCard = ({ forklift, inspections, onNewInspection }: {
    forklift: Forklift;
    inspections: ForkliftInspection[];
    onNewInspection: (forkliftId: string) => void;
}) => {
    const passedCount = inspections.filter(i => i.checklist.every(c => c.status === 'Pass' || c.status === 'N/A')).length;
    const failedCount = inspections.length - passedCount;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Truck /> {forklift.id}
                </CardTitle>
                <CardDescription>{forklift.name}</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-around">
                <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{passedCount}</p>
                    <p className="text-sm text-muted-foreground">Passed</p>
                </div>
                 <div className="text-center">
                    <p className="text-2xl font-bold text-red-600">{failedCount}</p>
                    <p className="text-sm text-muted-foreground">Failed</p>
                </div>
            </CardContent>
            <CardFooter>
                 <Button className="w-full" onClick={() => onNewInspection(forklift.id)}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Start New Inspection
                </Button>
            </CardFooter>
        </Card>
    );
}

const PageSkeleton = () => (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-10 w-36" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppShell>
);

function ForkliftInspectionPageContent() {
    const { forkliftInspections, forklifts } = useAppData();
    const [isCreateOpen, setCreateOpen] = useState(false);
    const [selectedInspection, setSelectedInspection] = useState<ForkliftInspection | null>(null);
    const [isDetailsOpen, setDetailsOpen] = useState(false);
    const [forkliftIdToInspect, setForkliftIdToInspect] = useState<string | undefined>(undefined);
    const [historyFilter, setHistoryFilter] = useState('all');

    const searchParams = useSearchParams();

    useEffect(() => {
        const forkliftIdFromUrl = searchParams.get('forklift_id');
        if (forkliftIdFromUrl) {
            setForkliftIdToInspect(forkliftIdFromUrl);
            setCreateOpen(true);
        }
    }, [searchParams]);

    const handleRowClick = (inspection: ForkliftInspection) => {
        setSelectedInspection(inspection);
        setDetailsOpen(true);
    };

    const handleNewInspection = (forkliftId: string) => {
        setForkliftIdToInspect(forkliftId);
        setCreateOpen(true);
    };

    const { todayInspections, pastInspections } = useMemo(() => {
        const today: ForkliftInspection[] = [];
        const past: ForkliftInspection[] = [];
        forkliftInspections.forEach(insp => {
            if (isToday(new Date(insp.date))) {
                today.push(insp);
            } else {
                past.push(insp);
            }
        });
        return { todayInspections: today, pastInspections: past };
    }, [forkliftInspections]);
    
    const filteredHistory = useMemo(() => {
        if (historyFilter === 'all') return pastInspections;
        return pastInspections.filter(i => i.forklift_id === historyFilter);
    }, [pastInspections, historyFilter]);


    return (
        <AppShell>
            <div className="flex-1 space-y-8 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Forklift Inspections</h2>
                </div>
                
                <div>
                    <h3 className="text-2xl font-semibold tracking-tight mb-4">Today's Status</h3>
                     <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {forklifts.map(forklift => (
                            <ForkliftStatusCard
                                key={forklift.id}
                                forklift={forklift}
                                inspections={todayInspections.filter(i => i.forklift_id === forklift.id)}
                                onNewInspection={handleNewInspection}
                            />
                        ))}
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Inspection History</CardTitle>
                                <CardDescription>A log of all past forklift inspections.</CardDescription>
                            </div>
                            <Select value={historyFilter} onValueChange={setHistoryFilter}>
                                <SelectTrigger className="w-[200px]">
                                    <SelectValue placeholder="Filter by forklift..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Forklifts</SelectItem>
                                    {forklifts.map(fl => (
                                        <SelectItem key={fl.id} value={fl.id}>{fl.id} - {fl.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
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
                                {filteredHistory.map(insp => {
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
                                                ) : (
                                                    <span>0</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                 <Dialog open={isCreateOpen} onOpenChange={(open) => {
                     setCreateOpen(open);
                     if (!open) setForkliftIdToInspect(undefined);
                 }}>
                    <DialogContent className="max-w-2xl">
                        <NewInspectionForm setOpen={setCreateOpen} defaultForkliftId={forkliftIdToInspect} />
                    </DialogContent>
                </Dialog>

                <ForkliftInspectionDetailsDialog
                    inspection={selectedInspection}
                    isOpen={isDetailsOpen}
                    onOpenChange={setDetailsOpen}
                />
            </div>
        </AppShell>
    );
}

export default function ForkliftInspectionPage() {
    return (
        <Suspense fallback={<PageSkeleton />}>
            <ForkliftInspectionPageContent />
        </Suspense>
    );
}
