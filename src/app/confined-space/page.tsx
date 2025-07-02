
'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { ConfinedSpacePermit, Area, Comment, ChecklistStatus, ConfinedSpacePermitChecklist } from '@/types';
import { PlusCircle, Users, FileSignature, Box, Clock, UserCheck, MessageSquare, Edit } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useForm, Control, FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { format, formatDistanceToNow } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';

const checklistStatusEnum = z.enum(['Yes', 'No', 'N/A'], { required_error: "This check is required." });

const checklistSchema = z.object({
  isolation_and_blinding_complete: checklistStatusEnum,
  cleaning_and_purging_complete: checklistStatusEnum,
  ventilation_adequate: checklistStatusEnum,
  standby_person_present: checklistStatusEnum,
  rescue_equipment_ready: checklistStatusEnum,
  communication_established: checklistStatusEnum,
  atmospheric_testing_ok: z.enum(['Yes', 'No'], { required_error: "This check is required." }),
  oxygen_level: z.string().min(1, "Oxygen level is required."),
  combustible_gases_level: z.string().min(1, "Combustible gas level is required."),
  toxic_gases_level: z.string().min(1, "Toxic gas level is required."),
});

const permitFormSchema = z.object({
  supervisor: z.string().min(1, "Supervisor name is required."),
  areaId: z.string().min(1, "Location is required."),
  entrants: z.string().min(1, "At least one entrant is required."),
  work_description: z.string().min(10, "Work description must be at least 10 characters."),
  permit_expires: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Permit Expiry is required." }),
  special_instructions: z.string().optional(),
  checklist: checklistSchema,
});

type PermitFormValues = z.infer<typeof permitFormSchema>;

const CHECKLIST_ITEMS: { id: keyof ConfinedSpacePermitChecklist; label: string }[] = [
    { id: 'isolation_and_blinding_complete', label: 'Isolation and blinding of lines complete.' },
    { id: 'cleaning_and_purging_complete', label: 'Equipment has been cleaned and/or purged.' },
    { id: 'ventilation_adequate', label: 'Adequate ventilation is provided (natural or mechanical).' },
    { id: 'standby_person_present', label: 'A standby person is present at the entrance.' },
    { id: 'rescue_equipment_ready', label: 'Rescue equipment is available and ready.' },
    { id: 'communication_established', label: 'Communication system between entrants and standby is established.' },
];

const findAreaPathById = (areas: Area[], id: string, path: string[] = []): string => {
    for (const area of areas) {
        const newPath = [...path, area.name];
        if (area.area_id === id) {
            return newPath.join(' / ');
        }
        if (area.children) {
            const foundPath = findAreaPathById(area.children, id, newPath);
            if (foundPath) return foundPath;
        }
    }
    return '';
};

const AreaSelectOptions = ({ areas, level = 0 }: { areas: Area[]; level?: number }) => {
  return (
    <>
      {areas.map(area => (
        <React.Fragment key={area.area_id}>
          <SelectItem value={area.area_id}>
             <span style={{ paddingLeft: `${level * 1.25}rem` }}>{area.name}</span>
          </SelectItem>
          {area.children && <AreaSelectOptions areas={area.children} level={level + 1} />}
        </React.Fragment>
      ))}
    </>
  );
};

const ChecklistItem = ({ name, label, control, isViewMode }: {
    name: FieldPath<PermitFormValues>;
    label: string;
    control: Control<PermitFormValues>;
    isViewMode: boolean;
}) => (
    <FormField
        control={control}
        name={name}
        render={({ field }) => (
            <FormItem className="flex flex-col sm:flex-row items-start sm:items-center justify-between py-2 border-b last:border-b-0">
                <FormLabel className="font-normal text-sm flex-1 pr-4 mb-2 sm:mb-0">{label}</FormLabel>
                <FormControl>
                    <RadioGroup onValueChange={field.onChange} value={field.value} className="flex gap-4" disabled={isViewMode}>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                        <FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="N/A" /></FormControl><FormLabel className="font-normal">N/A</FormLabel></FormItem>
                    </RadioGroup>
                </FormControl>
                <FormMessage className="sm:ml-4" />
            </FormItem>
        )}
    />
);

