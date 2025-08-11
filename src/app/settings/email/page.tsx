
'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useAppData } from '@/context/AppDataContext';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save, Trash2, PlusCircle } from 'lucide-react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const emailSettingsSchema = z.object({
  sendOnNewObservation: z.boolean().default(false),
  recipients: z.array(z.object({ email: z.string().email('Invalid email address.') })).min(1, 'At least one recipient is required if notifications are enabled.'),
});

type EmailSettingsFormValues = z.infer<typeof emailSettingsSchema>;

export default function EmailSettingsPage() {
  const { emailSettings, updateEmailSettings } = useAppData();
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const form = useForm<EmailSettingsFormValues>({
    resolver: zodResolver(emailSettingsSchema),
    defaultValues: {
      sendOnNewObservation: false,
      recipients: [{ email: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "recipients"
  });

  useEffect(() => {
    if (emailSettings) {
      form.reset({
        sendOnNewObservation: emailSettings.sendOnNewObservation,
        recipients: emailSettings.recipients.map(r => ({ email: r })),
      });
    }
  }, [emailSettings, form]);

  const handleSave = async (data: EmailSettingsFormValues) => {
    setIsLoading(true);
    try {
      const settingsToSave = {
        sendOnNewObservation: data.sendOnNewObservation,
        recipients: data.recipients.map(r => r.email),
      };
      await updateEmailSettings(settingsToSave);
      toast({
        title: 'Settings Saved',
        description: 'Your email notification settings have been updated.',
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
            <CardTitle>Email Notifications</CardTitle>
            <CardDescription>
              Configure when and to whom email notifications are sent for key events.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <FormField
              control={form.control}
              name="sendOnNewObservation"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">New Observation Notifications</FormLabel>
                    <FormMessage />
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <Separator />

            <div>
              <h3 className="text-lg font-medium">Recipients</h3>
              <p className="text-sm text-muted-foreground">
                Manage the list of emails that will receive notifications.
              </p>
              <div className="space-y-4 mt-4">
                {fields.map((field, index) => (
                   <div key={field.id} className="flex items-center gap-2">
                     <FormField
                        control={form.control}
                        name={`recipients.${index}.email`}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                                <Input type="email" placeholder="name@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                   </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({email: ''})}>
                    <PlusCircle className="mr-2 h-4 w-4"/> Add Recipient
                </Button>
              </div>
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
