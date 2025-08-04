
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/types';

type Permission = {
  module: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
};

const permissionsByRole: Record<User['role'], Permission[]> = {
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

const PermissionIcon = ({ granted }: { granted: boolean }) => {
  return granted ? (
    <CheckCircle2 className="h-5 w-5 text-green-500" />
  ) : (
    <XCircle className="h-5 w-5 text-red-500" />
  );
};

export default function GroupsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Groups & Permissions</CardTitle>
        <CardDescription>
          Review the permissions for each user role in the system. This page is currently read-only.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {Object.entries(permissionsByRole).map(([role, permissions]) => (
            <AccordionItem value={role} key={role}>
              <AccordionTrigger>
                <div className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  <span className="font-semibold">{role}</span>
                  <Badge variant="outline">{permissions.length} Modules</Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Module</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">View</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Create</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Edit</th>
                        <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {permissions.map((p) => (
                        <tr key={p.module}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{p.module}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex justify-center"><PermissionIcon granted={p.view} /></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"><PermissionIcon granted={p.create} /></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"><PermissionIcon granted={p.edit} /></td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"><PermissionIcon granted={p.delete} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}
