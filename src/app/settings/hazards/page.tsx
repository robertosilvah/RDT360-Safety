
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
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
import type { PredefinedHazard } from '@/types';

const hazardFormSchema = z.object({
  text: z.string().min(3, { message: 'Hazard text must be at least 3 characters.' }),
});

type HazardFormValues = z.infer<typeof hazardFormSchema>;

const HazardForm = ({ 
    item, 
    onSave, 
    setOpen,
    isEdit = false,
}: { 
    item?: PredefinedHazard; 
    onSave: (data: HazardFormValues, isEdit: boolean, itemId?: string) => void; 
    setOpen: (open: boolean) => void;
    isEdit?: boolean;
}) => {
  const form = useForm<HazardFormValues>({
    resolver: zodResolver(hazardFormSchema),
    defaultValues: {
      text: item?.text || '',
    },
  });

  const onSubmit = (data: HazardFormValues) => {
    onSave(data, isEdit, item?.id);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Hazard' : 'Add New Hazard'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the text for this hazard.' : 'Add a new reusable hazard for JSAs.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hazard Text</FormLabel>
                <FormControl><Input placeholder="e.g., Slips, trips, and falls" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save & Close' : 'Add Item'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};


export default function HazardManagementPage() {
  const { predefinedHazards, addPredefinedHazard, updatePredefinedHazard, removePredefinedHazard } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PredefinedHazard | undefined>(undefined);
  const { toast } = useToast();

  const handleSave = (data: HazardFormValues, isEdit: boolean, itemId?: string) => {
    if (isEdit && itemId) {
      updatePredefinedHazard({ id: itemId, text: data.text });
      toast({ title: 'Item Updated', description: 'The hazard has been updated.' });
    } else {
      addPredefinedHazard({ text: data.text });
      toast({ title: 'Item Added', description: 'The new hazard has been added.' });
    }
  };

  const openForm = (item?: PredefinedHazard) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Predefined JSA Hazards</CardTitle>
            <CardDescription>Manage the master list of potential hazards for your Job Safety Analyses.</CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Hazard
              </Button>
            </DialogTrigger>
            <DialogContent>
              <HazardForm
                item={editingItem}
                onSave={handleSave}
                setOpen={setFormOpen}
                isEdit={!!editingItem}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hazard Text</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predefinedHazards.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.text}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openForm(item)}>
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
                            This will permanently delete the hazard item. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removePredefinedHazard(item.id)}>Delete</AlertDialogAction>
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
  );
}
