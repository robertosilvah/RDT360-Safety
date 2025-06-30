'use client';

import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const uploadSettingsSchema = z.object({
  imageMaxSizeMB: z.coerce.number().min(1, 'Must be at least 1').max(100, 'Cannot exceed 100'),
  docMaxSizeMB: z.coerce.number().min(1, 'Must be at least 1').max(200, 'Cannot exceed 200'),
});

type UploadSettingsFormValues = z.infer<typeof uploadSettingsSchema>;

export default function UploadSettingsPage() {
  const { uploadSettings, updateUploadSettings } = useAppData();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<UploadSettingsFormValues>({
    resolver: zodResolver(uploadSettingsSchema),
    defaultValues: {
      imageMaxSizeMB: 5,
      docMaxSizeMB: 10,
    },
  });

  useEffect(() => {
    if (uploadSettings) {
      form.reset(uploadSettings);
    }
  }, [uploadSettings, form]);

  const handleSave = async (data: UploadSettingsFormValues) => {
    setIsLoading(true);
    try {
      await updateUploadSettings(data);
      toast({
        title: 'Settings Saved',
        description: 'Your file upload limits have been updated.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: 'There was an error saving your settings. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSave)}>
        <Card>
          <CardHeader>
            <CardTitle>File Upload Settings</CardTitle>
            <CardDescription>
              Set maximum file size limits for images and documents uploaded across the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="imageMaxSizeMB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Image Size (MB)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="docMaxSizeMB"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Document Size (MB)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Settings
            </Button>
          </CardFooter>
        </Card>
      </form>
    </Form>
  );
}
