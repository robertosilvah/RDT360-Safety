import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { mockAreas, mockIncidents, mockObservations, mockAudits } from '@/lib/mockData';
import { MapPin, PlusCircle, Siren, Eye, ClipboardCheck } from 'lucide-react';

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

        <div className="grid gap-6 md:grid-cols-2">
          {mockAreas.map((area) => {
            const incidentsCount = mockIncidents.filter(i => i.area === area.name).length;
            const observationsCount = mockObservations.filter(o => o.location === area.name).length;
            const auditsCount = mockAudits.filter(a => a.auditor.includes(area.name)).length; // Simplified logic

            return (
              <Card key={area.area_id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-primary" />
                    {area.name}
                  </CardTitle>
                  <CardDescription>
                    Machines: {area.machines.join(', ')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-around items-center bg-muted/50 p-4 rounded-lg">
                        <div className="text-center">
                            <Siren className="h-6 w-6 mx-auto text-destructive"/>
                            <p className="font-bold text-xl">{incidentsCount}</p>
                            <p className="text-xs text-muted-foreground">Incidents</p>
                        </div>
                         <div className="text-center">
                            <Eye className="h-6 w-6 mx-auto text-blue-500"/>
                            <p className="font-bold text-xl">{observationsCount}</p>
                            <p className="text-xs text-muted-foreground">Observations</p>
                        </div>
                         <div className="text-center">
                            <ClipboardCheck className="h-6 w-6 mx-auto text-green-500"/>
                             <p className="font-bold text-xl">{auditsCount}</p>
                            <p className="text-xs text-muted-foreground">Audits</p>
                        </div>
                    </div>
                  <Button variant="outline" className="w-full">View Area Details</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
