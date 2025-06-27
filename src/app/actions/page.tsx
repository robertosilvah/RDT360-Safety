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
import { mockCorrectiveActions } from '@/lib/mockData';
import type { CorrectiveAction } from '@/types';
import { PlusCircle, Siren, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CorrectiveActionsPage() {
    
  const statusVariant: { [key in CorrectiveAction['status']]: 'destructive' | 'secondary' | 'default' | 'outline' } = {
    'Overdue': 'destructive',
    'Pending': 'secondary',
    'In Progress': 'default',
    'Completed': 'outline',
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Corrective Actions</h2>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Create Action
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Track all corrective actions from incidents and observations.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Related To</TableHead>
                  <TableHead>Responsible</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockCorrectiveActions.map((action) => (
                  <TableRow key={action.action_id}>
                    <TableCell className="font-medium">{action.action_id}</TableCell>
                    <TableCell className="max-w-sm truncate">{action.description}</TableCell>
                    <TableCell>
                      {action.related_to_incident && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/incidents">
                                <Siren className="mr-2 h-4 w-4 text-red-500" />
                                {action.related_to_incident}
                            </Link>
                        </Button>
                      )}
                      {action.related_to_observation && (
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/observations">
                                <Eye className="mr-2 h-4 w-4 text-blue-500" />
                                {action.related_to_observation}
                            </Link>
                        </Button>
                      )}
                    </TableCell>
                    <TableCell>{action.responsible_person}</TableCell>
                    <TableCell>{new Date(action.due_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[action.status]}>{action.status}</Badge>
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
