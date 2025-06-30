'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { HotWorkPermit, HotWorkPermitChecklist, Area, Comment } from '@/types';
import { PlusCircle, Users, FileSignature, Flame, Clock, CheckSquare, Trash2, UserCheck, Edit, MessageSquare, FilePenLine } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { format, formatDistanceToNow } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const checklistSchema = z.object({
  fire_extinguisher: z.boolean().default(false),
  equipment_good_repair: z.boolean().default(false),
  energy_locked_out: z.boolean().default(false),
  flammables_removed: z.boolean().default(false),
  floors_swept: z.boolean().default(false),
  fire_resistive_covers: z.boolean().default(false),
  openings_covered: z.boolean().default(false),
  walls_ceilings_protected: z.boolean().default(false),
  adequate_ventilation: z.boolean().default(false),
  atmosphere_checked: z.boolean().default(false),
  vapors_purged: z.boolean().default(false),
  confined_space_permit: z.boolean().default(false),
  fire_watch_provided: z.boolean().default(false),
});

const permitFormSchema = z.object({
  supervisor: z.string().min(1, "Supervisor name is required."),
  performed_by_type: z.enum(['RDT Employee', 'Contractor'], { required_error: "You must select who performed the work."}),
  areaId: z.string().min(1, "Location is required."),
  work_to_be_performed_by: z.string().min(1, "Personnel details are required."),
  permit_expires: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Permit Expiry is required." }),
  special_instructions: z.string().optional(),
  enclosed_equip_notes: z.string().optional(),
  fire_watch_required: z.enum(['Yes', 'No'], { required_error: "You must select if fire watch is required."}),
  checklist: checklistSchema,
});

type PermitFormValues = z.infer<typeof permitFormSchema>;

const CHECKLIST_ITEMS: { id: keyof HotWorkPermitChecklist; label: string; group: string }[] = [
    { id: 'fire_extinguisher', label: 'Fire extinguisher available.', group: 'precautions' },
    { id: 'equipment_good_repair', label: 'Hot work equipment in good repair.', group: 'precautions' },
    { id: 'energy_locked_out', label: 'Hazardous energy locked out.', group: 'precautions' },
    { id: 'flammables_removed', label: 'Flammable liquids and combustible material removed from area.', group: 'requirements' },
    { id: 'floors_swept', label: 'Floors swept and overhead structure cleaned of dust, lint and debris.', group: 'requirements' },
    { id: 'fire_resistive_covers', label: 'Fire-resistive covers and metal shields provided as needed.', group: 'requirements' },
    { id: 'openings_covered', label: 'All floor and wall openings covered and or protected.', group: 'requirements' },
    { id: 'walls_ceilings_protected', label: 'Walls/ceilings: remove combustibles away from opposite side or adjacent structures.', group: 'requirements' },
    { id: 'confined_space_permit', label: 'Confined Space Permit obtained, if required.', group: 'enclosed' },
    { id: 'adequate_ventilation', label: 'Adequate ventilation is provided.', group: 'enclosed' },
    { id: 'atmosphere_checked', label: 'Atmosphere checked with gas detector.', group: 'enclosed' },
    { id: 'vapors_purged', label: 'Purge any flammable vapors.', group: 'enclosed' },
    { id: 'fire_watch_provided', label: 'Trained and equipped Fire Watch provided during operations and at least 30 minutes after.', group: 'fire_watch' },
];

const findAreaPathById = (areasToSearch: Area[], id: string, path: string[] = []): string => {
    for (const area of areasToSearch) {
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

const ChecklistSection = ({ form, items, isViewMode }: { form: any; items: { id: keyof HotWorkPermitChecklist; label: string }[]; isViewMode: boolean }) => {
  const confinedSpacePermitSelected = form.watch('checklist.confined_space_permit');
  const isConditionalItem = (id: string) => ['adequate_ventilation', 'atmosphere_checked', 'vapors_purged'].includes(id);

  return (
    <div className="space-y-2 mt-2">
      {items.map((item) => (
        <FormField
          key={item.id}
          control={form.control}
          name={`checklist.${item.id}`}
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isViewMode || (isConditionalItem(item.id) && !confinedSpacePermitSelected)}
                />
              </FormControl>
              <FormLabel className="font-normal text-sm">{item.label}</FormLabel>
            </FormItem>
          )}
        />
      ))}
    </div>
  );
};


