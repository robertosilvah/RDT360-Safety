
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAppData } from '@/context/AppDataContext';
import { PlusCircle, Edit, Trash2, QrCode, Printer, Upload } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import type { Forklift } from '@/types';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';

const forkliftFormSchema = z.object({
  id: z.string().min(2, { message: 'Forklift ID must be at least 2 characters.' }),
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  area: z.string().min(2, { message: 'Area must be at least 2 characters.' }),
  imageFile: z.instanceof(File).optional(),
});

type ForkliftFormValues = z.infer<typeof forkliftFormSchema>;

const ForkliftForm = ({ 
    forklift, 
    onSave, 
    setOpen,
    isEdit = false,
}: { 
    forklift?: Forklift; 
    onSave: (data: ForkliftFormValues, isEdit: boolean) => void; 
    setOpen: (open: boolean) => void;
    isEdit?: boolean;
}) => {
  const { uploadSettings } = useAppData();
  const { toast } = useToast();
  const [previewUrl, setPreviewUrl] = useState<string | null>(forklift?.imageUrl || null);

  const form = useForm<ForkliftFormValues>({
    resolver: zodResolver(forkliftFormSchema),
    defaultValues: {
      id: forklift?.id || '',
      name: forklift?.name || '',
      area: forklift?.area || '',
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSizeMB = uploadSettings?.imageMaxSizeMB || 2;
      const maxSizeInBytes = maxSizeMB * 1024 * 1024;
      if (file.size > maxSizeInBytes) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `The image must be smaller than ${maxSizeMB}MB.`,
        });
        if (e.target) e.target.value = '';
        return;
      }
      form.setValue('imageFile', file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = (data: ForkliftFormValues) => {
    onSave(data, isEdit);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit Forklift' : 'Add New Forklift'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Update the details for this forklift.' : 'Fill in the details for the new forklift.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forklift ID</FormLabel>
                <FormControl><Input placeholder="e.g., FL-04" {...field} disabled={isEdit} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name / Model</FormLabel>
                <FormControl><Input placeholder="e.g., Clark C25" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="area"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Area</FormLabel>
                <FormControl><Input placeholder="e.g., Warehouse" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="imageFile"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Forklift Image</FormLabel>
                <div className="flex items-center gap-4">
                    <div className="relative h-20 w-20 rounded-md border flex items-center justify-center bg-muted/50">
                        {previewUrl ? (
                            <Image src={previewUrl} alt="Forklift preview" layout="fill" objectFit="contain" className="p-1" />
                        ) : (
                            <Skeleton className="h-full w-full" />
                        )}
                    </div>
                    <FormControl>
                        <Input type="file" accept="image/*" onChange={handleFileChange} className="max-w-xs" />
                    </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">{isEdit ? 'Save & Close' : 'Add Forklift'}</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const QrCodeDialog = ({ forklift, open, onOpenChange }: { forklift: Forklift | null; open: boolean; onOpenChange: (open: boolean) => void; }) => {
    if (!forklift) return null;

    const qrUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/forklift-inspections?forklift_id=${forklift.id}`
        : '';
    
    const handlePrint = () => {
        window.print();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <div className="qr-code-printable-area flex flex-col items-center justify-center text-center p-4">
                    <DialogHeader>
                        <DialogTitle className="text-2xl">Forklift: {forklift.id}</DialogTitle>
                        <DialogDescription>{forklift.name}</DialogDescription>
                    </DialogHeader>
                    <div className="p-4 my-4 border rounded-lg bg-white">
                        {qrUrl && <QRCodeCanvas value={qrUrl} size={256} />}
                    </div>
                    <p className="text-sm text-muted-foreground max-w-xs">
                        Scan this QR code with a mobile device to open the pre-use inspection form for this forklift.
                    </p>
                </div>
                <DialogFooter className="no-print !justify-between">
                    <Button type="button" variant="outline" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" /> Print QR Code
                    </Button>
                    <Button type="button" onClick={() => onOpenChange(false)}>Close</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ForkliftManagementPage() {
  const { forklifts, addForklift, updateForklift, removeForklift } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingForklift, setEditingForklift] = useState<Forklift | undefined>(undefined);
  const [qrCodeForklift, setQrCodeForklift] = useState<Forklift | null>(null);
  const { toast } = useToast();

  const handleSave = (data: ForkliftFormValues, isEdit: boolean) => {
    const forkliftData: Omit<Forklift, 'imageUrl'> & { imageFile?: File } = {
        id: data.id,
        name: data.name,
        area: data.area,
        imageFile: data.imageFile,
    };
    if (isEdit) {
      const existingForklift = forklifts.find(f => f.id === data.id);
      if (existingForklift) {
        updateForklift({
            ...existingForklift, 
            ...forkliftData,
            imageUrl: existingForklift.imageUrl // Preserve existing image if not changed
        });
        toast({ title: 'Forklift Updated', description: `Forklift ${data.id} has been updated.` });
      }
    } else {
      addForklift(forkliftData);
      toast({ title: 'Forklift Added', description: `Forklift ${data.id} has been added.` });
    }
  };

  const openForm = (forklift?: Forklift) => {
    setEditingForklift(forklift);
    setFormOpen(true);
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Forklift Fleet</CardTitle>
            <CardDescription>Add, edit, or remove forklifts from your fleet.</CardDescription>
          </div>
           <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Forklift
              </Button>
            </DialogTrigger>
            <DialogContent>
              <ForkliftForm
                forklift={editingForklift}
                onSave={handleSave}
                setOpen={setFormOpen}
                isEdit={!!editingForklift}
              />
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name / Model</TableHead>
                <TableHead>Area</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {forklifts.map((forklift) => (
                <TableRow key={forklift.id}>
                  <TableCell className="font-medium">{forklift.id}</TableCell>
                  <TableCell>{forklift.name}</TableCell>
                  <TableCell>{forklift.area}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setQrCodeForklift(forklift)}>
                      <QrCode className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openForm(forklift)}>
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
                            This will permanently delete the forklift "{forklift.name}". This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => removeForklift(forklift.id)}>Delete</AlertDialogAction>
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
      <QrCodeDialog 
        forklift={qrCodeForklift}
        open={!!qrCodeForklift}
        onOpenChange={(open) => !open && setQrCodeForklift(null)}
      />
    </>
  );
}
