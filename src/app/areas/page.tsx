'use client';

import React, { useState } from 'react';
import { AppShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { mockAreas } from '@/lib/mockData';
import type { Area } from '@/types';
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderTree,
  MapPin,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

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

const AreaHierarchyItem = ({
  area,
  level = 0,
  onEdit,
  onDelete,
  onAddSubArea,
}: {
  area: Area;
  level?: number;
  onEdit: (area: Area) => void;
  onDelete: (areaId: string) => void;
  onAddSubArea: (parentId: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = area.children && area.children.length > 0;

  return (
    <div className="relative">
      <div className="absolute left-3 top-0 h-full w-px bg-border -z-10" style={{ marginLeft: `${level * 20}px` }}></div>
      <div
        className="group flex items-center gap-1 rounded-md hover:bg-muted/50"
        style={{ paddingLeft: `${level * 20}px` }}
      >
        {hasChildren ? (
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        ) : (
          <div className="w-8 h-8" />
        )}
        <FolderTree className="h-4 w-4 text-muted-foreground" />
        <span className="flex-1 font-medium text-sm truncate">{area.name}</span>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 pr-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(area)}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddSubArea(area.area_id)}>
            <PlusCircle className="h-4 w-4" />
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete "{area.name}" and all its sub-areas.
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
      {hasChildren && isOpen && (
        <div className="relative">
          {area.children.map((child) => (
            <AreaHierarchyItem
              key={child.area_id}
              area={child}
              level={level + 1}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddSubArea={onAddSubArea}
            />
          ))}
        </div>
      )}
    </div>
  );
};


export default function AreasPage() {
  const [areas, setAreas] = useState<Area[]>(mockAreas);
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(mockAreas[0]?.area_id || null);
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
  
  const getSubAssetCount = (area: Area): number => {
    let count = area.children?.length || 0;
    if (area.children) {
        area.children.forEach(child => {
            count += getSubAssetCount(child);
        });
    }
    return count;
  }

  const selectedArea = areas.find(a => a.area_id === selectedAreaId);

  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6 flex flex-col h-[calc(100vh-60px)]">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Areas</h2>
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

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 flex-1 min-h-0">
          <Card className="md:col-span-1 lg:col-span-1 flex flex-col">
            <CardHeader>
              <CardTitle>All Areas</CardTitle>
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
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>{selectedArea.name}</CardTitle>
                  <Button variant="outline" onClick={() => openCreateForm(selectedArea.area_id)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Sub-Area
                  </Button>
                </CardHeader>
                <CardContent className="flex-1 p-2 min-h-0">
                    <ScrollArea className="h-full">
                         <div className="space-y-1">
                            {selectedArea.children && selectedArea.children.length > 0 ? (
                                selectedArea.children.map(child => (
                                    <AreaHierarchyItem
                                        key={child.area_id}
                                        area={child}
                                        onEdit={openEditForm}
                                        onDelete={handleDeleteArea}
                                        onAddSubArea={openCreateForm}
                                    />
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    No sub-areas have been created for {selectedArea.name}.
                                </div>
                            )}
                         </div>
                    </ScrollArea>
                </CardContent>
              </>
            ) : (
              <div className="flex flex-1 items-center justify-center text-muted-foreground">
                <p>Select an area from the left to view its hierarchy.</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}