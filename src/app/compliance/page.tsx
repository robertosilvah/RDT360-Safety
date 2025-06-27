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
import { mockComplianceRecords } from '@/lib/mockData';
import { UserPlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { isPast, formatDistanceToNowStrict } from 'date-fns';

export default function CompliancePage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Employee Compliance</h2>
          <Button>
            <UserPlus className="mr-2 h-4 w-4" /> Add Employee Record
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Training & Certification Status</CardTitle>
            <CardDescription>Track employee compliance with safety training and certifications.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Last Training Completed</TableHead>
                  <TableHead>Certification Renewal</TableHead>
                  <TableHead>Next Review</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockComplianceRecords.map((record) => {
                  const lastTraining = record.training_completed.slice(-1)[0];
                  const isRenewalDue = record.cert_renewals_due !== 'N/A' && isPast(new Date(record.cert_renewals_due));
                  return (
                    <TableRow key={record.employee_id}>
                      <TableCell className="font-medium">{record.name}</TableCell>
                      <TableCell>{lastTraining ? `${lastTraining.course} on ${new Date(lastTraining.date).toLocaleDateString()}` : 'N/A'}</TableCell>
                      <TableCell>
                        {record.cert_renewals_due === 'N/A' ? (
                          <Badge variant="outline">N/A</Badge>
                        ) : (
                          <Badge variant={isRenewalDue ? 'destructive' : 'default'}>
                            {new Date(record.cert_renewals_due).toLocaleDateString()}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNowStrict(new Date(record.next_review_date), { addSuffix: true })}
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
