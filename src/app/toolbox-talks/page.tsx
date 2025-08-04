
'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { ToolboxTalk } from '@/types';
import { PlusCircle, FileSignature, Clock, User, MapPin } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { format } from 'date-fns';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const talkFormSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  date: z.string().refine(val => val && !isNaN(Date.parse(val)), { message: "A valid date is required." }),
  leader: z.string().min(2, "Leader name is required."),
  location: z.string().min(2, "Location is required."),
  observations: z.string().min(10, "Observations must be at least 10 characters."),
});

type TalkFormValues = z.infer<typeof talkFormSchema>;

const CreateTalkForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addToolboxTalk } = useAppData();
  const { toast } = useToast();
  const form = useForm<TalkFormValues>({
    resolver: zodResolver(talkFormSchema),
    defaultValues: {
      title: '',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      leader: '',
      location: '',
      observations: '',
    },
  });

  const onSubmit = async (values: TalkFormValues) => {
    try {
      await addToolboxTalk({
        ...values,
        date: new Date(values.date).toISOString(),
      });
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
          <FormField control={form.control} name="location" render={({ field }) => (
            <FormItem><FormLabel>Location</FormLabel><FormControl><Input placeholder="e.g., Assembly Area" {...field} /></FormControl><FormMessage /></FormItem>
          )} />
          <FormField control={form.control} name="observations" render={({ field }) => (
            <FormItem><FormLabel>Topics & Observations</FormLabel><FormControl><Textarea placeholder="Describe the topics covered in the talk..." {...field} rows={5} /></FormControl><FormMessage /></FormItem>
          )} />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create Talk</Button>
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
            <DialogContent className="max-w-2xl">
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
