
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getBackendMode, setBackendMode } from '@/lib/backend-config';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Server } from 'lucide-react';

export default function DatabaseSettingsPage() {
  const [backend, setBackend] = useState('firebase');
  const { toast } = useToast();

  useEffect(() => {
    // Ensure we only access localStorage on the client side
    setBackend(getBackendMode());
  }, []);

  const handleChange = (newMode: 'firebase' | 'mariadb') => {
    setBackend(newMode);
    setBackendMode(newMode);
    toast({
      title: 'Backend Changed',
      description: `Switched to ${newMode}. The page will now reload to apply the changes.`,
    });
    // Use a timeout to ensure the toast is visible before reload
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database Configuration</CardTitle>
        <CardDescription>
          Select the backend data source for the application. This requires a page reload.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-4">
            <label htmlFor="backend-select" className="font-medium">
                Backend Data Source
            </label>
            <Select value={backend} onValueChange={handleChange}>
                <SelectTrigger id="backend-select" className="w-[250px]">
                    <SelectValue placeholder="Select a backend" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="firebase">Firebase (Cloud)</SelectItem>
                    <SelectItem value="mariadb">MariaDB (Local API Mock)</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <Alert>
          <Server className="h-4 w-4" />
          <AlertTitle>How this works</AlertTitle>
          <AlertDescription>
            The application uses an abstraction layer that allows you to switch data sources. Changing this setting will make the app use a different set of functions for all data operations (e.g., fetching incidents, adding users). The MariaDB option is currently a mock for demonstration purposes.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
