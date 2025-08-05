
'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { TalkSection, ToolboxTalk } from '@/types';
import { PlusCircle, FileSignature, Clock, User, MapPin, Check, Wand2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { ChevronsUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const talkSectionSchema = z.object({
  na: z.boolean().default(false),
  details: z.string().optional(),
}).refine(data => data.na || (data.details && data.details.trim() !== ''), {
  message: "Details are required if N/A is not checked.",
  path: ['details'],
});

const talkFormSchema = z.object({
  topic: z.string().min(3, "Topic must be at least 3 characters."),
  title: z.string().min(5, "Title must be at least 5 characters."),
  date: z.string().refine(val => val && !isNaN(Date.parse(val)), { message: "A valid date is required." }),
  leader: z.string().min(2, "Leader name is required."),
  location: z.string().min(2, "Location is required."),
  department: z.string().min(2, "Department is required."),
  observations: z.string().min(10, "General topics/observations must be at least 10 characters."),
  accidents_near_misses: talkSectionSchema,
  unsafe_conditions: talkSectionSchema,
  corrections_changed_procedures: talkSectionSchema,
  special_ppe: talkSectionSchema,
  assigned_to: z.array(z.string()).optional(),
  attachment: z.instanceof(File).optional(),
});

type TalkFormValues = z.infer<typeof talkFormSchema>;

const TalkSectionInput = ({ form, fieldName, label }: {
    form: ReturnType<typeof useForm<TalkFormValues>>;
    fieldName: "accidents_near_misses" | "unsafe_conditions" | "corrections_changed_procedures" | "special_ppe";
    label: string;
}) => (
    <Card className="p-4 bg-muted/30">
      <FormField
        control={form.control}
        name={`${fieldName}.details`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <FormControl>
              <Textarea
                placeholder="Enter details here or check N/A..."
                {...field}
                value={field.value ?? ''}
                disabled={form.watch(`${fieldName}.na`)}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name={`${fieldName}.na`}
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-2 space-y-0 mt-2">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  if (checked) {
                    form.setValue(`${fieldName}.details`, 'N/A');
                  } else {
                     form.setValue(`${fieldName}.details`, '');
                  }
                }}
              />
            </FormControl>
            <FormLabel className="font-normal">Not Applicable</FormLabel>
          </FormItem>
        )}
      />
    </Card>
);

const CreateTalkForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addToolboxTalk, users, uploadSettings, safetyDocs } = useAppData();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openUserSelect, setOpenUserSelect] = useState(false);
  
  const toolboxDocuments = safetyDocs.filter(doc => doc.category === 'Training Material');

  const form = useForm<TalkFormValues>({
    resolver: zodResolver(talkFormSchema),
    defaultValues: {
      topic: '',
      title: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      leader: '',
      location: '',
      department: '',
      observations: '',
      accidents_near_misses: { na: false, details: '' },
      unsafe_conditions: { na: false, details: '' },
      corrections_changed_procedures: { na: false, details: '' },
      special_ppe: { na: false, details: '' },
      assigned_to: [],
    },
  });
  
  const selectedUserIds = form.watch('assigned_to') || [];

  const handleDocumentSelect = (docId: string) => {
    const selectedDoc = safetyDocs.find(doc => doc.doc_id === docId);
    if (selectedDoc) {
      form.setValue('topic', selectedDoc.title, { shouldValidate: true });
      form.setValue('observations', `Reference document: ${selectedDoc.title} (${selectedDoc.display_id})`, { shouldValidate: true });
    }
  };

  const onSubmit = async (values: TalkFormValues) => {
    setIsSubmitting(true);
    try {
      await addToolboxTalk({
        ...values,
        date: new Date(values.date).toISOString(),
      }, values.attachment);
      toast({
        title: 'Toolbox Talk Created',
        description: `The talk "${values.title}" has been successfully scheduled.`,
      });
      setOpen(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to create the toolbox talk.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Create New Toolbox Talk</DialogTitle>
          <DialogDescription>
            Schedule a new talk. Attendees will be able to sign in after it's created.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-4">
           <FormItem>
             <FormLabel>Reference Document (Optional)</FormLabel>
             <Select onValueChange={handleDocumentSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Select a document to prefill content..."/>
              </SelectTrigger>
              <SelectContent>
                {toolboxDocuments.map(doc => (
                  <SelectItem key={doc.doc_id} value={doc.doc_id}>
                    {doc.title} ({doc.display_id})
                  </SelectItem>
                ))}
              </SelectContent>
             </Select>
           </FormItem>

          <FormField control={form.control} name="topic" render={({ field }) => (
            <FormItem><FormLabel>Topic</FormLabel><FormControl><Input placeholder="e.g., Ladder Safety" {...field} /></FormControl><FormMessage /></FormItem>
          )}/>

          <FormField control={form.control} name="title" render={({ field }) => (
            <FormItem><FormLabel>Title</FormLabel><FormControl><Input placeholder="e.g., Proper Lifting Techniques" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="date" render={({ field }) => (
              <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="datetime-local" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="leader" render={({ field }) => (
              <FormItem><FormLabel>Leader / Responsible</FormLabel><FormControl><Input placeholder="e.g., John Doe" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Assembly Area" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="department" render={({ field }) => (
              <FormItem><FormLabel>Department</FormLabel><FormControl><Input placeholder="e.g., Production" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
          </div>
          
          <Separator />

          <FormField control={form.control} name="observations" render={({ field }) => (
            <FormItem><FormLabel>General Topics / Observations</FormLabel><FormControl><Textarea placeholder="Describe the topics covered in the talk..." {...field} rows={6} /></FormControl><FormMessage /></FormItem>
          )} />

          <Separator />
          <h3 className="text-lg font-semibold">Assignment & Attachments</h3>

           <FormField
            control={form.control}
            name="assigned_to"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Assign to Users (Optional)</FormLabel>
                 <Popover open={openUserSelect} onOpenChange={setOpenUserSelect}>
                    <PopoverTrigger asChild>
                    <FormControl>
                        <Button variant="outline" role="combobox" className="w-full justify-between">
                        {selectedUserIds.length > 0 ? `${selectedUserIds.length} user(s) selected` : "Select users..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                    <Command>
                        <CommandInput placeholder="Search users..." />
                        <CommandEmpty>No users found.</CommandEmpty>
                        <CommandGroup>
                        {users.map((user) => (
                            <CommandItem
                                value={user.name}
                                key={user.id}
                                onSelect={() => {
                                    const isSelected = selectedUserIds.includes(user.id);
                                    const newSelection = isSelected
                                    ? selectedUserIds.filter((id) => id !== user.id)
                                    : [...selectedUserIds, user.id];
                                    field.onChange(newSelection);
                                }}
                            >
                            <Check className={`mr-2 h-4 w-4 ${selectedUserIds.includes(user.id) ? "opacity-100" : "opacity-0"}`} />
                            {user.name}
                            </CommandItem>
                        ))}
                        </CommandGroup>
                    </Command>
                    </PopoverContent>
                </Popover>
                 <div className="flex flex-wrap gap-1 pt-2">
                    {selectedUserIds.map(id => {
                        const user = users.find(u => u.id === id);
                        return user ? <Badge key={id} variant="secondary">{user.name}</Badge> : null;
                    })}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

           <FormField
                control={form.control}
                name="attachment"
                render={({ field: { onChange, value, ...rest } }) => (
                    <FormItem>
                        <FormLabel>Attach Document (Optional)</FormLabel>
                        <FormControl>
                            <Input
                                type="file"
                                {...rest}
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    const maxSizeMB = uploadSettings?.docMaxSizeMB || 10;
                                    const maxSizeInBytes = maxSizeMB * 1024 * 1024;
                                    if(file && file.size > maxSizeInBytes) {
                                        toast({ variant: 'destructive', title: 'File too large', description: `Attachment must be smaller than ${maxSizeMB}MB.` });
                                        if (e.target) e.target.value = '';
                                    } else if (file) {
                                        onChange(file);
                                    }
                                }}
                            />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
          
          <Separator />

          <div className="space-y-4">
            <TalkSectionInput form={form} fieldName="accidents_near_misses" label="1) Discuss any accidents or near misses that have occurred since last meeting:" />
            <TalkSectionInput form={form} fieldName="unsafe_conditions" label="2) List any unsafe or at risk conditions that exist:" />
            <TalkSectionInput form={form} fieldName="corrections_changed_procedures" label="3) Any conditions or procedures that have been corrected or changed for a safer/better working Environment:" />
            <TalkSectionInput form={form} fieldName="special_ppe" label="4) Any Special care and additional PPE needed to execute the current Job:" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
             {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
             Create Talk
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function ToolboxTalksPage() {
  const { toolboxTalks } = useAppData();
  const [isCreateOpen, setCreateOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Toolbox Talks</h2>
          <Dialog open={isCreateOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Talk
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <CreateTalkForm setOpen={setCreateOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          A log of all toolbox talks. Click a talk to view details and signatures.
        </p>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled Talks</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Leader</TableHead>
                  <TableHead>Signatures</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {toolboxTalks.map((talk) => (
                  <TableRow key={talk.id}>
                    <TableCell className="font-medium">{talk.display_id}</TableCell>
                    <TableCell>{talk.title}</TableCell>
                    <TableCell>{new Date(talk.date).toLocaleString()}</TableCell>
                    <TableCell>{talk.leader}</TableCell>
                    <TableCell>{talk.signatures.length}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/toolbox-talks/${talk.id}`}>View & Sign</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {toolboxTalks.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center">No talks have been created yet.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