const PermitDetailsDialog = ({
    permit,
    onAdd,
    onUpdate,
    addComment,
    setOpen,
    areas,
}: {
    permit?: HotWorkPermit | null;
    onAdd: (data: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => Promise<boolean>;
    onUpdate: (data: HotWorkPermit) => Promise<boolean>;
    addComment: (permitId: string, comment: Comment) => void;
    setOpen: (open: boolean) => void;
    areas: Area[];
}) => {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [newComment, setNewComment] = useState('');
  const isCreateMode = !permit;

  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: isCreateMode ? {
        supervisor: currentUser?.displayName || '',
        areaId: '',
        work_to_be_performed_by: '',
        permit_expires: '',
        special_instructions: '',
        enclosed_equip_notes: '',
        checklist: {
            fire_extinguisher: false, equipment_good_repair: false, energy_locked_out: false,
            flammables_removed: false, floors_swept: false, fire_resistive_covers: false,
            openings_covered: false, walls_ceilings_protected: false,
            adequate_ventilation: false, atmosphere_checked: false, vapors_purged: false,
            confined_space_permit: false, fire_watch_provided: false,
        },
    } : {
        ...permit,
        areaId: permit.areaId,
        permit_expires: format(new Date(permit.permit_expires), "yyyy-MM-dd'T'HH:mm"),
    },
  });

   useEffect(() => {
    if (permit) {
      form.reset({
        ...permit,
        areaId: permit.areaId,
        permit_expires: format(new Date(permit.permit_expires), "yyyy-MM-dd'T'HH:mm"),
      });
      setNewComment('');
    }
  }, [permit, form]);

  const handleIssuePermit = async () => {
    if (!permit || !currentUser?.displayName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot issue permit.' });
        return;
    }

    const updatedPermit: HotWorkPermit = {
        ...permit,
        ...form.getValues(),
        permit_expires: new Date(form.getValues('permit_expires')).toISOString(),
        status: 'Active',
        supervisor_signature: { name: currentUser.displayName, date: new Date().toISOString() },
        comments: [
            ...(permit.comments || []),
            {
                user: 'System Log',
                comment: `${currentUser.displayName} issued the permit, making it active.`,
                date: new Date().toISOString(),
            }
        ],
    };

    const success = await onUpdate(updatedPermit);
    if(success) {
      toast({ title: 'Permit Issued', description: 'The permit is now active.' });
    }
  };

  const handleSign = async (signatureType: 'employee' | 'final_supervisor') => {
    if (!permit || !currentUser?.displayName) {
        toast({ variant: 'destructive', title: 'Error', description: 'Cannot sign permit.' });
        return;
    }

    let updatedPermit = { ...permit };
    const signature = { name: currentUser.displayName, date: new Date().toISOString() };
    let commentLog: Comment | null = null;

    if (signatureType === 'employee' && !updatedPermit.employee_signature) {
        updatedPermit.employee_signature = signature;
        updatedPermit.work_complete = new Date().toISOString();
        commentLog = {
          user: 'System Log',
          comment: `${currentUser.displayName} signed to confirm work completion.`,
          date: new Date().toISOString(),
        };
    } else if (signatureType === 'final_supervisor' && !updatedPermit.final_supervisor_signature) {
        updatedPermit.final_supervisor_signature = signature;
        updatedPermit.final_check = new Date().toISOString();
        updatedPermit.status = 'Closed';
        commentLog = {
          user: 'System Log',
          comment: `${currentUser.displayName} performed the final check and closed the permit.`,
          date: new Date().toISOString(),
        };
    } else {
        return; // Already signed
    }

    if (commentLog) {
      updatedPermit.comments = [...(updatedPermit.comments || []), commentLog];
    }

    const success = await onUpdate(updatedPermit);
    if(success) {
      toast({ title: 'Permit Signed', description: 'The permit has been successfully signed.' });
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && permit && currentUser) {
      addComment(permit.permit_id, {
        user: currentUser.displayName || 'Anonymous',
        comment: newComment.trim(),
        date: new Date().toISOString(),
      });
      setNewComment('');
    }
  };

  const onSubmit = async (data: PermitFormValues) => {
    if (isCreateMode) {
      if (!currentUser || !currentUser.displayName) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
      }
      const locationName = findAreaPathById(areas, data.areaId);
      if (!locationName) {
        toast({ variant: 'destructive', title: 'Invalid Area', description: 'Could not find the selected area.' });
        return;
      }

      const newPermit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'> = {
        supervisor: data.supervisor,
        performed_by_type: data.performed_by_type,
        areaId: data.areaId,
        work_to_be_performed_by: data.work_to_be_performed_by,
        permit_expires: new Date(data.permit_expires).toISOString(),
        special_instructions: data.special_instructions,
        enclosed_equip_notes: data.enclosed_equip_notes,
        fire_watch_required: data.fire_watch_required,
        checklist: data.checklist,
      };

      const success = await onAdd(newPermit, locationName);
      if (success) {
        toast({ title: 'Draft Permit Created', description: 'The permit has been saved as a draft.' });
        setOpen(false);
      }

    } else if (permit) {
      // This is for saving changes to an existing permit (e.g., a draft)
      const updatedPermit = {
        ...permit,
        ...data,
        permit_expires: new Date(data.permit_expires).toISOString(),
      };
      const success = await onUpdate(updatedPermit);
      if(success) {
        toast({ title: 'Permit Updated', description: 'Your changes have been saved.' });
        setOpen(false);
      }
    }
  };

  const isFormLocked = !isCreateMode && permit?.status === 'Closed';
  const isDraft = !isCreateMode && permit?.status === 'Draft';
  const isViewMode = isFormLocked || (!isDraft && !isCreateMode);

  const getAvatarInitials = (name: string) => {
    if (name === 'System Log') return 'SL';
    return name.split(' ').map(n => n[0]).join('').substring(0,2).toUpperCase();
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isCreateMode ? 'Create New Hot Work Permit' : `Hot Work Permit: ${permit.display_id}`}</DialogTitle>
          <DialogDescription>
            {isCreateMode ? 'Fill in the details below to issue a new permit.' : `Details for permit in ${permit.locationName}`}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           {/* Left/Main Column */}
           <div className="md:col-span-2 space-y-6">
              <div className="text-center mb-4">
                  <p className="font-semibold">Before starting hot work, review all safety precautions.</p>
                  <p className="text-sm text-muted-foreground">Can this job be avoided or is there a safer way?</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                {/* Left Sub-Column */}
                <div className="space-y-4">
                    <FormField control={form.control} name="supervisor" render={({ field }) => (
                        <FormItem><FormLabel>Supervisor</FormLabel><FormControl><Input {...field} disabled={!isCreateMode && !isDraft} /></FormControl><FormMessage /></FormItem>
                    )}/>

                    <FormField control={form.control} name="performed_by_type" render={({ field }) => (
                        <FormItem><FormLabel>Hot work performed by:</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={!isCreateMode && !isDraft}><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="RDT Employee" /></FormControl><FormLabel className="font-normal">RDT Employee</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Contractor" /></FormControl><FormLabel className="font-normal">Contractor</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                    )}/>

                    <FormField control={form.control} name="areaId" render={({ field }) => (
                        <FormItem><FormLabel>Location/bldg./room/floor</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isCreateMode && !isDraft}>
                                <FormControl><SelectTrigger><SelectValue placeholder="Select an area..." /></SelectTrigger></FormControl>
                                <SelectContent><AreaSelectOptions areas={areas} /></SelectContent>
                            </Select>
                        <FormMessage /></FormItem>
                    )}/>

                    <FormField control={form.control} name="work_to_be_performed_by" render={({ field }) => (
                        <FormItem><FormLabel>Work to be performed by</FormLabel><FormControl><Input {...field} disabled={!isCreateMode && !isDraft} /></FormControl><FormMessage /></FormItem>
                    )}/>

                    {!isCreateMode && permit.supervisor_signature && (
                        <div><FormLabel>Supervisor Signature</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{permit.supervisor_signature.name} on {format(new Date(permit.supervisor_signature.date), 'P p')}</p></div>
                    )}
                </div>

                {/* Right Sub-Column (Checklist) */}
                <div className="space-y-4 row-span-2">
                    <h3 className="font-bold text-lg">Precaution & safeguard checklist</h3>

                    <ChecklistSection form={form} items={CHECKLIST_ITEMS.filter(i => i.group === 'precautions')} isViewMode={isViewMode} />

                    <div>
                        <h4 className="font-semibold text-sm mt-4">Requirements within 35 ft. of work:</h4>
                        <ChecklistSection form={form} items={CHECKLIST_ITEMS.filter(i => i.group === 'requirements')} isViewMode={isViewMode} />
                    </div>

                    <div>
                        <h4 className="font-semibold text-sm mt-4">Work on enclosed/confined equip:</h4>
                        <FormField control={form.control} name="enclosed_equip_notes" render={({ field }) => (
                            <FormControl><Input placeholder="N/A" {...field} value={field.value ?? ""} className="inline-block w-auto text-sm h-8" disabled={isViewMode} /></FormControl>
                        )}/>
                        <ChecklistSection form={form} items={CHECKLIST_ITEMS.filter(i => i.group === 'enclosed')} isViewMode={isViewMode} />
                    </div>

                    <div>
                        <FormField control={form.control} name="fire_watch_required" render={({ field }) => (
                            <FormItem><FormLabel>Fire watch required?</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={isViewMode}><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="No" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                        )}/>
                        <div className="mt-2"><ChecklistSection form={form} items={CHECKLIST_ITEMS.filter(i => i.group === 'fire_watch')} isViewMode={isViewMode} /></div>
                    </div>
                </div>

                <FormField control={form.control} name="permit_expires" render={({ field }) => (
                    <FormItem><FormLabel>Permit Expires</FormLabel><FormControl><Input type="datetime-local" {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="special_instructions" render={({ field }) => (
                    <FormItem><FormLabel>Special instructions</FormLabel><FormControl><Textarea {...field} value={field.value ?? ""} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>
                )}/>

                {!isCreateMode && (
                    <>
                    <Separator />
                    <div className="space-y-4">
                        <h3 className="font-bold text-lg">Work Completion & Final Check</h3>

                        {/* Employee Signature */}
                        <div>
                            <FormLabel>Employee Acknowledgement</FormLabel>
                            {permit.employee_signature ? (
                                <p className="text-sm p-2 border rounded-md bg-muted">Work completed by {permit.employee_signature.name} on {format(new Date(permit.employee_signature.date), 'P p')}</p>
                            ) : (
                                <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Employee performing work must sign to confirm completion.</p>
                                    <Button type="button" onClick={() => handleSign('employee')} disabled={isFormLocked || isDraft}>
                                        <UserCheck className="mr-2 h-4 w-4" /> Sign Work Complete
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Final Supervisor Signature */}
                        <div>
                            <FormLabel>Final Supervisor Check</FormLabel>
                            {permit.final_supervisor_signature ? (
                                <p className="text-sm p-2 border rounded-md bg-muted">Final check by {permit.final_supervisor_signature.name} on {format(new Date(permit.final_supervisor_signature.date), 'P p')}</p>
                            ) : (
                                <div className="p-4 border rounded-md bg-muted/50 flex items-center justify-between">
                                    <p className="text-sm text-muted-foreground">Supervisor must perform final check after 30 mins.</p>
                                    <Button type="button" onClick={() => handleSign('final_supervisor')} disabled={!permit.employee_signature || isFormLocked}>
                                        <FileSignature className="mr-2 h-4 w-4" /> Sign and Close Permit
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                    </>
                )}
              </div>
            </div>
            {/* Right Column (Comments) */}
            {!isCreateMode && permit && (
              <div className="md:col-span-1 flex flex-col gap-4 border-l pl-6">
                <h3 className="text-lg font-semibold flex items-center gap-2"><MessageSquare className="h-5 w-5" /> Comments & Logs</h3>
                <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                    {(permit.comments || []).map((comment, index) => (
                        <div key={index} className="flex gap-3">
                        <Avatar>
                            <AvatarImage src={comment.user !== 'System Log' ? `https://placehold.co/40x40.png?text=${getAvatarInitials(comment.user)}` : undefined} />
                            <AvatarFallback>{getAvatarInitials(comment.user)}</AvatarFallback>
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
                    {(permit.comments || []).length === 0 && (
                      <p className="text-sm text-center text-muted-foreground py-4">No comments or logs yet.</p>
                    )}
                </div>
                <div className="flex flex-col gap-2 mt-auto">
                    <Textarea placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} rows={2} disabled={isFormLocked}/>
                    <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim() || isFormLocked}>
                        Add Comment
                    </Button>
                </div>
              </div>
            )}
         </div>
        </div>
        <DialogFooter>
            {isCreateMode && (
                <>
                    <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                    <Button type="submit">Save as Draft</Button>
                </>
            )}
            {!isCreateMode && permit && (
                <>
                    {permit.status === 'Draft' && !isFormLocked && (
                        <>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button type="submit">Save Draft Changes</Button>
                            <Button type="button" onClick={handleIssuePermit}>Issue &amp; Sign Permit</Button>
                        </>
                    )}
                     {permit.status !== 'Draft' && (
                        <Button type="button" onClick={() => setOpen(false)}>Close</Button>
                    )}
                </>
            )}
        </DialogFooter>
      </form>
    </Form>
  )
}

export default function HotWorkPermitsPage() {
    const { user: currentUser } = useAuth();
    const { hotWorkPermits, addHotWorkPermit, updateHotWorkPermit, addCommentToHotWorkPermit, areas } = useAppData();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState<HotWorkPermit | null>(null);

    const handleAddPermit = async (permit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string): Promise<boolean> => {
        try {
            await addHotWorkPermit(permit, locationName);
            return true;
        } catch (error) {
            console.error("Failed to add Hot Work Permit:", error);
            toast({ variant: 'destructive', title: 'Save Failed', description: 'There was an error saving the permit.' });
            return false;
        }
    };

    const handleUpdatePermit = async (permit: HotWorkPermit): Promise<boolean> => {
        try {
            await updateHotWorkPermit(permit);
            return true;
        } catch (error) {
            console.error("Failed to update Hot Work Permit:", error);
            toast({ variant: 'destructive', title: 'Update Failed', description: 'There was an error updating the permit.' });
            return false;
        }
    };

    const handleAddCommentToPermit = async (permitId: string, comment: Comment) => {
        await addCommentToHotWorkPermit(permitId, comment);
    };

    const handleOpenDialog = (permit?: HotWorkPermit) => {
        setSelectedPermit(permit || null);
        setDialogOpen(true);
    }

    const calculateStatus = (permit: HotWorkPermit): { text: HotWorkPermit['status'] | 'Expired', variant: 'default' | 'destructive' | 'outline' | 'secondary' } => {
        if (permit.status === 'Closed') {
            return { text: 'Closed', variant: 'outline' };
        }
        if (permit.status === 'Draft') {
            return { text: 'Draft', variant: 'secondary' };
        }
        if (new Date(permit.permit_expires) < new Date()) {
            return { text: 'Expired', variant: 'destructive' };
        }
        return { text: 'Active', variant: 'default' };
    }

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Hot Work Permits</h2>
                    <Button onClick={() => handleOpenDialog()}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Create Permit
                    </Button>
                </div>
                <p className="text-muted-foreground">
                    Create, review, and acknowledge permits for work involving heat or sparks.
                </p>

                <Card>
                    <CardHeader>
                        <CardTitle>Issued Permits</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Permit ID</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Supervisor</TableHead>
                                    <TableHead>Expires</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hotWorkPermits.length > 0 ? hotWorkPermits.map((permit) => {
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
                                )}) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center">No hot work permits found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { if(!open) setSelectedPermit(null); setDialogOpen(open); }}>
                <DialogContent className="max-w-5xl">
                    <PermitDetailsDialog
                        onAdd={handleAddPermit}
                        onUpdate={handleUpdatePermit}
                        addComment={handleAddCommentToPermit}
                        setOpen={setDialogOpen}
                        permit={selectedPermit}
                        areas={areas}
                    />
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
