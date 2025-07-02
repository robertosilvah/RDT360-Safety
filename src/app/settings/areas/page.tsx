
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import type { Area } from '@/types';
import {
  PlusCircle,
  Edit,
  Trash2,
  ChevronDown,
  ChevronRight,
  FolderTree,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppData } from '@/context/AppDataContext';

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
          <Button type="submit">Save & Close</Button>
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


export default function AreaManagementPage() {
  const { areas, addArea, updateArea, deleteArea } = useAppData();
  const [isFormOpen, setFormOpen] = useState(false);
  const [editingArea, setEditingArea] = useState<Area | undefined>(undefined);
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const { toast } = useToast();

  const handleSaveArea = (data: AreaFormValues, areaId?: string) => {
    if (areaId) {
      const findAreaByIdRecursive = (areasToSearch: Area[], id: string): Area | undefined => {
        for (const area of areasToSearch) {
          if (area.area_id === id) return area;
          if (area.children) {
            const found = findAreaByIdRecursive(area.children, id);
            if (found) return found;
          }
        }
        return undefined;
      };
      const existingArea = findAreaByIdRecursive(areas, areaId);
      if (!existingArea) {
        toast({ title: 'Error', description: 'Could not find area to update.', variant: 'destructive' });
        return;
      }

      const updatedAreaData: Area = {
        ...existingArea,
        name: data.name,
        machines: data.machines ? data.machines.split(',').map((m) => m.trim()) : [],
      };
      updateArea(updatedAreaData);
      toast({ title: 'Area Updated', description: `"${data.name}" has been updated.` });
    } else {
      const newArea: Omit<Area, 'area_id' | 'children'> = {
        name: data.name,
        machines: data.machines ? data.machines.split(',').map((m) => m.trim()) : [],
      };
      addArea(newArea, data.parentId);
      toast({ title: 'Area Created', description: `"${newArea.name}" has been created.` });
    }
  };

  const handleDeleteArea = (areaId: string) => {
    deleteArea(areaId);
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
    <>
    <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Manage Areas</CardTitle>
                <CardDescription>Add, edit, or delete facility areas and sub-areas.</CardDescription>
            </div>
            <Dialog open={isFormOpen} onOpenChange={setFormOpen}>
            <DialogTrigger asChild>
                <Button onClick={() => openCreateForm(null)}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Top-Level Area
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
        </CardHeader>
        <CardContent>
            <ScrollArea className="h-[60vh]">
                <div className="space-y-1 pr-4">
                {areas.map(area => (
                    <AreaHierarchyItem
                        key={area.area_id}
                        area={area}
                        level={0}
                        onEdit={openEditForm}
                        onDelete={handleDeleteArea}
                        onAddSubArea={openCreateForm}
                    />
                ))}
                </div>
            </ScrollArea>
        </CardContent>
    </Card>
    </>
  );
}
