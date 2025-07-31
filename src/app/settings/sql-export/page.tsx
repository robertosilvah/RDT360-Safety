
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import { exportDatabaseToSqlAction } from '@/app/actions';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database } from 'lucide-react';

export default function SqlExportPage() {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleExport = async () => {
    setIsLoading(true);
    toast({
      title: 'Starting Export...',
      description: 'The database export process has begun. This may take a moment.',
    });
    try {
      const sqlData = await exportDatabaseToSqlAction();
      
      const blob = new Blob([sqlData], { type: 'application/sql' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      link.download = `rdt360-safety-export-${timestamp}.sql`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: 'Export Successful',
        description: 'Your database has been exported to a .sql file.',
      });

    } catch (error) {
      console.error('Export failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred.';
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: `There was an error during the export process. ${errorMessage}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Database SQL Export</CardTitle>
        <CardDescription>
          Generate a full SQL backup of your Firestore database.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert>
            <Database className="h-4 w-4" />
            <AlertTitle>How It Works</AlertTitle>
            <AlertDescription>
                This tool reads all collections from your Firestore NoSQL database and converts them into SQL `CREATE TABLE` and `INSERT` statements. Complex data types like arrays and objects will be stored as JSON strings.
            </AlertDescription>
        </Alert>
         <p className="text-sm text-muted-foreground">
          Click the button below to generate and download a `.sql` file containing all application data. This can be useful for backups, migrations, or analysis in a relational database system.
        </p>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleExport} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isLoading ? 'Exporting...' : 'Export All Data to SQL'}
        </Button>
      </CardFooter>
    </Card>
  );
}
