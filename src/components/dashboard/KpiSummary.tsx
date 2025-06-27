'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getKpiSummaryAction } from '@/app/actions';
import { Loader2, Wand2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';

const departments = [
    { id: 'assembly', name: 'Assembly', kpi: { incidents: 2, observations: 15, actions_pending: 3 } },
    { id: 'warehouse', name: 'Warehouse', kpi: { incidents: 1, observations: 8, actions_pending: 1 } },
    { id: 'welding', name: 'Welding', kpi: { incidents: 5, observations: 4, actions_pending: 7 } },
    { id: 'packaging', name: 'Packaging', kpi: { incidents: 0, observations: 12, actions_pending: 2 } },
];

export function KpiSummary() {
    const [selectedDepartment, setSelectedDepartment] = useState<string | null>(null);
    const [summary, setSummary] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerateSummary = async () => {
        if (!selectedDepartment) {
            setError('Please select a department.');
            return;
        }
        setIsLoading(true);
        setError(null);
        setSummary('');

        const departmentData = departments.find(d => d.id === selectedDepartment);
        if (!departmentData) {
            setError('Could not find data for the selected department.');
            setIsLoading(false);
            return;
        }

        try {
            const result = await getKpiSummaryAction({
                departmentName: departmentData.name,
                kpiData: JSON.stringify(departmentData.kpi),
            });
            if (result.summary) {
                setSummary(result.summary);
            } else {
                setError('Failed to generate summary. The result was empty.');
            }
        } catch (err) {
            setError('An error occurred while generating the summary.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>AI KPI Summary</CardTitle>
                <CardDescription>
                    Generate an AI-powered summary of key performance indicators for a selected department.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Select onValueChange={setSelectedDepartment} value={selectedDepartment ?? ''}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select a department" />
                    </SelectTrigger>
                    <SelectContent>
                        {departments.map(dep => (
                            <SelectItem key={dep.id} value={dep.id}>{dep.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                 {error && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {summary && !isLoading && (
                    <div className="p-4 bg-secondary rounded-lg border">
                        <p className="text-sm text-secondary-foreground">{summary}</p>
                    </div>
                )}
                 {isLoading && (
                    <div className="p-4 bg-secondary rounded-lg border flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                        <p className="ml-2 text-sm text-secondary-foreground">Generating summary...</p>
                    </div>
                )}
            </CardContent>
            <CardFooter>
                <Button onClick={handleGenerateSummary} disabled={isLoading || !selectedDepartment} className="w-full">
                    {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Wand2 className="mr-2 h-4 w-4" />
                    )}
                    Generate Summary
                </Button>
            </CardFooter>
        </Card>
    );
}
