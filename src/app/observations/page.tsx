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
import { mockObservations } from '@/lib/mockData';
import type { Observation } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function ObservationsPage() {
    
  const statusVariant: { [key in Observation['status']]: 'outline' | 'default' } = {
    'Open': 'default',
    'Closed': 'outline',
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <h2 className="text-3xl font-bold tracking-tight">Safety Observations</h2>
        
        <div className="grid gap-6 lg:grid-cols-5">
            <div className="lg:col-span-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>Submit an Observation</CardTitle>
                        <CardDescription>Report a safety concern or a positive observation.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="location">Location / Area</Label>
                            <Input id="location" placeholder="e.g., Warehouse Section B" />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="details">Details</Label>
                            <Textarea id="details" placeholder="Describe what you observed..." />
                        </div>
                        <Button className="w-full">Submit Observation</Button>
                    </CardContent>
                 </Card>
            </div>
            <div className="lg:col-span-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Observation History</CardTitle>
                    <CardDescription>A list of all submitted safety observations.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Location</TableHead>
                          <TableHead>Submitted By</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mockObservations.map((obs) => (
                          <TableRow key={obs.observation_id}>
                            <TableCell className="font-medium">{obs.observation_id}</TableCell>
                            <TableCell>{new Date(obs.date).toLocaleDateString()}</TableCell>
                            <TableCell>{obs.location}</TableCell>
                            <TableCell>{obs.submitted_by}</TableCell>
                            <TableCell>
                              <Badge variant={statusVariant[obs.status]}>{obs.status}</Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
            </div>
        </div>

      </div>
    </AppShell>
  );
}
