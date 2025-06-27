import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockIncidents } from '@/lib/mockData';
import type { Incident } from '@/types';
import { FilePlus2, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function IncidentsPage() {
    
  const severityVariant: { [key in Incident['severity']]: 'destructive' | 'secondary' | 'default' } = {
    'High': 'destructive',
    'Medium': 'secondary',
    'Low': 'default',
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Incident Log</h2>
          <Button>
            <FilePlus2 className="mr-2 h-4 w-4" /> Add New Incident
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>All Incidents</CardTitle>
            <CardDescription>A comprehensive list of all recorded safety incidents.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Area</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockIncidents.map((incident) => (
                  <TableRow key={incident.incident_id}>
                    <TableCell className="font-medium">{incident.incident_id}</TableCell>
                    <TableCell>{new Date(incident.date).toLocaleDateString()}</TableCell>
                    <TableCell>{incident.area}</TableCell>
                    <TableCell className="max-w-md truncate">{incident.description}</TableCell>
                    <TableCell>
                      <Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge>
                    </TableCell>
                    <TableCell>
                        {incident.linked_docs.length > 0 && (
                            <Button variant="outline" size="icon">
                                <Download className="h-4 w-4" />
                                <span className="sr-only">Download Document</span>
                            </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
