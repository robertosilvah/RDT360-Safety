
'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import type { Investigation, Comment, CorrectiveAction, Incident } from '@/types';
import { PlusCircle, Upload, FileText, MessageSquare, User, Clock, Siren, Wand2, Loader2, Edit, AlertCircle, Calendar, BookOpen, ListChecks, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Separator } from '@/components/ui/separator';
import { format, formatDistanceToNow } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useSearchParams } from 'next/navigation';
import { getInvestigationAnalysisAction } from '@/app/actions';
import { Skeleton } from '@/components/ui/skeleton';

const investigationFormSchema = z.object({
  status: z.enum(['Open', 'In Progress', 'Closed']),
  root_cause: z.string().min(1, 'Root cause analysis is required.'),
  contributing_factors: z.string().min(1, 'Contributing factors are required.'),
  events_history: z.string().min(1, 'Events history is required.'),
  lessons_learned: z.string().min(1, 'Lessons learned are required.'),
  action_plan: z.string().min(1, 'Action plan is required.'),
});

type InvestigationFormValues = z.infer<typeof investigationFormSchema>;

const NewActionForm = ({ investigationId, onActionAdded }: { investigationId: string; onActionAdded: () => void }) => {
  const { addCorrectiveAction } = useAppData();
  const { toast } = useToast();
  const form = useForm({
    resolver: zodResolver(z.object({
      description: z.string().min(10, 'Description must be at least 10 characters.'),
      responsible_person: z.string().min(2, 'Responsible person is required.'),
      due_date: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: 'Please enter a valid date.' }),
    })),
    defaultValues: { description: '', responsible_person: '', due_date: '' },
  });

  const onSubmit = (values: any) => {
    const newAction: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'> = {
      description: values.description,
      responsible_person: values.responsible_person,
      due_date: new Date(values.due_date).toISOString(),
      status: 'Pending',
      related_to_investigation: investigationId,
    };
    addCorrectiveAction(newAction);
    toast({ title: 'Corrective Action Created', description: 'The new action has been linked to this investigation.' });
    form.reset();
    onActionAdded();
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 p-4 border rounded-md bg-muted/50 mt-4">
        <h4 className="font-semibold">Add New Corrective Action</h4>
        <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
        )} />
        <div className="grid grid-cols-2 gap-4">
          <FormField control={form.control} name="responsible_person" render={({ field }) => (
            <FormItem><FormLabel>Responsible</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="due_date" render={({ field }) => (
            <FormItem><FormLabel>Due Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <Button type="submit" size="sm">Add Action</Button>
      </form>
    </Form>
  );
};

const InvestigationDetailsDialog = ({ investigation, isOpen, onOpenChange }: { investigation: Investigation | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
  const { incidents, investigations, updateInvestigation, addCommentToInvestigation, addDocumentToInvestigation, correctiveActions, uploadSettings } = useAppData();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const currentInvestigation = investigation ? investigations.find(i => i.investigation_id === investigation.investigation_id) || null : null;

  const form = useForm<InvestigationFormValues>({
    resolver: zodResolver(investigationFormSchema),
    defaultValues: {
      status: 'Open',
      root_cause: '',
      contributing_factors: '',
      events_history: '',
      lessons_learned: '',
      action_plan: '',
    },
  });

  useEffect(() => {
    if (currentInvestigation) {
      form.reset({
        status: currentInvestigation.status,
        root_cause: currentInvestigation.root_cause,
        contributing_factors: currentInvestigation.contributing_factors,
        events_history: currentInvestigation.events_history,
        lessons_learned: currentInvestigation.lessons_learned,
        action_plan: currentInvestigation.action_plan,
      });
      setNewComment('');
      setIsEditing(false);
    }
  }, [currentInvestigation, form, isOpen]);

  if (!currentInvestigation) return null;

  const isLocked = currentInvestigation.status === 'Closed' && !isEditing;
  const incidentDetails = incidents.find(i => i.incident_id === currentInvestigation.incident_id);

  const handleAiAnalysis = async () => {
    if (!incidentDetails) {
        toast({ title: "Error", description: "Incident details not found.", variant: "destructive" });
        return;
    }

    setIsAnalyzing(true);
    try {
        const analysis = await getInvestigationAnalysisAction({
            incidentDescription: incidentDetails.description,
            incidentType: incidentDetails.type,
            incidentSeverity: incidentDetails.severity,
            incidentArea: incidentDetails.area,
        });

        if (analysis.rootCause && analysis.contributingFactors) {
            form.setValue('root_cause', analysis.rootCause, { shouldDirty: true });
            form.setValue('contributing_factors', analysis.contributingFactors, { shouldDirty: true });
            form.setValue('events_history', analysis.eventsHistory, { shouldDirty: true });
            form.setValue('lessons_learned', analysis.lessonsLearned, { shouldDirty: true });
            form.setValue('action_plan', analysis.actionPlan, { shouldDirty: true });
            toast({ title: "Analysis Complete", description: "Investigation fields have been populated." });
        } else {
            toast({ title: "Analysis Failed", description: analysis.rootCause, variant: "destructive" });
        }
    } catch (error) {
        console.error(error);
        toast({ title: "Analysis Error", description: "An unexpected error occurred.", variant: "destructive" });
    } finally {
        setIsAnalyzing(false);
    }
  };

  const handleSubmit = (values: InvestigationFormValues) => {
    const updatedInvestigation = { ...currentInvestigation, ...values };
    updateInvestigation(updatedInvestigation);
    toast({ title: 'Investigation Updated' });
    onOpenChange(false);
  };
  
  const handleAddComment = () => {
    if(newComment.trim()) {
      addCommentToInvestigation(currentInvestigation.investigation_id, { user: 'Safety Manager', comment: newComment.trim(), date: new Date().toISOString() });
      setNewComment('');
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && currentInvestigation) {
        const file = e.target.files[0];
        const maxSizeMB = uploadSettings?.docMaxSizeMB || 10;
        const maxSizeInBytes = maxSizeMB * 1024 * 1024;

        if (file.size > maxSizeInBytes) {
          toast({
            variant: 'destructive',
            title: 'File too large',
            description: `The document must be smaller than ${maxSizeMB}MB.`,
          });
          if (e.target) e.target.value = '';
          return;
        }

        // Mocking the upload process
        const newDocument = { name: file.name, url: `/docs/mock/${file.name}`};
        addDocumentToInvestigation(currentInvestigation.investigation_id, newDocument);
        toast({ title: "Document Uploaded", description: `${file.name} has been attached.`});
        if (e.target) e.target.value = '';
    }
  }

  const handleEdit = () => {
    form.setValue('status', 'In Progress', { shouldDirty: true });
    setIsEditing(true);
  };
  
  const handlePrint = () => {
    window.open(`/investigations/${currentInvestigation.investigation_id}`, '_blank');
  };

  const linkedActions = correctiveActions.filter(a => a.related_to_investigation === currentInvestigation.investigation_id);
  const severityVariant: { [key in Incident['severity']]: 'default' | 'secondary' | 'destructive' } = {
    'Low': 'default',
    'Medium': 'secondary',
    'High': 'destructive',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Investigation Details: {currentInvestigation.display_id}</span>
            <Button variant="ghost" size="icon" type="button" onClick={handlePrint}>
                <Printer className="h-5 w-5" />
                <span className="sr-only">Print Investigation</span>
            </Button>
          </DialogTitle>
          <DialogDescription>
            For Incident <Button variant="link" asChild className="p-0 h-auto"><Link href={`/incidents`}>{incidentDetails?.display_id}</Link></Button>
          </DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-h-[70vh]">
          <div className="md:col-span-2 overflow-y-auto pr-4 space-y-6">
             {incidentDetails && (
                <Card className="bg-muted/30">
                    <CardHeader>
                        <CardTitle className="text-lg">Incident Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 text-sm">
                        <p>{incidentDetails.description}</p>
                        <div className="flex justify-between items-center text-muted-foreground">
                            <span className="flex items-center gap-1"><Siren className="h-4 w-4" /> {incidentDetails.type}</span>
                            <span className="flex items-center gap-1"><AlertCircle className="h-4 w-4" /> Severity: <Badge variant={severityVariant[incidentDetails.severity]}>{incidentDetails.severity}</Badge></span>
                            <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> {format(new Date(incidentDetails.date), 'PPP')}</span>
                        </div>
                    </CardContent>
                </Card>
             )}

            <Form {...form}>
              <form id="investigation-form" onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLocked}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="In Progress">In Progress</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )} />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">Analysis</h3>
                      <Button type="button" size="sm" onClick={handleAiAnalysis} disabled={isAnalyzing || !incidentDetails || isLocked}>
                          {isAnalyzing ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                              <Wand2 className="mr-2 h-4 w-4" />
                          )}
                          Analyze with AI
                      </Button>
                  </div>
                  <FormField control={form.control} name="events_history" render={({ field }) => (
                    <FormItem><FormLabel>Events History</FormLabel><FormControl><Textarea rows={4} placeholder="Chronological sequence of events..." {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="root_cause" render={({ field }) => (
                    <FormItem><FormLabel>Root Cause Analysis</FormLabel><FormControl><Textarea rows={4} placeholder="Describe the root cause..." {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="contributing_factors" render={({ field }) => (
                    <FormItem><FormLabel>Contributing Factors</FormLabel><FormControl><Textarea rows={4} placeholder="List contributing factors..." {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="lessons_learned" render={({ field }) => (
                    <FormItem><FormLabel>Lessons Learned</FormLabel><FormControl><Textarea rows={4} placeholder="What can be learned..." {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={form.control} name="action_plan" render={({ field }) => (
                    <FormItem><FormLabel>Action Plan</FormLabel><FormControl><Textarea rows={4} placeholder="Recommended corrective actions..." {...field} disabled={isLocked} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
              </form>
            </Form>

            <Separator />
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Documents</h3>
              <div className="space-y-2">
                {currentInvestigation.documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                        <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium hover:underline">{doc.name}</a>
                        </div>
                    </div>
                ))}
                {currentInvestigation.documents.length === 0 && <p className="text-sm text-muted-foreground">No documents uploaded.</p>}
              </div>
              <div className="mt-4">
                <Input id="file-upload" type="file" className="hidden" onChange={handleFileUpload} disabled={isLocked} />
                <Button asChild variant="outline" disabled={isLocked}>
                    <label htmlFor="file-upload"><Upload className="mr-2 h-4 w-4" /> Upload Document</label>
                </Button>
              </div>
            </div>

            <Separator />
            
            <div>
                 <h3 className="text-lg font-semibold mb-2">Corrective Actions</h3>
                 <div className="space-y-2">
                    {linkedActions.map(action => (
                        <Card key={action.action_id} className="p-3">
                            <p className="font-medium text-sm">{action.description}</p>
                            <p className="text-xs text-muted-foreground">Due: {new Date(action.due_date).toLocaleDateString()} | Status: {action.status}</p>
                            <Button variant="link" size="sm" asChild className="p-0 h-auto"><Link href="/actions">View Action</Link></Button>
                        </Card>
                    ))}
                    {linkedActions.length === 0 && <p className="text-sm text-muted-foreground">No corrective actions created yet.</p>}
                 </div>
                 {isLocked ? (
                    <p className="text-sm text-muted-foreground italic mt-4">Investigation is closed. Re-open to add new actions.</p>
                 ) : (
                    <NewActionForm investigationId={currentInvestigation.investigation_id} onActionAdded={() => {}} />
                 )}
            </div>

          </div>
          <div className="md:col-span-1 flex flex-col gap-4 border-l pl-6">
            <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments</h3>
            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              {currentInvestigation.comments.map((comment, index) => (
                <div key={index} className="flex gap-3">
                  <Avatar><AvatarImage src={`https://placehold.co/40x40.png?text=${comment.user.charAt(0)}`} /><AvatarFallback>{comment.user.charAt(0)}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="flex justify-between items-center"><p className="font-semibold text-sm">{comment.user}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</p></div>
                    <p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg mt-1">{comment.comment}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              <Textarea placeholder={isLocked ? "Comments are locked." : "Add a comment..."} value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} disabled={isLocked} />
              <Button size="sm" onClick={handleAddComment} disabled={isLocked || !newComment.trim()}>Add Comment</Button>
            </div>
          </div>
        </div>
        <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            {isLocked ? (
                <Button onClick={handleEdit}><Edit className="mr-2 h-4 w-4" /> Re-open and Edit</Button>
            ) : (
                <Button type="submit" form="investigation-form">Save & Close</Button>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const InvestigationsPageContent = () => {
  const { investigations, incidents } = useAppData();
  const searchParams = useSearchParams();
  const [selectedInvestigation, setSelectedInvestigation] = useState<Investigation | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    const investigationIdFromUrl = searchParams.get('id');
    if (investigationIdFromUrl) {
      const investigation = investigations.find(inv => inv.investigation_id === investigationIdFromUrl);
      if (investigation) {
        setSelectedInvestigation(investigation);
        setDetailsOpen(true);
      }
    }
  }, [searchParams, investigations]);

  const statusVariant: { [key in Investigation['status']]: 'destructive' | 'secondary' | 'default' | 'outline' } = {
    'Open': 'secondary',
    'In Progress': 'default',
    'Closed': 'outline',
  };
  
  const handleRowClick = (investigation: Investigation) => {
    setSelectedInvestigation(investigation);
    setDetailsOpen(true);
  };
  
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Incident Investigations</h2>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Investigations</CardTitle>
            <CardDescription>A log of all incident investigations. Click a row to view and manage details.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Investigation ID</TableHead>
                  <TableHead>Incident ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[40%]">Root Cause Summary</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {investigations.map((investigation) => {
                  const incident = incidents.find(i => i.incident_id === investigation.incident_id);
                  return (
                    <TableRow key={investigation.investigation_id} onClick={() => handleRowClick(investigation)} className="cursor-pointer">
                      <TableCell className="font-medium">
                        <Button variant="link" asChild className="p-0 h-auto">
                            <Link href={`/investigations?id=${investigation.investigation_id}`}>{investigation.display_id}</Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="link" asChild className="p-0 h-auto">
                          <Link href={`/incidents`}>{incident?.display_id || investigation.incident_id}</Link>
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusVariant[investigation.status]}>{investigation.status}</Badge>
                      </TableCell>
                      <TableCell className="max-w-md truncate">
                        {investigation.root_cause || 'Not yet determined'}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <InvestigationDetailsDialog
        investigation={selectedInvestigation}
        isOpen={isDetailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </AppShell>
  );
};

// Loading Skeleton Component
const PageSkeleton = () => (
    <AppShell>
        <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
            <div className="flex items-center justify-between space-y-2">
                <Skeleton className="h-10 w-1/3" />
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

export default function InvestigationsPage() {
  // Main component now wraps the content in Suspense
  return (
    <Suspense fallback={<PageSkeleton />}>
        <InvestigationsPageContent />
    </Suspense>
  )
}
