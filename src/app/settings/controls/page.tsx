
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { PlusCircle, Edit, Trash2, ChevronsUpDown, Check } from 'lucide-react';
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
import type { PredefinedControl, PredefinedHazard } from '@/types';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Command, CommandInput, CommandEmpty, CommandGroup, CommandItem } from '@/components/ui/command';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const controlFormSchema = z.object({
  text: z.string().min(3, { message: 'Control measure text must be at least 3 characters.' }),
  reference: z.array(z.string()).optional(),
});

type ControlFormValues = z.infer<typeof controlFormSchema>;

const MultiSelectPopover = ({
  options,
  selected,
  onSelectedChange,
  placeholder,
}: {
  options: PredefinedHazard[];
  selected: string[];
  onSelectedChange: (selected: string[]) => void;
  placeholder: string;
}) => {
  const [open, setOpen] = useState(false);
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto"
        >
          <div className="flex flex-wrap gap-1">
            {selected.length > 0
              ? selected.map(value => <Badge key={value} variant="secondary">{value}</Badge>)
              : placeholder}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search hazards..." />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandGroup className="max-h-60 overflow-y-auto">
            {options.map((option) => (
              <CommandItem
                key={option.id}
                onSelect={() => {
                  const newSelected = selected.includes(option.text)
                    ? selected.filter((item) => item !== option.text)
                    : [...selected, option.text];
                  onSelectedChange(newSelected);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    selected.includes(option.text) ? "opacity-100" : "opacity-0"
                  )}
                />
                {option.text}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const ControlForm = ({ 
    item, 
    onSave, 
    setOpen,
    isEdit = false,
    predefinedHazards,
}: { 
    item?: PredefinedControl; 
    onSave: (data: ControlFormValues, isEdit: boolean, itemId?: string) => void; 
    setOpen: (open: boolean) => void;
    isEdit?: boolean;
    predefinedHazards: PredefinedHazard[];
}) => {
  const form = useForm<ControlFormValues>({
    resolver: zodResolver(controlFormSchema),
    defaultValues: {
      text: item?.text || '',
      reference: item?.reference || [],
    },
  });

  const onSubmit = (data: ControlFormValues) => {
    onSave(data, isEdit, item?.id);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Control Measure' : 'Add New Control Measure'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the text for this control measure.' : 'Add a new reusable control measure for JSAs.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="text"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Control Measure Text</FormLabel>
                <FormControl><Input placeholder="e.g., Use Lock-Out/Tag-Out procedures" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="reference"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hazard Reference (Optional)</FormLabel>
                <FormControl>
                  <MultiSelectPopover 
                    options={predefinedHazards}
                    selected={field.value || []}
                    onSelectedChange={field.onChange}
                    placeholder="Select related hazards..."
                  />
                </FormControl>
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


export default function ControlManagementPage() {
  const { predefinedControls, addPredefinedControl, updatePredefinedControl, removePredefinedControl, predefinedHazards } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PredefinedControl | undefined>(undefined);
  const { toast } = useToast();

  const handleSave = (data: ControlFormValues, isEdit: boolean, itemId?: string) => {
    const controlData = {
      text: data.text,
      reference: data.reference || [],
    };
    if (isEdit && itemId) {
      updatePredefinedControl({ id: itemId, ...controlData });
      toast({ title: 'Item Updated', description: 'The control measure has been updated.' });
    } else {
      addPredefinedControl(controlData);
      toast({ title: 'Item Added', description: 'The new control measure has been added.' });
    }
  };

  const openForm = (item?: PredefinedControl) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Predefined JSA Controls</CardTitle>
            <CardDescription>Manage the master list of control measures for your Job Safety Analyses.</CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Control
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ControlForm
                item={editingItem}
                onSave={handleSave}
                setOpen={setFormOpen}
                isEdit={!!editingItem}
                predefinedHazards={predefinedHazards}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Control Measure Text</TableHead>
                <TableHead>Hazard Reference(s)</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {predefinedControls.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.text}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {item.reference && item.reference.length > 0 ? (
                        item.reference.map(ref => <Badge key={ref} variant="secondary">{ref}</Badge>)
                      ) : (
                        <span className="text-muted-foreground">N/A</span>
                      )}
                    </div>
                  </TableCell>
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
                            This will permanently delete the control measure. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removePredefinedControl(item.id)}>Delete</AlertDialogAction>
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