const DenyPermitDialog = ({ open, onOpenChange, onConfirm }: { open: boolean; onOpenChange: (open: boolean) => void; onConfirm: (reason: string) => void; }) => {
    const [reason, setReason] = React.useState('');
    const { toast } = useToast();
    const handleConfirmClick = () => {
        if (!reason.trim()) {
            toast({ variant: 'destructive', title: 'Reason Required', description: 'Please provide a reason for denying the permit.' });
            return;
        }
        onConfirm(reason);
        setReason('');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Deny Confined Space Permit?</DialogTitle>
                    <DialogDescription>Please provide a reason for denying this permit. This will be added to the comment log and the action cannot be undone.</DialogDescription>
                </DialogHeader>
                <div className="space-y-2 py-2"><Label htmlFor="deny-reason" className="sr-only">Denial Reason</Label><Textarea id="deny-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g., Atmospheric conditions are not safe..." /></div>
                <DialogFooter><Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button><Button variant="destructive" onClick={handleConfirmClick} disabled={!reason.trim()}>Confirm Denial</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

const PermitDetailsDialog = ({ permit, onAdd, onUpdate, addComment, setOpen, areas }: {
    permit?: ConfinedSpacePermit | null;
    onAdd: (data: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => Promise<boolean>;
    onUpdate: (data: ConfinedSpacePermit) => Promise<boolean>;
    addComment: (permitId: string, comment: Comment) => void;
    setOpen: (open: boolean) => void;
    areas: Area[];
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const [isDenyDialogOpen, setDenyDialogOpen] = useState(false);
  const isCreateMode = !permit;

  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: {
        supervisor: currentUser?.displayName || '',
        areaId: '',
        entrants: '',
        work_description: '',
        permit_expires: '',
        special_instructions: '',
        checklist: {
            isolation_and_blinding_complete: 'No', cleaning_and_purging_complete: 'No', ventilation_adequate: 'No',
            standby_person_present: 'No', rescue_equipment_ready: 'No', communication_established: 'No',
            atmospheric_testing_ok: 'No', oxygen_level: '', combustible_gases_level: '', toxic_gases_level: '',
        },
    },
  });

   useEffect(() => {
    if (permit) {
      form.reset({
        ...permit,
        permit_expires: format(new Date(permit.permit_expires), "yyyy-MM-dd'T'HH:mm"),
      });
      setNewComment('');
      setDenyDialogOpen(false);
    } else {
      form.reset({
        supervisor: currentUser?.displayName || '', areaId: '', entrants: '', work_description: '',
        permit_expires: '', special_instructions: '',
        checklist: {
            isolation_and_blinding_complete: 'No', cleaning_and_purging_complete: 'No', ventilation_adequate: 'No',
            standby_person_present: 'No', rescue_equipment_ready: 'No', communication_established: 'No',
            atmospheric_testing_ok: 'No', oxygen_level: '', combustible_gases_level: '', toxic_gases_level: '',
        },
      });
    }
  }, [permit, form, currentUser]);

  const atmosphericTestingOk = form.watch('checklist.atmospheric_testing_ok');

  const handleIssuePermit = async () => {
    if (!permit || !currentUser?.displayName) return;
    const updatedPermit: ConfinedSpacePermit = {
        ...permit, ...form.getValues(),
        permit_expires: new Date(form.getValues('permit_expires')).toISOString(),
        status: 'Active',
        supervisor_signature: { name: currentUser.displayName, date: new Date().toISOString() },
        comments: [ ...(permit.comments || []), { user: 'System Log', comment: `${currentUser.displayName} issued the permit, making it active.`, date: new Date().toISOString() } ],
    };
    if (await onUpdate(updatedPermit)) toast({ title: 'Permit Issued', description: 'The permit is now active.' });
  };

  const handleDenyPermit = async (reason: string) => {
      if (!permit || !currentUser?.displayName) return;
      const updatedPermit: ConfinedSpacePermit = {
          ...permit, status: 'Denied',
          comments: [ ...(permit.comments || []), { user: 'System Log', comment: `${currentUser.displayName} denied the permit. Reason: ${reason}`, date: new Date().toISOString() } ],
      };
      if (await onUpdate(updatedPermit)) {
          toast({ title: 'Permit Denied', description: 'The permit has been marked as denied.', variant: 'destructive' });
          setDenyDialogOpen(false);
          setOpen(false);
      }
  };

  const handleSign = async (signatureType: 'entrant' | 'final_supervisor') => {
    if (!permit || !currentUser?.displayName) return;

    let updatedPermit = { ...permit };
    const signature = { name: currentUser.displayName, date: new Date().toISOString() };
    let commentLog: Comment | null = null;

    if (signatureType === 'entrant' && !updatedPermit.entrant_signature) {
        updatedPermit.entrant_signature = signature;
        updatedPermit.work_complete = new Date().toISOString();
        commentLog = { user: 'System Log', comment: `${currentUser.displayName} signed as entrant to confirm work completion.`, date: new Date().toISOString() };
    } else if (signatureType === 'final_supervisor' && !updatedPermit.final_supervisor_signature) {
        updatedPermit.final_supervisor_signature = signature;
        updatedPermit.final_check = new Date().toISOString();
        updatedPermit.status = 'Closed';
        commentLog = { user: 'System Log', comment: `${currentUser.displayName} performed the final check and closed the permit.`, date: new Date().toISOString() };
    } else {
        return;
    }
    if (commentLog) updatedPermit.comments = [...(updatedPermit.comments || []), commentLog];
    if(await onUpdate(updatedPermit)) toast({ title: 'Permit Signed', description: 'The permit has been successfully signed.' });
  };

  const handleAddComment = () => {
    if (newComment.trim() && permit && currentUser) {
      addComment(permit.permit_id, { user: currentUser.displayName || 'Anonymous', comment: newComment.trim(), date: new Date().toISOString() });
      setNewComment('');
    }
  };

  const onSubmit = async (data: PermitFormValues) => {
    if (isCreateMode) {
      if (!currentUser?.displayName) { toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' }); return; }
      const locationName = findAreaPathById(areas, data.areaId);
      if (!locationName) { toast({ variant: 'destructive', title: 'Invalid Area', description: 'Could not find the selected area.' }); return; }
      const newPermit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'> = {
        ...data,
        permit_expires: new Date(data.permit_expires).toISOString(),
      };
      if (await onAdd(newPermit, locationName)) { toast({ title: 'Draft Permit Created', description: 'The permit has been saved as a draft.' }); setOpen(false); }
    } else if (permit) {
      const updatedPermit = { ...permit, ...data, permit_expires: new Date(data.permit_expires).toISOString() };
      if(await onUpdate(updatedPermit)) { toast({ title: 'Permit Updated', description: 'Your changes have been saved.' }); setOpen(false); }
    }
  };

  const isFormLocked = !isCreateMode && (permit?.status === 'Closed' || permit?.status === 'Denied');
  const isDraft = !isCreateMode && permit?.status === 'Draft';
  const isViewMode = isFormLocked || (!isDraft && !isCreateMode);
  const getAvatarInitials = (name: string) => name === 'System Log' ? 'SL' : name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader><DialogTitle>{isCreateMode ? 'Create New Confined Space Permit' : `Confined Space Permit: ${permit.display_id}`}</DialogTitle><DialogDescription>{isCreateMode ? 'Fill in details to issue a new permit.' : `Details for permit in ${permit.locationName}`}</DialogDescription></DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <div className="md:col-span-2 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                <div className="space-y-4">
                    <FormField control={form.control} name="supervisor" render={({ field }) => (<FormItem><FormLabel>Supervisor</FormLabel><FormControl><Input {...field} disabled={!isCreateMode && !isDraft} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="entrants" render={({ field }) => (<FormItem><FormLabel>Entrants (comma-separated)</FormLabel><FormControl><Input {...field} disabled={!isCreateMode && !isDraft} placeholder="e.g., John Doe, Jane Smith" /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="areaId" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isCreateMode && !isDraft}><FormControl><SelectTrigger><SelectValue placeholder="Select an area..." /></SelectTrigger></FormControl><SelectContent><AreaSelectOptions areas={areas} /></SelectContent></Select><FormMessage /></FormItem>)}/>
                    {!isCreateMode && permit.supervisor_signature && (<div><FormLabel>Supervisor Signature</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{permit.supervisor_signature.name} on {format(new Date(permit.supervisor_signature.date), 'P p')}</p></div>)}
                </div>
                <div className="space-y-4">
                    <FormField control={form.control} name="work_description" render={({ field }) => (<FormItem><FormLabel>Work to be performed</FormLabel><FormControl><Textarea {...field} disabled={!isCreateMode && !isDraft} rows={4} /></FormControl><FormMessage /></FormItem>)}/>
                    <FormField control={form.control} name="permit_expires" render={({ field }) => (<FormItem><FormLabel>Permit Expires</FormLabel><FormControl><Input type="datetime-local" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                <div className="md:col-span-2">
                    <h3 className="font-bold text-lg">Safety Checklist</h3>
                    {CHECKLIST_ITEMS.map(item => (<ChecklistItem key={item.id} name={`checklist.${item.id as keyof PermitFormValues['checklist']}`} label={item.label} control={form.control} isViewMode={isViewMode} />))}
                </div>
                <div className="md:col-span-2">
                    <h4 className="font-semibold text-sm mt-4">Atmospheric Testing</h4>
                    <ChecklistItem name="checklist.atmospheric_testing_ok" label="Atmospheric testing has been completed and is acceptable." control={form.control} isViewMode={isViewMode} />
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <FormField control={form.control} name="checklist.oxygen_level" render={({ field }) => (<FormItem><FormLabel>Oxygen</FormLabel><FormControl><Input {...field} placeholder="19.5-23.5%" disabled={isViewMode || atmosphericTestingOk !== 'Yes'} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="checklist.combustible_gases_level" render={({ field }) => (<FormItem><FormLabel>Combustibles</FormLabel><FormControl><Input {...field} placeholder="< 10% LEL" disabled={isViewMode || atmosphericTestingOk !== 'Yes'} /></FormControl><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="checklist.toxic_gases_level" render={({ field }) => (<FormItem><FormLabel>Toxic Gases</FormLabel><FormControl><Input {...field} placeholder="< PEL" disabled={isViewMode || atmosphericTestingOk !== 'Yes'} /></FormControl><FormMessage /></FormItem>)}/>
                    </div>
                </div>
                <div className="md:col-span-2">
                  <FormField control={form.control} name="special_instructions" render={({ field }) => (<FormItem><FormLabel>Special instructions</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>)}/>
                </div>
                {!isCreateMode && (<>
                    <div className="md:col-span-2"><Separator /></div>
                    <div className="md:col-span-2 space-y-4">
                        <h3 className="font-bold text-lg">Work Completion & Final Check</h3>
                        <div><FormLabel>Entrant Acknowledgement</FormLabel>{permit.entrant_signature ? <p className="text-sm p-2 border rounded-md bg-muted">Work completed by {permit.entrant_signature.name} on {format(new Date(permit.entrant_signature.date), 'P p')}</p> : <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between"><p className="text-sm text-muted-foreground">Entrant must sign to confirm work completion.</p><Button type="button" onClick={() => handleSign('entrant')} disabled={isFormLocked || isDraft}><UserCheck className="mr-2 h-4 w-4" /> Sign Work Complete</Button></div>}</div>
                        <div><FormLabel>Final Supervisor Check</FormLabel>{permit.final_supervisor_signature ? <p className="text-sm p-2 border rounded-md bg-muted">Final check by {permit.final_supervisor_signature.name} on {format(new Date(permit.final_supervisor_signature.date), 'P p')}</p> : <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between"><p className="text-sm text-muted-foreground">Supervisor must perform final area check.</p><Button type="button" onClick={() => handleSign('final_supervisor')} disabled={!permit.entrant_signature || isFormLocked}><FileSignature className="mr-2 h-4 w-4" /> Sign and Close Permit</Button></div>}</div>
                    </div>
                </>)}
              </div>
            </div>
            {!isCreateMode && permit && (
              <div className="md:col-span-1 flex flex-col gap-4 border-l pl-6">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments & Logs</h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {(permit.comments || []).map((comment, index) => (<div key={index} className="flex gap-3"><Avatar><AvatarImage src={comment.user !== 'System Log' ? `https://placehold.co/40x40.png?text=${getAvatarInitials(comment.user)}` : undefined} /><AvatarFallback>{getAvatarInitials(comment.user)}</AvatarFallback></Avatar><div className="flex-1"><div className="flex justify-between items-center"><p className="font-semibold text-sm">{comment.user}</p><p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.date), { addSuffix: true })}</p></div><p className="text-sm text-muted-foreground bg-secondary p-3 rounded-lg mt-1">{comment.comment}</p></div></div>))}
                    {(permit.comments || []).length === 0 && (<p className="text-sm text-center text-muted-foreground py-4">No comments or logs yet.</p>)}
                </div>
                <div className="flex flex-col gap-2 mt-auto"><Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} disabled={isFormLocked}/><Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || isFormLocked}>Add Comment</Button></div>
              </div>
            )}
         </div>
        </div>
        <DialogFooter>
            {isCreateMode && (<><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save as Draft</Button></>)}
            {!isCreateMode && permit && (<>
                {permit.status === 'Draft' && !isFormLocked && (<div className="flex justify-between w-full"><Button type="button" variant="destructive" onClick={() => setDenyDialogOpen(true)}>Deny Permit</Button><div className="flex gap-2"><Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit">Save Draft Changes</Button><Button type="button" onClick={handleIssuePermit}>Issue &amp; Sign Permit</Button></div></div>)}
                {permit.status !== 'Draft' && (<Button type="button" onClick={() => setOpen(false)}>Close</Button>)}
            </>)}
        </DialogFooter>
      </form>
      <DenyPermitDialog open={isDenyDialogOpen} onOpenChange={setDenyDialogOpen} onConfirm={handleDenyPermit} />
    </Form>
  )
}

export default function ConfinedSpacePermitsPage() {
    const { user: currentUser } = useAuth();
    const { confinedSpacePermits, addConfinedSpacePermit, updateConfinedSpacePermit, addCommentToConfinedSpacePermit, areas } = useAppData();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState<ConfinedSpacePermit | null>(null);

    const handleAddPermit = async (permit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string): Promise<boolean> => {
        try { await addConfinedSpacePermit(permit, locationName); return true; } catch (error) { console.error("Failed to add Permit:", error); toast({ variant: 'destructive', title: 'Save Failed' }); return false; }
    };
    const handleUpdatePermit = async (permit: ConfinedSpacePermit): Promise<boolean> => {
        try { await updateConfinedSpacePermit(permit); return true; } catch (error) { console.error("Failed to update Permit:", error); toast({ variant: 'destructive', title: 'Update Failed' }); return false; }
    };
    const handleAddCommentToPermit = async (permitId: string, comment: Comment) => { await addCommentToConfinedSpacePermit(permitId, comment); };
    const handleOpenDialog = (permit?: ConfinedSpacePermit) => { setSelectedPermit(permit || null); setDialogOpen(true); };

    const calculateStatus = (permit: ConfinedSpacePermit): { text: ConfinedSpacePermit['status'] | 'Expired', variant: 'default' | 'destructive' | 'outline' | 'secondary' } => {
        if (permit.status === 'Denied') return { text: 'Denied', variant: 'destructive' };
        if (permit.status === 'Closed') return { text: 'Closed', variant: 'outline' };
        if (permit.status === 'Draft') return { text: 'Draft', variant: 'secondary' };
        if (new Date(permit.permit_expires) < new Date()) return { text: 'Expired', variant: 'destructive' };
        return { text: 'Active', variant: 'default' };
    }

    const currentSelectedPermit = selectedPermit
        ? confinedSpacePermits.find(p => p.permit_id === selectedPermit.permit_id) || null
        : null;

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Confined Space Permits</h2>
                    <Button onClick={() => handleOpenDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Create Permit</Button>
                </div>
                <p className="text-muted-foreground">Create and manage permits for entry into confined spaces.</p>
                <Card>
                    <CardHeader><CardTitle>Issued Permits</CardTitle></CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader><TableRow><TableHead>Permit ID</TableHead><TableHead>Location</TableHead><TableHead>Supervisor</TableHead><TableHead>Expires</TableHead><TableHead>Status</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
                            <TableBody>
                                {confinedSpacePermits.length > 0 ? confinedSpacePermits.map((permit) => {
                                    const status = calculateStatus(permit);
                                    return (
                                    <TableRow key={permit.permit_id} className="cursor-pointer" onClick={() => handleOpenDialog(permit)}>
                                        <TableCell><Badge variant="outline">{permit.display_id}</Badge></TableCell>
                                        <TableCell className="font-medium">{permit.locationName}</TableCell>
                                        <TableCell>{permit.supervisor}</TableCell>
                                        <TableCell>{format(new Date(permit.permit_expires), 'P p')}</TableCell>
                                        <TableCell><Badge variant={status.variant}>{status.text}</Badge></TableCell>
                                        <TableCell><Button variant="ghost" size="sm">View</Button></TableCell>
                                    </TableRow>
                                )}) : (<TableRow><TableCell colSpan={6} className="text-center">No confined space permits found.</TableCell></TableRow>)}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) setSelectedPermit(null); setDialogOpen(open); }}>
                <DialogContent className="max-w-5xl">
                    <PermitDetailsDialog onAdd={handleAddPermit} onUpdate={handleUpdatePermit} addComment={handleAddCommentToPermit} setOpen={setDialogOpen} permit={currentSelectedPermit} areas={areas} />
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
