
'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Calendar as CalendarIcon, Download } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { CorrectiveAction, Incident, Observation } from '@/types';
import { useToast } from '@/hooks/use-toast';

const KpiCard = ({ title, value, description }: { title: string; value: string | number; description?: string }) => (
    <div className="flex flex-col items-center justify-center p-4 text-center">
        <p className="text-3xl font-bold">{value}</p>
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
    </div>
);

const CreatedVsCompletedChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
            />
            <Legend iconType="circle" iconSize={8} />
            <Line type="monotone" dataKey="created" stroke="hsl(var(--primary))" strokeWidth={2} name="Created" dot={{ r: 4, fill: 'hsl(var(--primary))' }} />
            <Line type="monotone" dataKey="completed" stroke="hsl(var(--chart-2))" strokeWidth={2} name="Completed" dot={{ r: 4, fill: 'hsl(var(--chart-2))' }} />
        </LineChart>
    </ResponsiveContainer>
);

const ActionsByTypeChart = ({ data }: { data: any[] }) => (
    <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
             <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
                cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                }}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
        </BarChart>
    </ResponsiveContainer>
);

const StatusDonutChart = ({ data }: { data: any[] }) => {
    const COLORS = {
        Pending: 'hsl(var(--chart-1))',
        'In Progress': 'hsl(var(--chart-2))',
        Completed: 'hsl(var(--chart-3))',
        Overdue: 'hsl(var(--destructive))',
    };
    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={5}>
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

const SeverityDonutChart = ({ data }: { data: any[] }) => {
    const COLORS = {
        Low: 'hsl(var(--chart-2))',
        Medium: 'hsl(var(--chart-4))',
        High: 'hsl(var(--destructive))',
    };
    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={5}>
                    {data.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

const ObservationTypeDonutChart = ({ data }: { data: any[] }) => {
    const COLORS = {
        'Safety Concern': 'hsl(var(--chart-1))',
        'Positive Observation': 'hsl(var(--chart-2))',
        'Near Miss': 'hsl(var(--chart-3))',
    };
    return (
        <ResponsiveContainer width="100%" height={250}>
            <PieChart>
                <Tooltip
                    contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                    }}
                />
                <Legend iconType="circle" iconSize={8} />
                <Pie data={data} innerRadius={60} outerRadius={80} dataKey="value" nameKey="name" paddingAngle={5}>
                    {data.map((entry) => (
                        <Cell key={`cell-${entry.name}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
                    ))}
                </Pie>
            </PieChart>
        </ResponsiveContainer>
    );
};

const WorkOrdersView = ({ actions, dateRange }: { actions: CorrectiveAction[]; dateRange?: DateRange }) => {

    const inRange = (date: string) => {
        if (!dateRange?.from) return true;
        const toDate = dateRange.to ?? dateRange.from;
        try { return isWithinInterval(new Date(date), { start: dateRange.from, end: toDate }); } catch (e) { return false; }
    }

    const createdInPeriod = useMemo(() => actions.filter(a => a.created_date && inRange(a.created_date)), [actions, dateRange]);
    const completedInPeriod = useMemo(() => actions.filter(a => a.completion_date && inRange(a.completion_date)), [actions, dateRange]);

    const kpiData = useMemo(() => {
        const created = createdInPeriod.length;
        const completed = completedInPeriod.length;
        const percentCompleted = created > 0 ? ((completed / created) * 100).toFixed(1) : '0.0';
        return { created, completed, percentCompleted };
    }, [createdInPeriod, completedInPeriod]);

    const chartData = useMemo(() => {
        const months: { [key: string]: { created: number; completed: number } } = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        createdInPeriod.forEach(action => {
            const createdMonth = format(new Date(action.created_date), 'MMM');
            if (!months[createdMonth]) months[createdMonth] = { created: 0, completed: 0 };
            months[createdMonth].created++;
        });

        completedInPeriod.forEach(action => {
            const completedMonth = format(new Date(action.completion_date!), 'MMM');
            if (!months[completedMonth]) months[completedMonth] = { created: 0, completed: 0 };
            months[completedMonth].completed++;
        });

        return monthNames.map(name => ({
            name,
            created: months[name]?.created || 0,
            completed: months[name]?.completed || 0,
        }));
    }, [createdInPeriod, completedInPeriod]);

    const byTypeData = useMemo(() => {
        const counts = createdInPeriod.reduce((acc, action) => {
            const type = action.type || 'Other';
            acc[type] = (acc[type] || 0) + 1;
            return acc;
        }, {} as Record<CorrectiveAction['type'], number>);
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [createdInPeriod]);
    
    const byStatusData = useMemo(() => {
        const counts = createdInPeriod.reduce((acc, action) => {
            acc[action.status] = (acc[action.status] || 0) + 1;
            return acc;
        }, {} as Record<CorrectiveAction['status'], number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [createdInPeriod]);

    return (
        <div className="space-y-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Created vs. Completed</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    <KpiCard title="Created" value={kpiData.created} />
                    <KpiCard title="Completed" value={kpiData.completed} />
                    <KpiCard title="Percent Completed" value={`${kpiData.percentCompleted}%`} description="Actions completed in this time period."/>
                </CardContent>
                <div className="px-6 pb-4">
                    <CreatedVsCompletedChart data={chartData} />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Corrective Actions by Type</CardTitle></CardHeader>
                    <CardContent>
                       <ActionsByTypeChart data={byTypeData} />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Status</CardTitle></CardHeader>
                    <CardContent>
                       <StatusDonutChart data={byStatusData} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

const IncidentsView = ({ incidents, dateRange }: { incidents: Incident[], dateRange?: DateRange }) => {

    const filteredIncidents = useMemo(() => {
        if (!dateRange?.from) return incidents;
        const toDate = dateRange.to ?? dateRange.from;
        const range = { start: dateRange.from, end: toDate };
        return incidents.filter(incident => incident.date && isWithinInterval(new Date(incident.date), range));
    }, [incidents, dateRange]);

    const kpiData = useMemo(() => {
        const total = filteredIncidents.length;
        const accidents = filteredIncidents.filter(i => i.type === 'Accident').length;
        const highSeverity = filteredIncidents.filter(i => i.severity === 'High').length;
        return { total, accidents, highSeverity };
    }, [filteredIncidents]);

    const bySeverityData = useMemo(() => {
        const counts = filteredIncidents.reduce((acc, incident) => {
            acc[incident.severity] = (acc[incident.severity] || 0) + 1;
            return acc;
        }, {} as Record<Incident['severity'], number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredIncidents]);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Incident KPIs</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    <KpiCard title="Total Incidents" value={kpiData.total} />
                    <KpiCard title="Accidents" value={kpiData.accidents} />
                    <KpiCard title="High Severity" value={kpiData.highSeverity} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Incidents by Severity</CardTitle></CardHeader>
                <CardContent>
                   <SeverityDonutChart data={bySeverityData} />
                </CardContent>
            </Card>
        </div>
    );
};

const ObservationsView = ({ observations, dateRange }: { observations: Observation[], dateRange?: DateRange }) => {

    const filteredObservations = useMemo(() => {
        if (!dateRange?.from) return observations;
        const toDate = dateRange.to ?? dateRange.from;
        const range = { start: dateRange.from, end: toDate };
        return observations.filter(obs => obs.date && isWithinInterval(new Date(obs.date), range));
    }, [observations, dateRange]);

    const kpiData = useMemo(() => {
        const total = filteredObservations.length;
        const positive = filteredObservations.filter(o => o.report_type === 'Positive Observation').length;
        const nearMiss = filteredObservations.filter(o => o.report_type === 'Near Miss').length;
        return { total, positive, nearMiss };
    }, [filteredObservations]);

    const byTypeData = useMemo(() => {
        const counts = filteredObservations.reduce((acc, obs) => {
            acc[obs.report_type] = (acc[obs.report_type] || 0) + 1;
            return acc;
        }, {} as Record<Observation['report_type'], number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredObservations]);
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle>Observation KPIs</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    <KpiCard title="Total Observations" value={kpiData.total} />
                    <KpiCard title="Positive Observations" value={kpiData.positive} />
                    <KpiCard title="Near Misses" value={kpiData.nearMiss} />
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle>Observations by Type</CardTitle></CardHeader>
                <CardContent>
                   <ObservationTypeDonutChart data={byTypeData} />
                </CardContent>
            </Card>
        </div>
    );
};

export default function ReportingPage() {
    const { correctiveActions, incidents, observations } = useAppData();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('work-orders');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    const handleExport = () => {
        let data: any[] = [];
        let headers: string[] = [];
        let filename = 'report.csv';

        const inRange = (date: string) => {
            if (!dateRange?.from) return true;
            const toDate = dateRange.to ?? dateRange.from;
            try { return isWithinInterval(new Date(date), { start: dateRange.from, end: toDate }); } catch (e) { return false; }
        }

        const escapeCsvCell = (cell: any): string => {
            const value = String(cell ?? '');
            if (value.includes(',') || value.includes('"') || value.includes('\n')) {
                return `"${value.replace(/"/g, '""')}"`;
            }
            return value;
        };

        switch (activeTab) {
            case 'work-orders':
                data = correctiveActions.filter(a => a.created_date && inRange(a.created_date));
                headers = ['display_id', 'description', 'status', 'responsible_person', 'due_date', 'created_date', 'completion_date', 'type'];
                filename = 'corrective_actions_export.csv';
                break;
            case 'incidents':
                data = incidents.filter(i => i.date && inRange(i.date));
                headers = ['display_id', 'date', 'area', 'type', 'description', 'severity', 'status'];
                filename = 'incidents_export.csv';
                break;
            case 'observations':
                data = observations.filter(o => o.date && inRange(o.date));
                headers = ['display_id', 'report_type', 'submitted_by', 'date', 'risk_level', 'description', 'status'];
                filename = 'observations_export.csv';
                break;
            default:
                toast({ title: 'Error', description: 'No data to export for this view.', variant: 'destructive' });
                return;
        }

        if (data.length === 0) {
            toast({ title: 'No Data', description: 'There is no data to export for the selected filters.' });
            return;
        }

        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => escapeCsvCell(row[header as keyof typeof row])).join(',')
            )
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        toast({ title: 'Export Successful', description: `Downloaded ${filename}` });
    };

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">Reporting</h2>
                    <div className="flex items-center space-x-2">
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button id="date" variant={"outline"} className={cn("w-[260px] justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                            </PopoverContent>
                        </Popover>
                         <Button variant="outline" onClick={handleExport}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                         </Button>
                    </div>
                </div>

                <Tabs defaultValue="work-orders" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="work-orders">Corrective Actions</TabsTrigger>
                        <TabsTrigger value="incidents">Incidents</TabsTrigger>
                        <TabsTrigger value="observations">Observations</TabsTrigger>
                    </TabsList>
                    <TabsContent value="work-orders" className="pt-4">
                        <WorkOrdersView actions={correctiveActions} dateRange={dateRange} />
                    </TabsContent>
                    <TabsContent value="incidents" className="pt-4">
                        <IncidentsView incidents={incidents} dateRange={dateRange} />
                    </TabsContent>
                     <TabsContent value="observations" className="pt-4">
                        <ObservationsView observations={observations} dateRange={dateRange} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    );
}
