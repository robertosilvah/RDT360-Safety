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
import { mockAudits } from '@/lib/mockData';
import type { Audit } from '@/types';
import { FileUp, CheckCircle2, PlayCircle, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function AuditsPage() {
    
  const statusInfo: { [key in Audit['status']]: { variant: 'default' | 'secondary' | 'outline', icon: React.ElementType } } = {
    'Completed': { variant: 'default', icon: CheckCircle2 },
    'In Progress': { variant: 'secondary', icon: PlayCircle },
    'Scheduled': { variant: 'outline', icon: Clock },
  };

  const calculateProgress = (audit: Audit) => {
    if (audit.status === 'Completed') return 100;
    if (audit.status === 'Scheduled') return 0;
    const totalItems = audit.checklist_items.length;
    if (totalItems === 0) return 50; // In progress but no items yet
    const checkedItems = audit.checklist_items.filter(item => item.checked).length;
    return (checkedItems / totalItems) * 100;
  }

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Audit Tracker</h2>
          <Button>
            <FileUp className="mr-2 h-4 w-4" /> Upload Report
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Scheduled & Completed Audits</CardTitle>
            <CardDescription>Track and manage all safety audits.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Auditor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockAudits.map((audit) => {
                  const Icon = statusInfo[audit.status].icon;
                  return (
                    <TableRow key={audit.audit_id}>
                      <TableCell className="font-medium">{audit.audit_id}</TableCell>
                      <TableCell>{new Date(audit.date).toLocaleDateString()}</TableCell>
                      <TableCell>{audit.auditor}</TableCell>
                      <TableCell>
                        <Badge variant={statusInfo[audit.status].variant}>
                            <Icon className="mr-2 h-4 w-4"/>
                            {audit.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Progress value={calculateProgress(audit)} className="w-[60%]" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
