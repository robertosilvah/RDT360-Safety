
'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Calendar as CalendarIcon, Download, FileSignature } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { CorrectiveAction, Incident, Observation, ToolboxTalk } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { riskLabels } from '@/app/observations/page';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import Link from 'next/link';

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
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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
            <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
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

const WorkOrdersView = ({ actions, dateRange, statusFilter, responsibleFilter, typeFilter }: { actions: CorrectiveAction[]; dateRange?: DateRange, statusFilter: string; responsibleFilter: string; typeFilter: string; }) => {

    const inRange = (date: string) => {
        if (!dateRange?.from) return true;
        const toDate = dateRange.to ?? dateRange.from;
        try { return isWithinInterval(new Date(date), { start: dateRange.from, end: toDate }); } catch (e) { return false; }
    }

    const filteredByProps = useMemo(() => {
        return actions.filter(action => {
            const statusMatch = statusFilter === 'all' || action.status === statusFilter;
            const responsibleMatch = responsibleFilter === 'all' || action.responsible_person === responsibleFilter;
            const typeMatch = typeFilter === 'all' || action.type === typeFilter;
            return statusMatch && responsibleMatch && typeMatch;
        });
    }, [actions, statusFilter, responsibleFilter, typeFilter]);

    const createdInPeriod = useMemo(() => filteredByProps.filter(a => a.created_date && inRange(a.created_date)), [filteredByProps, dateRange]);
    const completedInPeriod = useMemo(() => filteredByProps.filter(a => a.completion_date && inRange(a.completion_date)), [filteredByProps, dateRange]);

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

const IncidentsView = ({ incidents, dateRange, typeFilter, severityFilter, statusFilter, areaFilter }: { incidents: Incident[], dateRange?: DateRange, typeFilter: string; severityFilter: string; statusFilter: string; areaFilter: string; }) => {

    const filteredIncidents = useMemo(() => {
        return incidents.filter(incident => {
            if (!dateRange?.from) return false;
            const toDate = dateRange.to ?? dateRange.from;
            const range = { start: dateRange.from, end: toDate };
            if (!incident.date || !isWithinInterval(new Date(incident.date), range)) return false;

            const typeMatch = typeFilter === 'all' || incident.type === typeFilter;
            const severityMatch = severityFilter === 'all' || incident.severity === severityFilter;
            const statusMatch = statusFilter === 'all' || incident.status === statusFilter;
            const areaMatch = areaFilter === 'all' || incident.area === areaFilter;

            return typeMatch && severityMatch && statusMatch && areaMatch;
        });
    }, [incidents, dateRange, typeFilter, severityFilter, statusFilter, areaFilter]);

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

const ObservationsView = ({ observations, dateRange, typeFilter, riskFilter, statusFilter }: { observations: Observation[], dateRange?: DateRange, typeFilter: string; riskFilter: string; statusFilter: string; }) => {

    const filteredObservations = useMemo(() => {
        return observations.filter(obs => {
            if (!dateRange?.from) return false;
            const toDate = dateRange.to ?? dateRange.from;
            const range = { start: dateRange.from, end: toDate };
            if (!obs.date || !isWithinInterval(new Date(obs.date), range)) return false;
            
            const typeMatch = typeFilter === 'all' || obs.report_type === typeFilter;
            const riskMatch = riskFilter === 'all' || obs.risk_level === parseInt(riskFilter);
            const statusMatch = statusFilter === 'all' || obs.status === statusFilter;

            return typeMatch && riskMatch && statusMatch;
        });
    }, [observations, dateRange, typeFilter, riskFilter, statusFilter]);

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

const ToolboxTalksView = ({ talks, dateRange, departmentFilter }: { talks: ToolboxTalk[]; dateRange?: DateRange; departmentFilter: string; }) => {
  const filteredTalks = useMemo(() => {
    return talks.filter(talk => {
      if (!dateRange?.from) return false;
      const toDate = dateRange.to ?? dateRange.from;
      const range = { start: dateRange.from, end: toDate };
      if (!talk.date || !isWithinInterval(new Date(talk.date), range)) return false;
      
      const departmentMatch = departmentFilter === 'all' || talk.department === departmentFilter;
      return departmentMatch;
    });
  }, [talks, dateRange, departmentFilter]);

  return (
    <Card>
        <CardHeader>
            <CardTitle>Toolbox Talks Log</CardTitle>
            <CardDescription>A list of talks held within the selected date range and department.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Title</TableHead>
                        <TableHead>Leader</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>Attendance</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredTalks.length > 0 ? filteredTalks.map(talk => (
                        <TableRow key={talk.id}>
                            <TableCell>{format(new Date(talk.date), 'P')}</TableCell>
                            <TableCell className="font-medium">{talk.title}</TableCell>
                            <TableCell>{talk.leader}</TableCell>
                            <TableCell>{talk.department}</TableCell>
                            <TableCell>{talk.signatures.length}</TableCell>
                            <TableCell>
                                <Button variant="outline" size="sm" asChild>
                                    <Link href={`/toolbox-talks/${talk.id}`}>View Details</Link>
                                </Button>
                            </TableCell>
                        </TableRow>
                    )) : (
                        <TableRow>
                            <TableCell colSpan={6} className="text-center">No toolbox talks found for the selected filters.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
    </Card>
  );
};


export default function ReportingPage() {
    const { correctiveActions, incidents, observations, toolboxTalks } = useAppData();
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState('work-orders');
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

    // Corrective Action Filters
    const [actionStatusFilter, setActionStatusFilter] = useState('all');
    const [actionResponsibleFilter, setActionResponsibleFilter] = useState('all');
    const [actionTypeFilter, setActionTypeFilter] = useState('all');
    
    // Incident Filters
    const [incidentTypeFilter, setIncidentTypeFilter] = useState('all');
    const [incidentSeverityFilter, setIncidentSeverityFilter] = useState('all');
    const [incidentStatusFilter, setIncidentStatusFilter] = useState('all');
    const [incidentAreaFilter, setIncidentAreaFilter] = useState('all');

    // Observation Filters
    const [observationTypeFilter, setObservationTypeFilter] = useState('all');
    const [observationRiskFilter, setObservationRiskFilter] = useState('all');
    const [observationStatusFilter, setObservationStatusFilter] = useState('all');

    // Toolbox Talk Filters
    const [talkDepartmentFilter, setTalkDepartmentFilter] = useState('all');
    
    // Dynamic values for select dropdowns
    const responsiblePersons = useMemo(() => Array.from(new Set(correctiveActions.map(a => a.responsible_person))).sort(), [correctiveActions]);
    const incidentAreas = useMemo(() => Array.from(new Set(incidents.map(i => i.area))).sort(), [incidents]);
    const talkDepartments = useMemo(() => Array.from(new Set(toolboxTalks.map(t => t.department))).sort(), [toolboxTalks]);


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
                data = correctiveActions
                    .filter(a => inRange(a.created_date))
                    .filter(a => actionStatusFilter === 'all' || a.status === actionStatusFilter)
                    .filter(a => actionResponsibleFilter === 'all' || a.responsible_person === actionResponsibleFilter)
                    .filter(a => actionTypeFilter === 'all' || a.type === actionTypeFilter);
                headers = ['display_id', 'description', 'status', 'responsible_person', 'due_date', 'created_date', 'completion_date', 'type'];
                filename = 'corrective_actions_export.csv';
                break;
            case 'incidents':
                data = incidents
                    .filter(i => inRange(i.date))
                    .filter(i => incidentTypeFilter === 'all' || i.type === incidentTypeFilter)
                    .filter(i => incidentSeverityFilter === 'all' || i.severity === incidentSeverityFilter)
                    .filter(i => incidentStatusFilter === 'all' || i.status === incidentStatusFilter)
                    .filter(i => incidentAreaFilter === 'all' || i.area === incidentAreaFilter);
                headers = ['display_id', 'date', 'area', 'type', 'description', 'severity', 'status'];
                filename = 'incidents_export.csv';
                break;
            case 'observations':
                data = observations
                    .filter(o => inRange(o.date))
                    .filter(o => observationTypeFilter === 'all' || o.report_type === observationTypeFilter)
                    .filter(o => observationRiskFilter === 'all' || o.risk_level === parseInt(observationRiskFilter))
                    .filter(o => observationStatusFilter === 'all' || o.status === observationStatusFilter);
                headers = ['display_id', 'report_type', 'submitted_by', 'date', 'risk_level', 'description', 'status'];
                filename = 'observations_export.csv';
                break;
            case 'toolbox-talks':
                data = toolboxTalks
                    .filter(t => inRange(t.date))
                    .filter(t => talkDepartmentFilter === 'all' || t.department === talkDepartmentFilter)
                    .map(t => ({...t, signatures: t.signatures.length})); // a bit of a hack for export
                headers = ['display_id', 'title', 'date', 'leader', 'department', 'signatures'];
                filename = 'toolbox_talks_export.csv';
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

                <div className="flex flex-wrap items-center gap-2 py-4 border-b">
                    <span className="text-sm font-medium">Filters:</span>
                    {activeTab === 'work-orders' && (
                        <>
                            <Select value={actionStatusFilter} onValueChange={setActionStatusFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Pending">Pending</SelectItem><SelectItem value="In Progress">In Progress</SelectItem><SelectItem value="Completed">Completed</SelectItem><SelectItem value="Overdue">Overdue</SelectItem></SelectContent>
                            </Select>
                            <Select value={actionResponsibleFilter} onValueChange={setActionResponsibleFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Responsible" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Responsible</SelectItem>{responsiblePersons.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                            </Select>
                            <Select value={actionTypeFilter} onValueChange={setActionTypeFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Preventive">Preventive</SelectItem><SelectItem value="Reactive">Reactive</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                            </Select>
                        </>
                    )}
                    {activeTab === 'incidents' && (
                        <>
                            <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Incident">Incident</SelectItem><SelectItem value="Accident">Accident</SelectItem></SelectContent>
                            </Select>
                             <Select value={incidentSeverityFilter} onValueChange={setIncidentSeverityFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Severity" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Severities</SelectItem><SelectItem value="Low">Low</SelectItem><SelectItem value="Medium">Medium</SelectItem><SelectItem value="High">High</SelectItem></SelectContent>
                            </Select>
                            <Select value={incidentStatusFilter} onValueChange={setIncidentStatusFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Under Investigation">Under Investigation</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                            </Select>
                            <Select value={incidentAreaFilter} onValueChange={setIncidentAreaFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Area" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Areas</SelectItem>{incidentAreas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                            </Select>
                        </>
                    )}
                     {activeTab === 'observations' && (
                        <>
                            <Select value={observationTypeFilter} onValueChange={setObservationTypeFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Types</SelectItem><SelectItem value="Safety Concern">Safety Concern</SelectItem><SelectItem value="Positive Observation">Positive Observation</SelectItem><SelectItem value="Near Miss">Near Miss</SelectItem></SelectContent>
                            </Select>
                             <Select value={observationRiskFilter} onValueChange={setObservationRiskFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Risk Level" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Risk Levels</SelectItem>{Object.entries(riskLabels).map(([level, label]) => (<SelectItem key={level} value={level}>{label}</SelectItem>))}</SelectContent>
                            </Select>
                            <Select value={observationStatusFilter} onValueChange={setObservationStatusFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Statuses</SelectItem><SelectItem value="Open">Open</SelectItem><SelectItem value="Closed">Closed</SelectItem></SelectContent>
                            </Select>
                        </>
                    )}
                    {activeTab === 'toolbox-talks' && (
                        <>
                            <Select value={talkDepartmentFilter} onValueChange={setTalkDepartmentFilter}>
                                <SelectTrigger className="w-auto sm:w-[180px]"><SelectValue placeholder="Department" /></SelectTrigger>
                                <SelectContent><SelectItem value="all">All Departments</SelectItem>{talkDepartments.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                            </Select>
                        </>
                    )}
                </div>

                <Tabs defaultValue="work-orders" value={activeTab} onValueChange={setActiveTab}>
                    <TabsList>
                        <TabsTrigger value="work-orders">Corrective Actions</TabsTrigger>
                        <TabsTrigger value="incidents">Incidents</TabsTrigger>
                        <TabsTrigger value="observations">Observations</TabsTrigger>
                        <TabsTrigger value="toolbox-talks">Toolbox Talks</TabsTrigger>
                    </TabsList>
                    <TabsContent value="work-orders" className="pt-4">
                        <WorkOrdersView 
                            actions={correctiveActions} 
                            dateRange={dateRange} 
                            statusFilter={actionStatusFilter} 
                            responsibleFilter={actionResponsibleFilter} 
                            typeFilter={actionTypeFilter}
                        />
                    </TabsContent>
                    <TabsContent value="incidents" className="pt-4">
                        <IncidentsView 
                            incidents={incidents} 
                            dateRange={dateRange}
                            typeFilter={incidentTypeFilter}
                            severityFilter={incidentSeverityFilter}
                            statusFilter={incidentStatusFilter}
                            areaFilter={incidentAreaFilter}
                        />
                    </TabsContent>
                     <TabsContent value="observations" className="pt-4">
                        <ObservationsView 
                            observations={observations} 
                            dateRange={dateRange} 
                            typeFilter={observationTypeFilter}
                            riskFilter={observationRiskFilter}
                            statusFilter={observationStatusFilter}
                        />
                    </TabsContent>
                    <TabsContent value="toolbox-talks" className="pt-4">
                        <ToolboxTalksView
                            talks={toolboxTalks}
                            dateRange={dateRange}
                            departmentFilter={talkDepartmentFilter}
                        />
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    );
}
