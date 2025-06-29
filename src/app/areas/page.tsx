
'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAppData } from '@/context/AppDataContext';
import type { Area, Incident, Observation } from '@/types';
import { MapPin, Siren, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

// Helper function to get all nested area IDs from a starting area
const getAllAreaIds = (area: Area): string[] => {
    let ids = [area.area_id];
    if (area.children) {
        ids = ids.concat(area.children.flatMap(getAllAreaIds));
    }
    return ids;
};

// Helper function to get all nested area names from a starting area
const getAllAreaNames = (area: Area): string[] => {
    let names = [area.name];
    if (area.children) {
        names = names.concat(area.children.flatMap(getAllAreaNames));
    }
    return names;
};

const AreaDashboard = ({ area }: { area: Area }) => {
    const { incidents, observations } = useAppData();

    const areaStats = useMemo(() => {
        const descendantAreaIds = getAllAreaIds(area);
        const descendantAreaNames = getAllAreaNames(area);

        const relevantObservations = observations.filter(obs => descendantAreaIds.includes(obs.areaId));
        const relevantIncidents = incidents.filter(inc => descendantAreaNames.includes(inc.area));

        return {
            totalObservations: relevantObservations.length,
            openObservations: relevantObservations.filter(o => o.status === 'Open'),
            totalIncidents: relevantIncidents.length,
            recentIncidents: relevantIncidents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5)
        };
    }, [area, incidents, observations]);
    
    const severityVariant: { [key in Incident['severity']]: 'destructive' | 'secondary' | 'default' } = {
        'High': 'destructive',
        'Medium': 'secondary',
        'Low': 'default',
    };

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
                <KpiCard
                    title="Total Incidents"
                    value={areaStats.totalIncidents.toString()}
                    icon={<Siren className="h-4 w-4 text-muted-foreground" />}
                    description="In this area and all sub-areas."
                />
                <KpiCard
                    title="Open Observations"
                    value={areaStats.openObservations.length.toString()}
                    icon={<Eye className="h-4 w-4 text-muted-foreground" />}
                    description="In this area and all sub-areas."
                />
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Incidents</CardTitle>
                    <CardDescription>Last 5 incidents recorded in this area hierarchy.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead className="w-[50%]">Description</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead>Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {areaStats.recentIncidents.length > 0 ? (
                                areaStats.recentIncidents.map(incident => (
                                    <TableRow key={incident.incident_id}>
                                        <TableCell>
                                            <Button variant="link" asChild className="p-0 h-auto">
                                                <Link href="/incidents">{incident.display_id}</Link>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="truncate">{incident.description}</TableCell>
                                        <TableCell><Badge variant={severityVariant[incident.severity]}>{incident.severity}</Badge></TableCell>
                                        <TableCell>{incident.status}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={4} className="text-center">No incidents found in this area.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
};


export default function AreasPage() {
  const { areas } = useAppData();
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(areas[0]?.area_id || null);

  const getSubAssetCount = (area: Area): number => {
    let count = area.children?.length || 0;
    if (area.children) {
        area.children.forEach(child => {
            count += getSubAssetCount(child);
        });
    }
    return count;
  }
  
  // This logic is complex because area data is nested.
  const findAreaById = (areasToSearch: Area[], id: string): Area | undefined => {
    for (const area of areasToSearch) {
        if (area.area_id === id) return area;
        if (area.children) {
            const found = findAreaById(area.children, id);
            if (found) return found;
        }
    }
    return undefined;
  };
  
  const selectedArea = selectedAreaId ? findAreaById(areas, selectedAreaId) : null;

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex flex-col h-[calc(100vh-60px)]">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Area Dashboard</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>All Areas</CardTitle>
              <CardDescription>Select an area to view its safety dashboard.</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 p-2 min-h-0">
              <ScrollArea className="h-full">
                <div className="space-y-1 pr-2">
                {areas.map(area => (
                  <button
                    key={area.area_id}
                    onClick={() => setSelectedAreaId(area.area_id)}
                    className={cn(
                        "w-full text-left p-3 rounded-lg border",
                        selectedAreaId === area.area_id ? "bg-muted border-primary" : "border-transparent hover:bg-muted/50"
                    )}
                  >
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-muted rounded-md">
                            <MapPin className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-semibold">{area.name}</p>
                            <p className="text-xs text-blue-600 font-semibold mt-1">{getSubAssetCount(area)} Sub-Areas</p>
                        </div>
                    </div>
                  </button>
                ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className="md:col-span-2 lg:col-span-3 flex flex-col">
            {selectedArea ? (
              <>
                <CardHeader>
                  <CardTitle>{selectedArea.name} Dashboard</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 p-6 min-h-0">
                    <ScrollArea className="h-full">
                         <AreaDashboard area={selectedArea} />
                    </ScrollArea>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <p>Select an area from the left to view its dashboard.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
