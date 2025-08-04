
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Shield, Save } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

type Permission = {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

const initialPermissionsByRole: Record<User['role'], Permission[]> = {
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

export default function GroupsPage() {
  const [permissions, setPermissions] = useState(initialPermissionsByRole);
  const { toast } = useToast();

  const handlePermissionChange = (
    role: User['role'],
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
    // In a real app, you would save this `permissions` state to your backend (e.g., Firestore).
    // For now, we'll just show a success message.
    console.log("Saving permissions:", permissions);
    toast({
        title: "Permissions Saved",
        description: "User group permissions have been updated.",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups & Permissions</CardTitle>
        <CardDescription>
          Configure the permissions for each user role in the system.
        </CardDescription>
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
                            <PermissionCheckbox checked={p.view} onCheckedChange={(val) => handlePermissionChange(role as User['role'], p.module, 'view', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.create} onCheckedChange={(val) => handlePermissionChange(role as User['role'], p.module, 'create', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.edit} onCheckedChange={(val) => handlePermissionChange(role as User['role'], p.module, 'edit', val)} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                            <PermissionCheckbox checked={p.delete} onCheckedChange={(val) => handlePermissionChange(role as User['role'], p.module, 'delete', val)} />
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
      </CardContent>
    </Card>
  );
}
