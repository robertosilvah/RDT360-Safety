'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import type { SafetyDoc } from '@/types';
import { Upload, FileText, FileBadge, FileJson, FileQuestion } from 'lucide-react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const categoryIcons = {
  'Policy': <FileBadge className="h-8 w-8 text-primary" />,
  'Procedure': <FileJson className="h-8 w-8 text-accent" />,
  'Form': <FileText className="h-8 w-8 text-yellow-500" />,
  'Training Material': <FileQuestion className="h-8 w-8 text-blue-500" />,
};

const docFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters."),
  category: z.enum(['Policy', 'Procedure', 'Form', 'Training Material']),
  related_modules: z.string().optional(),
});

type DocFormValues = z.infer<typeof docFormSchema>;

const DocumentUploadForm = ({ setOpen }: { setOpen: (open: boolean) => void }) => {
  const { addSafetyDoc, uploadSettings } = useAppData();
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');

  const form = useForm<DocFormValues>({
    resolver: zodResolver(docFormSchema),
    defaultValues: { title: '', category: 'Policy', related_modules: '' },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const maxSizeMB = uploadSettings?.docMaxSizeMB || 10;
      const maxSizeInBytes = maxSizeMB * 1024 * 1024;
      if (selectedFile.size > maxSizeInBytes) {
        toast({
          variant: 'destructive',
          title: 'File too large',
          description: `The document must be smaller than ${maxSizeMB}MB.`,
        });
        if (e.target) e.target.value = '';
        return;
      }
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const onSubmit = (data: DocFormValues) => {
    if (!file) {
      toast({ variant: 'destructive', title: 'File required', description: 'Please select a file to upload.' });
      return;
    }

    const newDoc: Omit<SafetyDoc, 'doc_id' | 'display_id'> = {
      title: data.title,
      category: data.category,
      // In a real app, you'd upload the file and get a URL.
      // For this prototype, we'll use a placeholder.
      file_url: `/docs/placeholder-doc.pdf`,
      related_modules: data.related_modules ? data.related_modules.split(',').map(m => m.trim()) : [],
    };
    addSafetyDoc(newDoc);
    toast({ title: 'Document Uploaded', description: `"${data.title}" (${file.name}) has been added.` });
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>Upload a New Document</DialogTitle>
          <DialogDescription>
            Add a new document to the central repository. Fill in the details and select a file.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Document Title</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Lockout/Tagout Procedure" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                    <SelectContent>
                        <SelectItem value="Policy">Policy</SelectItem>
                        <SelectItem value="Procedure">Procedure</SelectItem>
                        <SelectItem value="Form">Form</SelectItem>
                        <SelectItem value="Training Material">Training Material</SelectItem>
                    </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="related_modules"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Related Modules (optional, comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Incidents, Audits" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
             <FormLabel>File</FormLabel>
             <FormControl>
                <Input type="file" onChange={handleFileChange} />
             </FormControl>
             {fileName && <FormDescription>Selected: {fileName}</FormDescription>}
             <FormMessage />
          </FormItem>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Upload Document</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

export default function DocumentsPage() {
  const { safetyDocs } = useAppData();
  const [isUploadOpen, setUploadOpen] = useState(false);

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Document Hub</h2>
          <Dialog open={isUploadOpen} onOpenChange={setUploadOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Upload className="mr-2 h-4 w-4" /> Upload Document
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DocumentUploadForm setOpen={setUploadOpen} />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
            A central repository for safety policies, procedures, forms, and training materials.
        </p>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {safetyDocs.map((doc) => (
                <Card key={doc.doc_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                        <CardTitle className="text-base font-medium">{doc.title}</CardTitle>
                         <div className="flex flex-col items-end gap-2">
                            {categoryIcons[doc.category]}
                            <Badge variant="outline">{doc.display_id}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-xs text-muted-foreground">{doc.category}</p>
                        <Button variant="link" asChild className="p-0 mt-4 h-auto">
                            <Link href={doc.file_url} target="_blank">View Document</Link>
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
