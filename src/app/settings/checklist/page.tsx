
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
import type { PredefinedChecklistItem } from '@/types';

const checklistItemSchema = z.object({
  text: z.string().min(5, { message: 'Checklist item text must be at least 5 characters.' }),
});

type ChecklistItemFormValues = z.infer<typeof checklistItemSchema>;

const ChecklistItemForm = ({ 
    item, 
    onSave, 
    setOpen,
    isEdit = false,
}: { 
    item?: PredefinedChecklistItem; 
    onSave: (data: ChecklistItemFormValues, isEdit: boolean, itemId?: string) => void; 
    setOpen: (open: boolean) => void;
    isEdit?: boolean;
}) => {
  const form = useForm<ChecklistItemFormValues>({
    resolver: zodResolver(checklistItemSchema),
    defaultValues: {
      text: item?.text || '',
    },
  });

  const onSubmit = (data: ChecklistItemFormValues) => {
    onSave(data, isEdit, item?.id);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Checklist Item' : 'Add New Checklist Item'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the text for this item.' : 'Add a new reusable checklist item for Safety Walks.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Item Text</FormLabel>
                <FormControl><Input placeholder="e.g., Are fire extinguishers accessible?" {...field} /></FormControl>
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


export default function ChecklistManagementPage() {
  const { predefinedChecklistItems, addPredefinedChecklistItem, updatePredefinedChecklistItem, removePredefinedChecklistItem } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PredefinedChecklistItem | undefined>(undefined);
  const { toast } = useToast();

  const handleSave = (data: ChecklistItemFormValues, isEdit: boolean, itemId?: string) => {
    if (isEdit && itemId) {
      updatePredefinedChecklistItem({ id: itemId, text: data.text });
      toast({ title: 'Item Updated', description: 'The checklist item has been updated.' });
    } else {
      addPredefinedChecklistItem({ id: `pcl-${Date.now()}`, text: data.text });
      toast({ title: 'Item Added', description: 'The new checklist item has been added.' });
    }
  };

  const openForm = (item?: PredefinedChecklistItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Predefined Checklist Items</CardTitle>
            <CardDescription>Manage the master list of checklist items for your Safety Walks.</CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Item
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ChecklistItemForm
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
                <TableHead>Checklist Item Text</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predefinedChecklistItems.map((item) => (
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
                            This will permanently delete the checklist item. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removePredefinedChecklistItem(item.id)}>Delete</AlertDialogAction>
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
