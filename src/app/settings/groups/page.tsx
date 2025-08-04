
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Save, PlusCircle, Edit, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

type Permission = {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

const initialPermissionsByRole: Record<User['role'] | string, Permission[]> = {
  Administrator: [
    { module: 'Dashboard', view: true, create: true, edit: true, delete: true },
    { module: 'Incidents', view: true, create: true, edit: true, delete: true },
    { module: 'Investigations', view: true, create: true, edit: true, delete: true },
    { module: 'Observations', view: true, create: true, edit: true, delete: true },
    { module: 'Safety Walks', view: true, create: true, edit: true, delete: true },
    { module: 'Corrective Actions', view: true, create: true, edit: true, delete: true },
    { module: 'Permits', view: true, create: true, edit: true, delete: true },
    { module: 'JSAs', view: true, create: true, edit: true, delete: true },
    { module: 'Settings', view: true, create: true, edit: true, delete: true },
  ],
  Manager: [
    { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
    { module: 'Incidents', view: true, create: true, edit: true, delete: false },
    { module: 'Investigations', view: true, create: true, edit: true, delete: false },
    { module: 'Observations', view: true, create: true, edit: true, delete: false },
    { module: 'Safety Walks', view: true, create: true, edit: true, delete: false },
    { module: 'Corrective Actions', view: true, create: true, edit: true, delete: false },
    { module: 'Permits', view: true, create: true, edit: true, delete: false },
    { module: 'JSAs', view: true, create: true, edit: true, delete: false },
    { module: 'Settings', view: false, create: false, edit: false, delete: false },
  ],
  Operator: [
    { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
    { module: 'Incidents', view: true, create: true, edit: false, delete: false },
    { module: 'Investigations', view: false, create: false, edit: false, delete: false },
    { module: 'Observations', view: true, create: true, edit: false, delete: false },
    { module: 'Safety Walks', view: true, create: false, edit: false, delete: false },
    { module: 'Corrective Actions', view: true, create: false, edit: true, delete: false },
    { module: 'Permits', view: true, create: false, edit: false, delete: false },
    { module: 'JSAs', view: true, create: false, edit: false, delete: false },
    { module: 'Settings', view: false, create: false, edit: false, delete: false },
  ],
  Maintenance: [
    { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
    { module: 'Incidents', view: true, create: true, edit: false, delete: false },
    { module: 'Investigations', view: false, create: false, edit: false, delete: false },
    { module: 'Observations', view: true, create: true, edit: false, delete: false },
    { module: 'Safety Walks', view: true, create: false, edit: false, delete: false },
    { module: 'Corrective Actions', view: true, create: false, edit: true, delete: false },
    { module: 'Permits', view: true, create: true, edit: true, delete: false },
    { module: 'JSAs', view: true, create: true, edit: true, delete: false },
    { module: 'Settings', view: false, create: false, edit: false, delete: false },
  ],
  HR: [
    { module: 'Dashboard', view: true, create: false, edit: false, delete: false },
    { module: 'Incidents', view: true, create: false, edit: false, delete: false },
    { module: 'Investigations', view: true, create: false, edit: false, delete: false },
    { module: 'Observations', view: false, create: false, edit: false, delete: false },
    { module: 'Safety Walks', view: false, create: false, edit: false, delete: false },
    { module: 'Corrective Actions', view: true, create: false, edit: false, delete: false },
    { module: 'Permits', view: false, create: false, edit: false, delete: false },
    { module: 'JSAs', view: false, create: false, edit: false, delete: false },
    { module: 'Settings', view: false, create: false, edit: false, delete: false },
  ],
};

const PermissionCheckbox = ({
  checked,
  onCheckedChange,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) => (
  <Checkbox
    checked={checked}
    onCheckedChange={onCheckedChange}
    className="data-[state=checked]:bg-green-500 border-gray-400"
  />
);

const RoleDialog = ({
    open, onOpenChange, onSave, roleName
} : {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (newName: string) => void;
    roleName: string | null;
}) => {
    const [name, setName] = useState('');

    React.useEffect(() => {
        if(open) setName(roleName || '');
    }, [open, roleName]);

    const handleSave = () => {
        if(name.trim()) onSave(name.trim());
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{roleName ? 'Edit Role Name' : 'Add New Role'}</DialogTitle>
                    <DialogDescription>{roleName ? 'Change the name for this role.' : 'Create a new user role group.'}</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="role-name" className="text-right">Name</Label>
                        <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSave} disabled={!name.trim()}>Save</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function GroupsPage() {
  const [permissions, setPermissions] = useState(initialPermissionsByRole);
  const [isRoleDialogOpen, setRoleDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [isNewRole, setIsNewRole] = useState(false);
  const { toast } = useToast();

  const handlePermissionChange = (
    role: string,
    module: string,
    permission: keyof Omit<Permission, 'module'>,
    value: boolean
  ) => {
    setPermissions(prev => {
      const newPermissions = { ...prev };
      const rolePermissions = newPermissions[role].map(p => {
        if (p.module === module) {
          return { ...p, [permission]: value };
        }
        return p;
      });
      return { ...newPermissions, [role]: rolePermissions };
    });
  };

  const handleSaveChanges = () => {
    // In a real app, you would save this `permissions` state to your backend.
    console.log("Saving permissions:", permissions);
    toast({
        title: "Permissions Saved",
        description: "User group permissions have been updated.",
    });
  };
  
  const handleOpenRoleDialog = (roleName?: string) => {
      setEditingRole(roleName || null);
      setIsNewRole(!roleName);
      setRoleDialogOpen(true);
  }

  const handleSaveRole = (newName: string) => {
    setPermissions(prev => {
        const newPerms = { ...prev };
        if(isNewRole) {
            if(newPerms[newName]) {
                toast({ variant: 'destructive', title: 'Error', description: 'A role with this name already exists.' });
                return prev;
            }
            // Use 'Operator' as a template for new roles
            newPerms[newName] = JSON.parse(JSON.stringify(initialPermissionsByRole['Operator']));
            toast({ title: 'Role Added', description: `New role "${newName}" has been created.` });
        } else if (editingRole && newName !== editingRole) {
            if(newPerms[newName]) {
                toast({ variant: 'destructive', title: 'Error', description: 'A role with this name already exists.' });
                return prev;
            }
            newPerms[newName] = newPerms[editingRole];
            delete newPerms[editingRole];
            toast({ title: 'Role Updated', description: `Role "${editingRole}" renamed to "${newName}".` });
        }
        return newPerms;
    });
    setRoleDialogOpen(false);
  }
  
  const handleDeleteRole = (roleName: string) => {
    // Prevent deletion of the Administrator role
    if (roleName === 'Administrator') {
      toast({ variant: 'destructive', title: 'Action Not Allowed', description: 'The Administrator role cannot be deleted.' });
      return;
    }
    setPermissions(prev => {
      const newPerms = { ...prev };
      delete newPerms[roleName];
      return newPerms;
    });
    toast({ title: 'Role Deleted', description: `The role "${roleName}" has been removed.` });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
            <CardTitle>Groups & Permissions</CardTitle>
            <CardDescription>
            Configure the permissions for each user role in the system.
            </CardDescription>
        </div>
        <Button onClick={() => handleOpenRoleDialog()}><PlusCircle className="mr-2 h-4 w-4" /> Add Role</Button>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" defaultValue="Manager">
          {Object.entries(permissions).map(([role, perms]) => (
            <AccordionItem value={role} key={role}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">{role}</span>
                  <Badge variant="outline">{perms.length} Modules</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="flex justify-end gap-2 mb-4 pr-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenRoleDialog(role)}>
                        <Edit className="mr-2 h-4 w-4" /> Rename
                    </Button>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="destructive" size="sm" disabled={role === 'Administrator'}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Role
                           </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>This will permanently delete the "{role}" role. This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteRole(role)}>Confirm Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Module</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">View</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Create</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Edit</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                      {perms.map((p) => (
                        <tr key={p.module}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{p.module}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.view} onCheckedChange={(val) => handlePermissionChange(role, p.module, 'view', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.create} onCheckedChange={(val) => handlePermissionChange(role, p.module, 'create', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.edit} onCheckedChange={(val) => handlePermissionChange(role, p.module, 'edit', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.delete} onCheckedChange={(val) => handlePermissionChange(role, p.module, 'delete', val)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
        <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveChanges}><Save className="mr-2 h-4 w-4" /> Save All Changes</Button>
        </div>
        <RoleDialog open={isRoleDialogOpen} onOpenChange={setRoleDialogOpen} onSave={handleSaveRole} roleName={isNewRole ? null : editingRole} />
      </CardContent>
    </Card>
  );
}

    