import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { KpiSummary } from '@/components/dashboard/KpiSummary';
import { ObservationsChart } from '@/components/dashboard/ObservationsChart';
import { StatusPieChart } from '@/components/dashboard/StatusPieChart';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { mockIncidents, mockCorrectiveActions } from '@/lib/mockData';
import type { Incident } from '@/types';
import { ArrowUpRight, Ban, Clock, ShieldCheck, Siren } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays } from 'date-fns';

export default function DashboardPage() {
  const daysSinceLastIncident = () => {
    if (mockIncidents.length === 0) {
      return 365; // Default if no incidents
    }
    const lastIncidentDate = mockIncidents.reduce((max, incident) =>
      new Date(incident.date) > new Date(max.date) ? incident : max
    ).date;
    return differenceInDays(new Date(), new Date(lastIncidentDate));
  };

  const pendingActions = mockCorrectiveActions.filter(
    (action) => action.status !== 'Completed'
  ).length;

  const recentIncidents = [...mockIncidents]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  const severityClasses: { [key: string]: string } = {
    High: 'text-red-500',
    Medium: 'text-yellow-500',
    Low: 'text-green-500',
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Days Since Last Accident"
            value={daysSinceLastIncident().toString()}
            icon={<Siren className="h-4 w-4 text-muted-foreground" />}
            description="All areas included"
          />
          <KpiCard
            title="Pending Actions"
            value={pendingActions.toString()}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            description="Corrective actions open"
          />
          <KpiCard
            title="Compliance Rate"
            value="98.7%"
            icon={<ShieldCheck className="h-4 w-4 text-muted-foreground" />}
            description="+1.2% from last month"
          />
          <KpiCard
            title="Near Misses Reported"
            value="12"
            icon={<Ban className="h-4 w-4 text-muted-foreground" />}
            description="+3 from last month"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Monthly Safety Observations</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ObservationsChart />
            </CardContent>
          </Card>
          <Card className="col-span-4 lg:col-span-3">
            <CardHeader>
              <CardTitle>Observation Status</CardTitle>
              <CardDescription>
                Breakdown of open vs. closed safety observations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <StatusPieChart />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-medium">
                Recent Incidents
              </CardTitle>
              <Button asChild variant="ghost" className="h-8">
                <Link href="/incidents">
                  View All <ArrowUpRight className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead>Area</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentIncidents.map((incident: Incident) => (
                    <TableRow key={incident.incident_id}>
                      <TableCell className="font-medium truncate max-w-xs">
                        {incident.description}
                      </TableCell>
                      <TableCell>{incident.area}</TableCell>
                      <TableCell
                        className={severityClasses[incident.severity]}
                      >
                        {incident.severity}
                      </TableCell>
                      <TableCell>
                        {new Date(incident.date).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <KpiSummary />
        </div>
      </div>
    </AppShell>
  );
}
