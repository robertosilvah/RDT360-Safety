
'use client';

import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

const dataModel = [
  { 
    name: 'Incidents', 
    description: 'Logs all safety incidents and accidents. This is a core collection.',
    relations: [
      { to: 'Investigations', text: 'An incident can have one investigation.' },
      { to: 'Corrective Actions', text: 'Can have multiple corrective actions linked to it.' }
    ]
  },
  { 
    name: 'Investigations', 
    description: 'Holds detailed analyses of incidents, including root cause and contributing factors.',
    relations: [
      { to: 'Incidents', text: 'Is always linked to one specific incident.' },
      { to: 'Corrective Actions', text: 'Can generate multiple corrective actions.' }
    ]
  },
  { 
    name: 'Observations', 
    description: 'Records safety observations from the field, which can be positive, negative, or near-misses.',
    relations: [
      { to: 'Corrective Actions', text: 'Can have one corrective action linked directly upon creation.' },
      { to: 'Safety Walks', text: 'Can be generated as part of a safety walk.' }
    ]
  },
  { 
    name: 'Safety Walks', 
    description: 'Records the results of scheduled safety audits or walks, including checklist items.',
    relations: [
      { to: 'Predefined Checklist Items', text: 'Uses items from this collection to build its checklist.' },
      { to: 'Observations', text: 'Can generate observations from failed checklist items.' }
    ]
  },
  { 
    name: 'Corrective Actions', 
    description: 'Tracks all corrective and preventive actions assigned to users. This is a central collection that links to many others.',
    relations: [
      { to: 'Incidents', text: 'Can be linked to an incident.' },
      { to: 'Observations', text: 'Can be linked to an observation.' },
      { to: 'Investigations', text: 'Can be linked to an investigation.' },
      { to: 'Forklift Inspections', text: 'Can be linked to a failed forklift inspection item.' }
    ]
  },
  {
    name: 'Users',
    description: 'Manages user accounts, roles (Administrator, Manager, etc.), and their approval status.',
    relations: []
  },
  {
    name: 'Areas',
    description: 'Defines the physical or functional areas of the facility in a hierarchical structure.',
    relations: [
        { to: 'JSAs', text: 'A JSA is performed in a specific area.'},
        { to: 'Hot Work Permits', text: 'Permits are issued for a specific area.'},
    ]
  },
  {
    name: 'Compliance Records',
    description: 'Manages employee training history and certification renewal dates.',
    relations: [
        { to: 'Users', text: 'Each record is tied to a specific user.'}
    ]
  },
  {
    name: 'JSAs (Job Safety Analyses)',
    description: 'Contains detailed safety procedures for specific jobs, including steps, hazards, and controls.',
    relations: [
        { to: 'Areas', text: 'Linked to the area where the job is performed.'}
    ]
  },
  {
    name: 'Forklifts',
    description: 'A list of all forklift assets in the fleet.',
    relations: [
        { to: 'Forklift Inspections', text: 'Each inspection is for a specific forklift.'}
    ]
  },
  {
    name: 'Forklift Inspections',
    description: 'Logs the results of daily pre-use forklift safety checklists.',
    relations: [
        { to: 'Corrective Actions', text: 'Failed items can generate corrective actions.'}
    ]
  },
  {
    name: 'Hot Work & Confined Space Permits',
    description: 'Manages high-risk work permits. Both follow a similar structure of draft, issuance, and closure.',
    relations: [
        { to: 'Areas', text: 'Permits are issued for a specific area.'}
    ]
  },
  {
    name: 'Safety Docs',
    description: 'A central repository for documents like policies, procedures, and forms.',
    relations: []
  },
  {
    name: 'Predefined Checklist Items',
    description: 'A master list of reusable questions for Safety Walks.',
    relations: [
        { to: 'Safety Walks', text: 'These items are used to populate the checklists in safety walks.'}
    ]
  },
  {
    name: 'Settings',
    description: 'An internal collection to store application-wide settings like branding and upload limits.',
    relations: []
  }
];

export default function HelpPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Data Model Help</h2>
                <p className="text-muted-foreground">
                    An overview of the application's data collections (tables) and their relationships.
                </p>
            </div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {dataModel.map(collection => (
                <Card key={collection.name} className="flex flex-col">
                    <CardHeader>
                        <CardTitle>{collection.name}</CardTitle>
                        <CardDescription>{collection.description}</CardDescription>
                    </CardHeader>
                    {collection.relations.length > 0 && (
                        <CardContent className="flex-1">
                            <h4 className="font-semibold text-sm mb-2">Relationships:</h4>
                            <ul className="space-y-2">
                                {collection.relations.map(rel => (
                                    <li key={rel.to} className="flex items-start text-sm">
                                        <ArrowRight className="h-4 w-4 mr-2 mt-1 text-primary flex-shrink-0" />
                                        <span>
                                            <strong className="font-medium">{rel.to}:</strong> {rel.text}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    )}
                </Card>
            ))}
        </div>
      </div>
    </AppShell>
  );
}
