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

const AreaDisplay = ({
  area,
  onEdit,
  onDelete,
  onAddSubArea,
}: {
  area: Area;
  onEdit: (area: Area) => void;
  onDelete: (areaId: string) => void;
  onAddSubArea: (parentId: string) => void;
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
                  />
                ))}
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-between">
        <Button variant="outline">View Area Details</Button>
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
            />
          ))}
        </div>
      </div>
    </AppShell>
  );
}
