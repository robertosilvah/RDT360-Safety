
'use client';

import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import type { HotWorkPermit, HotWorkPermitChecklist } from '@/types';
import { PlusCircle, Users, FileSignature, Flame, Clock, CheckSquare, Trash2, UserCheck, Edit } from 'lucide-react';
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
import { format } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/context/AuthContext';


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
  location: z.string().min(1, "Location is required."),
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
    { id: 'adequate_ventilation', label: 'Adequate ventilation is provided.', group: 'enclosed' },
    { id: 'atmosphere_checked', label: 'Atmosphere checked with gas detector.', group: 'enclosed' },
    { id: 'vapors_purged', label: 'Purge any flammable vapors.', group: 'enclosed' },
    { id: 'confined_space_permit', label: 'Confined Space Permit obtained, if required.', group: 'enclosed' },
    { id: 'fire_watch_provided', label: 'Trained and equipped Fire Watch provided during operations and at least 30 minutes after.', group: 'fire_watch' },
];

const PermitForm = ({ onSave, setOpen, permit }: { onSave: (permit: PermitFormValues) => void, setOpen: (open: boolean) => void, permit?: HotWorkPermit }) => {
  const form = useForm<PermitFormValues>({
    resolver: zodResolver(permitFormSchema),
    defaultValues: permit ? {
        ...permit,
        permit_expires: format(new Date(permit.permit_expires), "yyyy-MM-dd'T'HH:mm"),
    } : {
        supervisor: '',
        location: '',
        work_to_be_performed_by: '',
        permit_expires: '',
        special_instructions: '',
        enclosed_equip_notes: '',
        checklist: {
            fire_extinguisher: true,
            equipment_good_repair: true,
            energy_locked_out: true,
            floors_swept: true,
            fire_resistive_covers: true,
            openings_covered: true,
            walls_ceilings_protected: true,
            fire_watch_provided: true,
        }
    },
  });
  
  const isViewMode = !!permit;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSave)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isViewMode ? `Hot Work Permit: ${permit.display_id}` : 'Create a New Hot Work Permit'}</DialogTitle>
          <DialogDescription>
            {isViewMode ? `Details for permit in ${permit.location}` : 'Fill in the details below to issue a new permit.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[70vh] overflow-y-auto pr-4 space-y-6 border-t pt-6">
          <div className="text-center mb-4">
              <p className="font-semibold">Before starting hot work, review all safety precautions.</p>
              <p className="text-sm text-muted-foreground">Can this job be avoided or is there a safer way?</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            {/* Left Column */}
            <div className="space-y-4">
                <FormField control={form.control} name="supervisor" render={({ field }) => (
                    <FormItem><FormLabel>Supervisor</FormLabel><FormControl><Input {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                <FormField control={form.control} name="performed_by_type" render={({ field }) => (
                    <FormItem><FormLabel>Hot work performed by:</FormLabel><FormControl><RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-4" disabled={isViewMode}><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="RDT Employee" /></FormControl><FormLabel className="font-normal">RDT Employee</FormLabel></FormItem><FormItem className="flex items-center space-x-2"><FormControl><RadioGroupItem value="Contractor" /></FormControl><FormLabel className="font-normal">Contractor</FormLabel></FormItem></RadioGroup></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="location" render={({ field }) => (
                    <FormItem><FormLabel>Location/bldg./room/floor</FormLabel><FormControl><Input {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>
                )}/>

                <FormField control={form.control} name="work_to_be_performed_by" render={({ field }) => (
                    <FormItem><FormLabel>Work to be performed by</FormLabel><FormControl><Input {...field} disabled={isViewMode} /></FormControl><FormMessage /></FormItem>
                )}/>
                
                {isViewMode && permit.supervisor_signature && (
                    <div><FormLabel>Supervisor Signature</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{permit.supervisor_signature.name} on {format(new Date(permit.supervisor_signature.date), 'P')}</p></div>
                )}
            </div>

            {/* Right Column (Checklist) */}
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

             {isViewMode && permit.work_complete && (
                <div><FormLabel>Work Complete</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{format(new Date(permit.work_complete), 'Pp')}</p></div>
            )}
             {isViewMode && permit.final_check && (
                <div><FormLabel>Final Check</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{format(new Date(permit.final_check), 'Pp')}</p></div>
            )}
             {isViewMode && permit.employee_signature && (
                <div><FormLabel>Employee Signature</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{permit.employee_signature.name} on {format(new Date(permit.employee_signature.date), 'P')}</p></div>
            )}
             {isViewMode && permit.final_supervisor_signature && (
                <div><FormLabel>Final Supervisor Signature</FormLabel><p className="text-sm p-2 border rounded-md bg-muted">{permit.final_supervisor_signature.name} on {format(new Date(permit.final_supervisor_signature.date), 'P')}</p></div>
            )}
          </div>
        </div>
        {!isViewMode && (
            <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Create Permit</Button>
            </DialogFooter>
        )}
      </form>
    </Form>
  )
}

const ChecklistSection = ({ form, items, isViewMode }: { form: any; items: { id: keyof HotWorkPermitChecklist; label: string }[]; isViewMode: boolean }) => (
  <div className="space-y-2 mt-2">
    {items.map((item) => (
      <FormField key={item.id} control={form.control} name={`checklist.${item.id}`} render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} disabled={isViewMode} /></FormControl>
            <FormLabel className="text-sm font-normal">{item.label}</FormLabel>
          </FormItem>
        )}/>
    ))}
  </div>
);


export default function HotWorkPermitsPage() {
    const { user } = useAuth();
    const { hotWorkPermits, addHotWorkPermit, updateHotWorkPermit } = useAppData();
    const { toast } = useToast();
    const [isDialogOpen, setDialogOpen] = useState(false);
    const [selectedPermit, setSelectedPermit] = useState<HotWorkPermit | null>(null);

    const handleSavePermit = async (data: PermitFormValues) => {
        const newPermit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date'> = {
            supervisor: data.supervisor,
            performed_by_type: data.performed_by_type,
            location: data.location,
            work_to_be_performed_by: data.work_to_be_performed_by,
            permit_expires: new Date(data.permit_expires).toISOString(),
            special_instructions: data.special_instructions,
            enclosed_equip_notes: data.enclosed_equip_notes,
            fire_watch_required: data.fire_watch_required,
            checklist: data.checklist,
        };
        await addHotWorkPermit(newPermit);
        toast({
            title: 'Hot Work Permit Created',
            description: `The permit for "${data.location}" has been successfully created.`,
        });
        setDialogOpen(false);
    };

    const handleOpenDialog = (permit?: HotWorkPermit) => {
        setSelectedPermit(permit || null);
        setDialogOpen(true);
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
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {hotWorkPermits.length > 0 ? hotWorkPermits.map((permit) => (
                                    <TableRow key={permit.permit_id} className="cursor-pointer" onClick={() => handleOpenDialog(permit)}>
                                        <TableCell><Badge variant="outline">{permit.display_id}</Badge></TableCell>
                                        <TableCell className="font-medium">{permit.location}</TableCell>
                                        <TableCell>{permit.supervisor}</TableCell>
                                        <TableCell>{format(new Date(permit.permit_expires), 'P p')}</TableCell>
                                        <TableCell><Button variant="ghost" size="sm">View</Button></TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center">No hot work permits found.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-5xl">
                    <PermitForm 
                        onSave={handleSavePermit} 
                        setOpen={setDialogOpen} 
                        permit={selectedPermit || undefined}
                    />
                </DialogContent>
            </Dialog>
        </AppShell>
    );
}
