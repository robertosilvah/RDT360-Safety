
'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval, startOfMonth, endOfMonth } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Calendar as CalendarIcon, Filter, Plus, Users, MapPin, AlertCircle, Clock } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell } from 'recharts';
import type { CorrectiveAction } from '@/types';

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

const WorkOrdersByTypeChart = ({ data }: { data: any[] }) => (
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

const WorkOrdersView = ({ actions, dateRange }: { actions: CorrectiveAction[], dateRange?: DateRange }) => {

    const filteredActions = useMemo(() => {
        return actions.filter(action => {
            if (!dateRange?.from) return true;
            const toDate = dateRange.to ?? dateRange.from;
            try {
                return isWithinInterval(new Date(action.created_date), { start: dateRange.from, end: toDate });
            } catch (e) { return false; }
        });
    }, [actions, dateRange]);

    const kpiData = useMemo(() => {
        const created = filteredActions.length;
        const completed = filteredActions.filter(a => a.status === 'Completed').length;
        const percentCompleted = created > 0 ? ((completed / created) * 100).toFixed(1) : '0.0';
        return { created, completed, percentCompleted };
    }, [filteredActions]);

    const chartData = useMemo(() => {
        const months: { [key: string]: { created: number; completed: number } } = {};
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

        filteredActions.forEach(action => {
            const createdMonth = format(new Date(action.created_date), 'MMM');
            if (!months[createdMonth]) months[createdMonth] = { created: 0, completed: 0 };
            months[createdMonth].created++;

            if (action.completion_date) {
                const completedMonth = format(new Date(action.completion_date), 'MMM');
                if (!months[completedMonth]) months[completedMonth] = { created: 0, completed: 0 };
                months[completedMonth].completed++;
            }
        });

        return monthNames.map(name => ({
            name,
            created: months[name]?.created || 0,
            completed: months[name]?.completed || 0,
        }));
    }, [filteredActions]);

    const byTypeData = useMemo(() => {
        const counts = filteredActions.reduce((acc, action) => {
            acc[action.type] = (acc[action.type] || 0) + 1;
            return acc;
        }, {} as Record<CorrectiveAction['type'], number>);
        return Object.entries(counts).map(([name, count]) => ({ name, count }));
    }, [filteredActions]);
    
    const byStatusData = useMemo(() => {
        const counts = filteredActions.reduce((acc, action) => {
            acc[action.status] = (acc[action.status] || 0) + 1;
            return acc;
        }, {} as Record<CorrectiveAction['status'], number>);
        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [filteredActions]);

    return (
        <div className="space-y-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle>Created vs. Completed</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x">
                    <KpiCard title="Created" value={kpiData.created} />
                    <KpiCard title="Completed" value={kpiData.completed} />
                    <KpiCard title="Percent Completed" value={`${kpiData.percentCompleted}%`} description="Work orders completed in this time period."/>
                </CardContent>
                <div className="px-6 pb-4">
                    <CreatedVsCompletedChart data={chartData} />
                </div>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader><CardTitle>Work Orders by Type</CardTitle></CardHeader>
                    <CardContent>
                       <WorkOrdersByTypeChart data={byTypeData} />
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

export default function ReportingPage() {
    const { correctiveActions } = useAppData();
    const [dateRange, setDateRange] = useState<DateRange | undefined>({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
    });

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
                         <Button variant="outline">Export</Button>
                    </div>
                </div>

                <Tabs defaultValue="work-orders">
                    <TabsList>
                        <TabsTrigger value="work-orders">Corrective Actions</TabsTrigger>
                        <TabsTrigger value="asset-health" disabled>Incidents</TabsTrigger>
                        <TabsTrigger value="reporting-details" disabled>Observations</TabsTrigger>
                    </TabsList>
                     <div className="flex items-center gap-2 py-4">
                        <Button variant="outline" size="sm"><Users className="mr-2 h-4 w-4" />Assigned To</Button>
                        <Button variant="outline" size="sm"><Clock className="mr-2 h-4 w-4" />Due Date</Button>
                        <Button variant="outline" size="sm"><MapPin className="mr-2 h-4 w-4" />Location</Button>
                        <Button variant="outline" size="sm"><AlertCircle className="mr-2 h-4 w-4" />Severity</Button>
                        <Button variant="ghost" size="sm"><Plus className="mr-2 h-4 w-4" />Add Filter</Button>
                    </div>
                    <TabsContent value="work-orders">
                        <WorkOrdersView actions={correctiveActions} dateRange={dateRange} />
                    </TabsContent>
                </Tabs>
            </div>
        </AppShell>
    );
}
