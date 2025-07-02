
'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DateRange } from 'react-day-picker';
import { format, isWithinInterval } from 'date-fns';
import { useAppData } from '@/context/AppDataContext';
import { Calendar as CalendarIcon, Printer } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { Incident, Observation, CorrectiveAction } from '@/types';
import { Badge } from '@/components/ui/badge';

type ReportType = 'incidents' | 'observations' | 'actions';

const ReportResults = ({ reportData, reportTitle, dateRange }: { reportData: any[] | null; reportTitle: string; dateRange?: DateRange }) => {
    if (!reportData) {
        return (
            <div className="flex flex-col items-center justify-center text-center p-10 border-2 border-dashed rounded-lg text-muted-foreground">
                <p className="font-semibold">Generate a Report</p>
                <p className="text-sm">Select your criteria above and click "Generate Report" to view data.</p>
            </div>
        );
    }
    
    if (reportData.length === 0) {
        return <p className="text-center text-muted-foreground">No data found for the selected criteria.</p>;
    }

    const renderTable = () => {
        if (reportTitle.includes('Incident')) {
            return (
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Severity</TableHead><TableHead>Status</TableHead><TableHead className="w-[40%]">Description</TableHead></TableRow></TableHeader>
                    <TableBody>{(reportData as Incident[]).map(item => (<TableRow key={item.incident_id}><TableCell>{item.display_id}</TableCell><TableCell>{format(new Date(item.date), 'P')}</TableCell><TableCell>{item.type}</TableCell><TableCell>{item.severity}</TableCell><TableCell>{item.status}</TableCell><TableCell>{item.description}</TableCell></TableRow>))}</TableBody>
                </Table>
            );
        }
        if (reportTitle.includes('Observation')) {
            return (
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Risk Level</TableHead><TableHead>Status</TableHead><TableHead className="w-[40%]">Description</TableHead></TableRow></TableHeader>
                    <TableBody>{(reportData as Observation[]).map(item => (<TableRow key={item.observation_id}><TableCell>{item.display_id}</TableCell><TableCell>{format(new Date(item.date), 'P')}</TableCell><TableCell>{item.report_type}</TableCell><TableCell>{item.risk_level}</TableCell><TableCell>{item.status}</TableCell><TableCell>{item.description}</TableCell></TableRow>))}</TableBody>
                </Table>
            );
        }
        if (reportTitle.includes('Action')) {
             return (
                <Table>
                    <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Due Date</TableHead><TableHead>Responsible</TableHead><TableHead>Status</TableHead><TableHead className="w-[40%]">Description</TableHead></TableRow></TableHeader>
                    <TableBody>{(reportData as CorrectiveAction[]).map(item => (<TableRow key={item.action_id}><TableCell>{item.display_id}</TableCell><TableCell>{format(new Date(item.due_date), 'P')}</TableCell><TableCell>{item.responsible_person}</TableCell><TableCell><Badge variant={item.status === 'Overdue' ? 'destructive' : 'default'}>{item.status}</Badge></TableCell><TableCell>{item.description}</TableCell></TableRow>))}</TableBody>
                </Table>
            );
        }
        return null;
    }

    return (
        <div className="printable-area">
            <header className="mb-8">
                <h1 className="text-2xl font-bold">{reportTitle}</h1>
                <p className="text-muted-foreground">
                    Date Range: {dateRange?.from ? format(dateRange.from, 'PPP') : 'N/A'} - {dateRange?.to ? format(dateRange.to, 'PPP') : 'N/A'}
                </p>
                <p className="text-muted-foreground">Generated on: {format(new Date(), 'PPP p')}</p>
            </header>
            {renderTable()}
        </div>
    )
}


export default function ReportingPage() {
    const { incidents, observations, correctiveActions } = useAppData();
    const [reportType, setReportType] = useState<ReportType>('incidents');
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [reportData, setReportData] = useState<any[] | null>(null);
    const [reportTitle, setReportTitle] = useState('');

    const handleGenerateReport = () => {
        let data: any[] = [];
        let title = '';

        const filterByDate = (itemDate: string) => {
            if (!dateRange?.from) return true;
            const toDate = dateRange.to ?? dateRange.from;
            try {
                return isWithinInterval(new Date(itemDate), { start: dateRange.from, end: toDate });
            } catch (e) {
                return false;
            }
        };

        switch (reportType) {
            case 'incidents':
                data = incidents.filter(i => filterByDate(i.date));
                title = 'Incident Log Report';
                break;
            case 'observations':
                data = observations.filter(o => filterByDate(o.date));
                title = 'Observation Summary Report';
                break;
            case 'actions':
                data = correctiveActions.filter(a => filterByDate(a.due_date));
                title = 'Corrective Actions Report';
                break;
        }
        setReportData(data);
        setReportTitle(title);
    };

    const handlePrint = () => {
        window.print();
    }

    return (
        <AppShell>
            <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
                <div className="flex items-center justify-between space-y-2 no-print">
                    <h2 className="text-3xl font-bold tracking-tight">Reporting</h2>
                </div>

                <Card className="no-print">
                    <CardHeader>
                        <CardTitle>Report Generator</CardTitle>
                        <CardDescription>Select your criteria to generate a custom report.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Report Type</label>
                            <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="incidents">Incidents</SelectItem>
                                    <SelectItem value="observations">Observations</SelectItem>
                                    <SelectItem value="actions">Corrective Actions</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-2">
                            <label className="text-sm font-medium">Date Range</label>
                            <Popover>
                                <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full justify-start text-left font-normal", !dateRange && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {dateRange?.from ? (dateRange.to ? (<>{format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}</>) : (format(dateRange.from, "LLL dd, y"))) : (<span>Pick a date range</span>)}
                                </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar initialFocus mode="range" defaultMonth={dateRange?.from} selected={dateRange} onSelect={setDateRange} numberOfMonths={2}/>
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex items-end">
                            <Button onClick={handleGenerateReport} className="w-full">Generate Report</Button>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between no-print">
                         <div>
                            <CardTitle>Report Preview</CardTitle>
                            <CardDescription>
                                {reportTitle ? `${reportTitle}` : 'Your generated report will appear here.'}
                            </CardDescription>
                        </div>
                        <Button variant="outline" size="sm" onClick={handlePrint} disabled={!reportData} className="no-print">
                            <Printer className="mr-2 h-4 w-4" />
                            Print / Save PDF
                        </Button>
                    </CardHeader>
                    <CardContent>
                       <ReportResults reportData={reportData} reportTitle={reportTitle} dateRange={dateRange} />
                    </CardContent>
                </Card>
            </div>
        </AppShell>
    );
}
