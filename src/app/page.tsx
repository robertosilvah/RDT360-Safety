
'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
import { ArrowUpRight, Clock, ShieldAlert, Siren, Calendar as CalendarIcon, FileSearch, Timer, Hourglass } from 'lucide-react';
import Link from 'next/link';
import { differenceInDays, format, isWithinInterval, isAfter } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import type { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { SubmissionsByTypeChart } from '@/components/dashboard/SubmissionsByTypeChart';

export default function DashboardPage() {
  const { incidents, correctiveActions, observations, investigations, workHours } = useAppData();
  const [date, setDate] = useState<DateRange | undefined>();
  const [submissionsTypeDate, setSubmissionsTypeDate] = useState<DateRange | undefined>();

  const [daysSinceLastAccident, setDaysSinceLastAccident] = useState<{value: React.ReactNode, description: React.ReactNode}>({
    value: <Skeleton className="h-8 w-16" />,
    description: <Skeleton className="h-4 w-32" />,
  });

  useEffect(() => {
    if (incidents.length > 0) {
      // For last accident
      const accidents = incidents.filter(i => i.type === 'Accident');
      if (accidents.length === 0) {
        setDaysSinceLastAccident({ value: 'N/A', description: 'No accidents recorded yet.' });
      } else {
        const lastAccidentDate = accidents.reduce((max, incident) => new Date(incident.date) > new Date(max.date) ? incident : max).date;
        const days = differenceInDays(new Date(), new Date(lastAccidentDate));
        setDaysSinceLastAccident({ value: days.toString(), description: 'All areas included' });
      }
    } else {
        setDaysSinceLastAccident({ value: '0', description: 'No accidents recorded yet.' });
    }
  }, [incidents]);

  const { avgTimeBetweenIncidents, daysSinceLastIncident } = useMemo(() => {
    if (incidents.length < 2) {
      const days = incidents.length === 1 ? differenceInDays(new Date(), new Date(incidents[0].date)) : 0;
      const description = incidents.length === 1 ? 'Since the only incident' : 'No incidents recorded yet.';
      return { 
          avgTimeBetweenIncidents: { value: 'N/A', description: 'Need >1 incident to calculate' },
          daysSinceLastIncident: { value: days.toString(), description }
      };
    }
    
    const sortedIncidents = [...incidents].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let totalDifference = 0;
    for (let i = 1; i < sortedIncidents.length; i++) {
        const diff = differenceInDays(new Date(sortedIncidents[i].date), new Date(sortedIncidents[i-1].date));
        totalDifference += diff;
    }
    
    const averageDays = (totalDifference / (sortedIncidents.length - 1)).toFixed(1);
    const lastIncidentDays = differenceInDays(new Date(), new Date(sortedIncidents[sortedIncidents.length - 1].date));

    return {
        avgTimeBetweenIncidents: { value: averageDays, description: `Based on ${incidents.length} incidents`},
        daysSinceLastIncident: { value: lastIncidentDays.toString(), description: 'All areas included' }
    };
  }, [incidents]);

   const hoursSinceLastAccident = useMemo(() => {
    const accidents = incidents.filter(i => i.type === 'Accident');
    if (accidents.length === 0) {
        return { value: 'N/A', description: 'No accidents recorded yet' };
    }
    const lastAccidentDate = new Date(accidents.reduce((max, incident) => new Date(incident.date) > new Date(max.date) ? incident : max).date);
    
    // We only sum hours from logs where the *end date* is after the last accident.
    const relevantHours = workHours
        .filter(wh => isAfter(new Date(wh.end_date), lastAccidentDate))
        .reduce((sum, wh) => sum + wh.hours_worked, 0);

    return { value: relevantHours.toLocaleString(), description: `Since ${format(lastAccidentDate, 'P')}`};
  }, [incidents, workHours]);


  const pendingActions = useMemo(() => {
    return correctiveActions.filter(
      (action) => action.status !== 'Completed'
    ).length;
  }, [correctiveActions]);
  
  const pendingInvestigations = useMemo(() => {
    return investigations.filter(
      (investigation) => investigation.status !== 'Closed'
    ).length;
  }, [investigations]);

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

  const submissionsByPersonData = useMemo(() => {
    const contributions: { submitter: string; date: string }[] = [];

    observations.forEach(obs => {
        contributions.push({ submitter: obs.submitted_by, date: obs.date });
    });

    incidents.forEach(inc => {
        contributions.push({ submitter: inc.reported_by, date: inc.date });
    });

    const filteredContributions = contributions.filter(item => {
        if (!date?.from) return true;
        const toDate = date.to ?? new Date();
        try {
            return isWithinInterval(new Date(item.date), { start: date.from, end: toDate });
        } catch (e) {
            console.error(`Invalid date found: ${item.date}`);
            return false;
        }
    });

    const contributionsByPerson = filteredContributions.reduce((acc: Record<string, number>, item) => {
        acc[item.submitter] = (acc[item.submitter] || 0) + 1;
        return acc;
    }, {});

    return Object.entries(contributionsByPerson)
        .map(([person, count]) => ({ person, count }))
        .sort((a, b) => b.count - a.count);
  }, [observations, incidents, date]);


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
  
  const observationsByMonthData = useMemo(() => {
    const monthlyCounts: { [key: string]: number } = {
      Jan: 0, Feb: 0, Mar: 0, Apr: 0, May: 0, Jun: 0,
      Jul: 0, Aug: 0, Sep: 0, Oct: 0, Nov: 0, Dec: 0,
    };

    observations.forEach(obs => {
        try {
            const month = format(new Date(obs.date), 'MMM');
            if (monthlyCounts.hasOwnProperty(month)) {
                monthlyCounts[month]++;
            }
        } catch (e) {
            console.error(`Invalid date for observation ${obs.observation_id}: ${obs.date}`);
        }
    });

    return Object.entries(monthlyCounts).map(([name, total]) => ({
        name,
        total,
    }));
  }, [observations]);

  const observationStatusData = useMemo(() => {
    const openCount = observations.filter(obs => obs.status === 'Open').length;
    const closedCount = observations.filter(obs => obs.status === 'Closed').length;

    return [
        { name: 'Open' as const, value: openCount, fill: 'var(--color-open)' },
        { name: 'Closed' as const, value: closedCount, fill: 'var(--color-closed)' },
    ];
  }, [observations]);

  const submissionsByTypeData = useMemo(() => {
    const typeCounts: Record<string, number> = {
      'Incident': 0,
      'Accident': 0,
      'Safety Concern': 0,
      'Positive Observation': 0,
      'Near Miss': 0,
    };

    const filterByDate = (itemDate: string) => {
      if (!submissionsTypeDate?.from) return true;
      const toDate = submissionsTypeDate.to ?? new Date();
      try {
        return isWithinInterval(new Date(itemDate), { start: submissionsTypeDate.from, end: toDate });
      } catch (e) {
        return false;
      }
    };
    
    incidents.filter(inc => filterByDate(inc.date)).forEach(inc => {
      if (typeCounts[inc.type] !== undefined) {
        typeCounts[inc.type]++;
      }
    });

    observations.filter(obs => filterByDate(obs.date)).forEach(obs => {
      if (typeCounts[obs.report_type] !== undefined) {
        typeCounts[obs.report_type]++;
      }
    });

    return Object.entries(typeCounts)
      .map(([name, count]) => ({ name, count }))
      .filter(item => item.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [incidents, observations, submissionsTypeDate]);


  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          <KpiCard
            title="Days Since Last Accident"
            value={daysSinceLastAccident.value}
            icon={<Siren className="h-4 w-4 text-muted-foreground" />}
            description={daysSinceLastAccident.description}
          />
           <KpiCard
            title="Hours Since Last Accident"
            value={hoursSinceLastAccident.value}
            icon={<Hourglass className="h-4 w-4 text-muted-foreground" />}
            description={hoursSinceLastAccident.description}
          />
          <KpiCard
            title="Days Since Last Incident"
            value={daysSinceLastIncident.value}
            icon={<ShieldAlert className="h-4 w-4 text-muted-foreground" />}
            description={daysSinceLastIncident.description}
          />
          <KpiCard
            title="Avg. Time Between Incidents"
            value={`${avgTimeBetweenIncidents.value} Days`}
            icon={<Timer className="h-4 w-4 text-muted-foreground" />}
            description={avgTimeBetweenIncidents.description}
          />
          <KpiCard
            title="Pending Actions"
            value={pendingActions.toString()}
            icon={<Clock className="h-4 w-4 text-muted-foreground" />}
            description="Corrective actions open"
          />
          <KpiCard
            title="Pending Investigations"
            value={pendingInvestigations.toString()}
            icon={<FileSearch className="h-4 w-4 text-muted-foreground" />}
            description="Investigations currently open"
          />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Monthly Safety Observations</CardTitle>
            </CardHeader>
            <CardContent className="pl-2">
              <ObservationsChart data={observationsByMonthData} />
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
              <StatusPieChart data={observationStatusData} />
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
           <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                  <div>
                      <CardTitle>Submissions by Type</CardTitle>
                      <CardDescription>
                      Total safety reports by category.
                      </CardDescription>
                  </div>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                              id="submissionsTypeDate"
                              variant={"outline"}
                              className={cn(
                              "w-[260px] justify-start text-left font-normal",
                              !submissionsTypeDate && "text-muted-foreground"
                              )}
                          >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {submissionsTypeDate?.from ? (
                              submissionsTypeDate.to ? (
                                  <>
                                  {format(submissionsTypeDate.from, "LLL dd, y")} -{" "}
                                  {format(submissionsTypeDate.to, "LLL dd, y")}
                                  </>
                              ) : (
                                  format(submissionsTypeDate.from, "LLL dd, y")
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
                          defaultMonth={submissionsTypeDate?.from}
                          selected={submissionsTypeDate}
                          onSelect={setSubmissionsTypeDate}
                          numberOfMonths={2}
                      />
                      </PopoverContent>
                  </Popover>
              </CardHeader>
              <CardContent>
                  <SubmissionsByTypeChart data={submissionsByTypeData} />
              </CardContent>
          </Card>
          <SafetyQuoteCard />
        </div>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle>Submissions</CardTitle>
                <CardDescription>
                  Total safety reports submitted by each person.
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
                    <TableHead className="text-right">Submissions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissionsByPersonData.map((item) => (
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
        <div className="grid gap-4 grid-cols-1">
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
                        {format(new Date(incident.date), 'P')}
                      </TableCell>
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
