'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { mockAreas, mockIncidents, mockObservations, mockAudits } from '@/lib/mockData';
import type { Area } from '@/types';
import { MapPin, PlusCircle, Siren, Eye, ClipboardCheck, Edit, Trash2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

const areaFormSchema = z.object({
  name: z.string().min(3, { message: 'Area name must be at least 3 characters.' }),
  machines: z.string().optional(),
  parentId: z.string().optional(),
});
type AreaFormValues = z.infer<typeof areaFormSchema>;

const AreaForm = ({
  area,
  parentId,
  onSave,
  setOpen,
}: {
  area?: Area;
  parentId?: string | null;
  onSave: (data: AreaFormValues, areaId?: string) => void;
  setOpen: (open: boolean) => void;
}) => {
  const form = useForm<AreaFormValues>({
    resolver: zodResolver(areaFormSchema),
    defaultValues: {
      name: area?.name || '',
      machines: area?.machines.join(', ') || '',
      parentId: parentId || undefined,
    },
  });

  const onSubmit = (data: AreaFormValues) => {
    onSave(data, area?.area_id);
    setOpen(false);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <DialogHeader>
          <DialogTitle>{area ? 'Edit Area' : 'Create New Area'}</DialogTitle>
          <DialogDescription>
            {area ? 'Update the details for this area.' : 'Fill in the details for the new area.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Area Name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Assembly Line 3" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="machines"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Machines (comma-separated)</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Press Machine 4, Conveyor Belt C" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit">Save Area</Button>
        </DialogFooter>
      </form>
    </Form>
  );
};

const AreaDetailsDialog = ({ area, isOpen, onOpenChange }: { area: Area | null; isOpen: boolean; onOpenChange: (open: boolean) => void; }) => {
    if (!area) return null;

    const incidentsInArea = mockIncidents.filter((i) => i.area === area.name);
    const observationsInArea = mockObservations.filter((o) => o.areaId === area.area_id);
    const auditsInArea = mockAudits.filter((a) => a.auditor.includes(area.name));

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-primary" />
                        Area Details: {area.name}
                    </DialogTitle>
                    <DialogDescription>
                        {area.machines.length > 0 ? `Machines: ${area.machines.join(', ')}` : 'This is a container for sub-areas.'}
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[70vh] overflow-y-auto pr-4">
                    <Tabs defaultValue="incidents">
                        <TabsList className="grid w-full grid-cols-3 mb-4">
                            <TabsTrigger value="incidents"><Siren className="mr-2 h-4 w-4" />Incidents ({incidentsInArea.length})</TabsTrigger>
                            <TabsTrigger value="observations"><Eye className="mr-2 h-4 w-4" />Observations ({observationsInArea.length})</TabsTrigger>
                            <TabsTrigger value="audits"><ClipboardCheck className="mr-2 h-4 w-4" />Audits ({auditsInArea.length})</TabsTrigger>
                        </TabsList>
                        <TabsContent value="incidents">
                            <Card>
                                <CardContent className="pt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Severity</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {incidentsInArea.length > 0 ? incidentsInArea.map((incident) => (
                                                <TableRow key={incident.incident_id}>
                                                    <TableCell>{incident.incident_id}</TableCell>
                                                    <TableCell>{new Date(incident.date).toLocaleDateString()}</TableCell>
                                                    <TableCell>{incident.description}</TableCell>
                                                    <TableCell><Badge variant={incident.severity === 'High' ? 'destructive' : incident.severity === 'Medium' ? 'secondary' : 'default'}>{incident.severity}</Badge></TableCell>
                                                </TableRow>
                                            )) : <TableRow><TableCell colSpan={4} className="text-center">No incidents recorded in this area.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="observations">
                           <Card>
                                <CardContent className="pt-6">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead>ID</TableHead>
                                                <TableHead>Date</TableHead>
                                                <TableHead>Submitted By</TableHead>
                                                <TableHead>Description</TableHead>
                                                <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {observationsInArea.length > 0 ? observationsInArea.map((obs) => (
                                            <TableRow key={obs.observation_id}>
                                                <TableCell>{obs.observation_id}</TableCell>
                                                <TableCell>{new Date(obs.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{obs.submitted_by}</TableCell>
                                                <TableCell>{obs.description}</TableCell>
                                                <TableCell><Badge variant={obs.status === 'Open' ? 'default' : 'outline'}>{obs.status}</Badge></TableCell>
                                            </TableRow>
                                            )) : <TableRow><TableCell colSpan={5} className="text-center">No observations recorded in this area.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                        <TabsContent value="audits">
                            <Card>
                                <CardContent className="pt-6">
                                     <Table>
                                        <TableHeader>
                                            <TableRow>
                                            <TableHead>ID</TableHead>
                                            <TableHead>Date</TableHead>
                                            <TableHead>Auditor</TableHead>
                                            <TableHead>Status</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {auditsInArea.length > 0 ? auditsInArea.map((audit) => (
                                            <TableRow key={audit.audit_id}>
                                                <TableCell>{audit.audit_id}</TableCell>
                                                <TableCell>{new Date(audit.date).toLocaleDateString()}</TableCell>
                                                <TableCell>{audit.auditor}</TableCell>
                                                <TableCell><Badge variant={audit.status === 'Completed' ? 'default' : 'secondary'}>{audit.status}</Badge></TableCell>
                                            </TableRow>
                                            )) : <TableRow><TableCell colSpan={4} className="text-center">No audits recorded in this area.</TableCell></TableRow>}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    )
}


const AreaDisplay = ({
  area,
  onEdit,
  onDelete,
  onAddSubArea,
  onViewDetails,
}: {
  area: Area;
  onEdit: (area: Area) => void;
  onDelete: (areaId: string) => void;
  onAddSubArea: (parentId: string) => void;
  onViewDetails: (area: Area) => void;
}) => {
  const getAreaStats = (area: Area): { incidentsCount: number; observationsCount: number; auditsCount: number } => {
    let incidentsCount = mockIncidents.filter((i) => i.area === area.name).length;
    let observationsCount = mockObservations.filter((o) => o.areaId === area.area_id).length;
    let auditsCount = mockAudits.filter((a) => a.auditor.includes(area.name)).length;

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

  const { incidentsCount, observationsCount, auditsCount } = getAreaStats(area);

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-6 w-6 text-primary" />
              {area.name}
            </CardTitle>
            <CardDescription className="pt-2">
              {area.machines.length > 0 ? `Machines: ${area.machines.join(', ')}` : 'This is a container for sub-areas.'}
            </CardDescription>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(area)}>
              <Edit className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the area and all its sub-areas.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(area.area_id)}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
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
                  <AreaDisplay
                    key={childArea.area_id}
                    area={childArea}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    onAddSubArea={onAddSubArea}
                    onViewDetails={onViewDetails}
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline" onClick={() => onViewDetails(area)}>View Area Details</Button>
        <Button variant="secondary" onClick={() => onAddSubArea(area.area_id)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Sub-Area
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | undefined>(undefined);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const { toast } = useToast();
  const [selectedArea, setSelectedArea] = useState<Area | null>(null);
  const [isDetailsOpen, setDetailsOpen] = useState(false);

  const handleSaveArea = (data: AreaFormValues, areaId?: string) => {
    const newArea: Area = {
      area_id: areaId || `AREA${Date.now()}`,
      name: data.name,
      machines: data.machines ? data.machines.split(',').map((m) => m.trim()) : [],
      children: areaId ? areas.find(a => a.area_id === areaId)?.children || [] : [],
    };

    if (areaId) {
      // Update
      const updateRecursive = (items: Area[]): Area[] => {
        return items.map((item) => {
          if (item.area_id === areaId) {
            return { ...item, name: newArea.name, machines: newArea.machines };
          }
          if (item.children) {
            return { ...item, children: updateRecursive(item.children) };
          }
          return item;
        });
      };
      setAreas(updateRecursive(areas));
      toast({ title: 'Area Updated', description: `"${newArea.name}" has been updated.` });
    } else {
      // Create
      if (data.parentId) {
        const addRecursive = (items: Area[]): Area[] => {
          return items.map((item) => {
            if (item.area_id === data.parentId) {
              return { ...item, children: [...(item.children || []), newArea] };
            }
            if (item.children) {
              return { ...item, children: addRecursive(item.children) };
            }
            return item;
          });
        };
        setAreas(addRecursive(areas));
      } else {
        setAreas([...areas, newArea]);
      }
      toast({ title: 'Area Created', description: `"${newArea.name}" has been created.` });
    }
  };

  const handleDeleteArea = (areaId: string) => {
    const deleteRecursive = (items: Area[], id: string): Area[] => {
      return items.filter((item) => item.area_id !== id).map((item) => {
        if (item.children) {
          return { ...item, children: deleteRecursive(item.children, id) };
        }
        return item;
      });
    };
    setAreas(deleteRecursive(areas, areaId));
    toast({ title: 'Area Deleted', variant: 'destructive', description: 'The area and all its sub-areas have been deleted.' });
  };

  const openCreateForm = (parentId: string | null = null) => {
    setEditingArea(undefined);
    setCurrentParentId(parentId);
    setFormOpen(true);
  };

  const openEditForm = (area: Area) => {
    setCurrentParentId(null);
    setEditingArea(area);
    setFormOpen(true);
  };
  
  const openViewDetails = (area: Area) => {
    setSelectedArea(area);
    setDetailsOpen(true);
  };

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Area Profiles</h2>
          <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => openCreateForm(null)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Area
              </Button>
            </DialogTrigger>
            <DialogContent>
              <AreaForm
                area={editingArea}
                parentId={currentParentId}
                onSave={handleSaveArea}
                setOpen={setFormOpen}
              />
            </DialogContent>
          </Dialog>
        </div>
        <p className="text-muted-foreground">
          An overview of all safety events, categorized by area.
        </p>

        <div className="space-y-4">
          {areas.map((area) => (
            <AreaDisplay
              key={area.area_id}
              area={area}
              onEdit={openEditForm}
              onDelete={handleDeleteArea}
              onAddSubArea={(parentId) => openCreateForm(parentId)}
              onViewDetails={openViewDetails}
            />
          ))}
        </div>
        
        <AreaDetailsDialog 
          area={selectedArea}
          isOpen={isDetailsOpen}
          onOpenChange={setDetailsOpen}
        />
      </div>
    </AppShell>
  );
}
