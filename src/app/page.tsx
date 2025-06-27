'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { SafetyQuoteCard } from '@/components/dashboard/SafetyQuoteCard';
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
import { useAppData } from '@/context/AppDataContext';
import type { Incident } from '@/types';
import { ArrowUpRight, Ban, Clock, ShieldCheck, Siren, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, format, isWithinInterval } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

export default function DashboardPage() {
  const { incidents, correctiveActions, observations } = useAppData();
  const [date, setDate] = useState<DateRange | undefined>();

  const daysSinceLastIncident = useMemo(() => {
    if (incidents.length === 0) {
      return 365; // Default if no incidents
    }
    const lastIncidentDate = incidents.reduce((max, incident) =>
      new Date(incident.date) > new Date(max.date) ? incident : max
    ).date;
    return differenceInDays(new Date(), new Date(lastIncidentDate));
  }, [incidents]);

  const pendingActions = useMemo(() => {
    return correctiveActions.filter(
      (action) => action.status !== 'Completed'
    ).length;
  }, [correctiveActions]);

  const nearMissesCount = useMemo(() => {
    return observations.filter(obs => obs.report_type === 'Near Miss').length;
  }, [observations]);

  const recentIncidents = useMemo(() => {
    return [...incidents]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [incidents]);

  const severityClasses: { [key: string]: string } = {
    High: 'text-red-500',
    Medium: 'text-yellow-500',
    Low: 'text-green-500',
  };

  const observationsByPersonData = useMemo(() => {
    const filteredObservations = observations.filter(obs => {
      if (!date?.from) return true;
      const toDate = date.to ?? date.from;
      return isWithinInterval(new Date(obs.date), { start: date.from, end: toDate });
    });
    
    const observationsByPerson = filteredObservations.reduce(
      (acc: Record<string, number>, obs) => {
        acc[obs.submitted_by] = (acc[obs.submitted_by] || 0) + 1;
        return acc;
      },
      {}
    );

    return Object.entries(observationsByPerson)
      .map(([person, count]) => ({ person, count }))
      .sort((a, b) => b.count - a.count);
  }, [observations, date]);

  const pendingActionsByPersonData = useMemo(() => {
    const pendingActionsByPerson = correctiveActions
      .filter((action) => action.status !== 'Completed')
      .reduce((acc: Record<string, number>, action) => {
        acc[action.responsible_person] =
          (acc[action.responsible_person] || 0) + 1;
        return acc;
      }, {});

    return Object.entries(pendingActionsByPerson)
      .map(([person, count]) => ({ person, count }))
      .sort((a, b) => b.count - a.count);
  }, [correctiveActions]);

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Days Since Last Accident"
            value={daysSinceLastIncident.toString()}
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
            value={nearMissesCount.toString()}
            icon={<Ban className="h-4 w-4 text-muted-foreground" />}
            description="Total reports classified as 'Near Miss'"
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
          <SafetyQuoteCard />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Observations by Person</CardTitle>
                <CardDescription>
                  Top contributors for safety observations.
                </CardDescription>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id="date"
                    variant={"outline"}
                    className={cn(
                      "w-[260px] justify-start text-left font-normal",
                      !date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date?.from ? (
                      date.to ? (
                        <>
                          {format(date.from, "LLL dd, y")} -{" "}
                          {format(date.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(date.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={date?.from}
                    selected={date}
                    onSelect={setDate}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">Observations</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {observationsByPersonData.map((item) => (
                    <TableRow key={item.person}>
                      <TableCell className="font-medium">
                        {item.person}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Pending Actions by Person</CardTitle>
              <CardDescription>
                Users with the most outstanding corrective actions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Person</TableHead>
                    <TableHead className="text-right">
                      Pending Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingActionsByPersonData.map((item) => (
                    <TableRow key={item.person}>
                      <TableCell className="font-medium">
                        {item.person}
                      </TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
