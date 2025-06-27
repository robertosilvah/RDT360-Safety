import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  mockAreas,
  mockIncidents,
  mockObservations,
  mockAudits,
} from '@/lib/mockData';
import type { Area } from '@/types';
import { MapPin, PlusCircle, Siren, Eye, ClipboardCheck } from 'lucide-react';

// Helper function to get stats for an area and its children recursively
const getAreaStats = (
  area: Area
): { incidentsCount: number; observationsCount: number; auditsCount: number } => {
  let incidentsCount = mockIncidents.filter((i) => i.area === area.name).length;
  let observationsCount = mockObservations.filter(
    (o) => o.location === area.name
  ).length;
  let auditsCount = mockAudits.filter((a) =>
    a.auditor.includes(area.name)
  ).length; // Simplified logic

  if (area.children) {
    area.children.forEach((child) => {
      const childStats = getAreaStats(child);
      incidentsCount += childStats.incidentsCount;
      observationsCount += childStats.observationsCount;
      auditsCount += childStats.auditsCount;
    });
  }

  return { incidentsCount, observationsCount, auditsCount };
};

const AreaDisplay = ({ area }: { area: Area }) => {
  const { incidentsCount, observationsCount, auditsCount } = getAreaStats(area);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          {area.name}
        </CardTitle>
        <CardDescription>
          {area.machines.length > 0
            ? `Machines: ${area.machines.join(', ')}`
            : 'This is a container for sub-areas.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-around items-center bg-muted/50 p-4 rounded-lg">
          <div className="text-center">
            <Siren className="h-6 w-6 mx-auto text-destructive" />
            <p className="font-bold text-xl">{incidentsCount}</p>
            <p className="text-xs text-muted-foreground">Incidents</p>
          </div>
          <div className="text-center">
            <Eye className="h-6 w-6 mx-auto text-blue-500" />
            <p className="font-bold text-xl">{observationsCount}</p>
            <p className="text-xs text-muted-foreground">Observations</p>
          </div>
          <div className="text-center">
            <ClipboardCheck className="h-6 w-6 mx-auto text-green-500" />
            <p className="font-bold text-xl">{auditsCount}</p>
            <p className="text-xs text-muted-foreground">Audits</p>
          </div>
        </div>

        {area.children && area.children.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="sub-areas">
              <AccordionTrigger>Sub-Areas</AccordionTrigger>
              <AccordionContent className="pt-4 space-y-4">
                {area.children.map((childArea) => (
                  <AreaDisplay key={childArea.area_id} area={childArea} />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}

        <Button variant="outline" className="w-full">
          View Area Details
        </Button>
      </CardContent>
    </Card>
  );
};

export default function AreasPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Area Profiles</h2>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Area
          </Button>
        </div>
        <p className="text-muted-foreground">
          An overview of all safety events, categorized by area.
        </p>

        <div className="space-y-4">
          {mockAreas.map((area) => (
            <AreaDisplay key={area.area_id} area={area} />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
