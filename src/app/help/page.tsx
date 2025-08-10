
'use client';

import { AppShell } from '@/components/AppShell';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight, Database } from 'lucide-react';
import { CodeBlock } from '@/components/CodeBlock';

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
    name: 'Toolbox Talks',
    description: 'Manages toolbox safety talks, including topics, dates, leaders, and attendance.',
    relations: [
      { to: 'Users', text: 'Talks are assigned to specific users for attendance.' },
      { to: 'Toolbox Signatures', text: 'Each talk has multiple signatures from attendees.' },
    ]
  },
  {
    name: 'Work Hours Log',
    description: 'Stores logs of total person-hours worked over specific periods, used for calculating safety metrics.',
    relations: []
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

const sqlSchema = `
-- Nota: Estos esquemas son una representación para una base de datos relacional como MariaDB.
-- Los tipos de datos como JSON son útiles para campos con estructuras flexibles (arrays, objetos).

CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('Administrator', 'Manager', 'Operator', 'Maintenance', 'HR') NOT NULL,
    status ENUM('Active', 'Pending') NOT NULL
);

CREATE TABLE areas (
    area_id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    machines JSON, -- Almacena un array de strings
    parentId VARCHAR(255),
    FOREIGN KEY (parentId) REFERENCES areas(area_id) ON DELETE SET NULL
);

CREATE TABLE incidents (
    incident_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    date TIMESTAMP NOT NULL,
    area VARCHAR(255),
    type ENUM('Incident', 'Accident') NOT NULL,
    description TEXT,
    severity ENUM('Low', 'Medium', 'High') NOT NULL,
    reported_by VARCHAR(255),
    status ENUM('Open', 'Under Investigation', 'Closed') NOT NULL,
    assigned_to VARCHAR(255),
    investigation_id VARCHAR(255) UNIQUE,
    FOREIGN KEY (investigation_id) REFERENCES investigations(investigation_id)
);

CREATE TABLE investigations (
    investigation_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    incident_id VARCHAR(255) NOT NULL,
    status ENUM('Open', 'In Progress', 'Closed') NOT NULL,
    root_cause TEXT,
    contributing_factors TEXT,
    events_history TEXT,
    lessons_learned TEXT,
    action_plan TEXT,
    documents JSON, -- Almacena array de {name, url}
    comments JSON, -- Almacena array de {user, comment, date}
    FOREIGN KEY (incident_id) REFERENCES incidents(incident_id) ON DELETE CASCADE
);

CREATE TABLE observations (
    observation_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    report_type ENUM('Safety Concern', 'Positive Observation', 'Near Miss') NOT NULL,
    submitted_by VARCHAR(255),
    date TIMESTAMP NOT NULL,
    areaId VARCHAR(255),
    person_involved VARCHAR(255),
    risk_level INT,
    description TEXT,
    actions TEXT,
    unsafe_category ENUM('Unsafe Behavior', 'Unsafe Condition', 'N/A'),
    status ENUM('Open', 'Closed') NOT NULL,
    imageUrl VARCHAR(2048),
    safety_walk_id VARCHAR(255),
    FOREIGN KEY (areaId) REFERENCES areas(area_id) ON DELETE SET NULL,
    FOREIGN KEY (safety_walk_id) REFERENCES safety_walks(safety_walk_id)
);

CREATE TABLE corrective_actions (
    action_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    description TEXT,
    responsible_person VARCHAR(255),
    due_date TIMESTAMP,
    created_date TIMESTAMP,
    completion_date TIMESTAMP,
    status ENUM('Pending', 'In Progress', 'Completed', 'Overdue') NOT NULL,
    type ENUM('Preventive', 'Reactive', 'Other'),
    related_to_incident VARCHAR(255),
    related_to_observation VARCHAR(255),
    related_to_investigation VARCHAR(255),
    related_to_forklift_inspection VARCHAR(255),
    FOREIGN KEY (related_to_incident) REFERENCES incidents(incident_id),
    FOREIGN KEY (related_to_observation) REFERENCES observations(observation_id),
    FOREIGN KEY (related_to_investigation) REFERENCES investigations(investigation_id)
);

CREATE TABLE safety_walks (
    safety_walk_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    walker VARCHAR(255),
    date TIMESTAMP,
    status ENUM('Scheduled', 'In Progress', 'Completed'),
    people_involved VARCHAR(255),
    safety_feeling_scale INT,
    checklist_items JSON, -- Almacena array de {item, status, comment}
    comments JSON
);

CREATE TABLE jsas (
    jsa_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    job_description TEXT,
    areaId VARCHAR(255),
    required_ppe JSON,
    steps JSON, -- Almacena array de JsaStep
    created_by VARCHAR(255),
    created_date TIMESTAMP,
    valid_from TIMESTAMP,
    valid_to TIMESTAMP,
    status ENUM('Active', 'Expired', 'Draft'),
    signatures JSON, -- Almacena array de {employee_name, sign_date}
    FOREIGN KEY (areaId) REFERENCES areas(area_id)
);

CREATE TABLE toolbox_talks (
    id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    topic TEXT,
    title TEXT,
    date TIMESTAMP,
    leader VARCHAR(255),
    location VARCHAR(255),
    department VARCHAR(255),
    observations TEXT,
    accidents_near_misses JSON,
    unsafe_conditions JSON,
    corrections_changed_procedures JSON,
    special_ppe JSON,
    assigned_to JSON,
    attachments JSON
);

CREATE TABLE toolbox_signatures (
    id VARCHAR(255) PRIMARY KEY,
    toolbox_talk_id VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    signature_image_url TEXT,
    signed_at TIMESTAMP,
    FOREIGN KEY (toolbox_talk_id) REFERENCES toolbox_talks(id) ON DELETE CASCADE
);

-- Otras tablas importantes
CREATE TABLE safety_docs (
    doc_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    category VARCHAR(255),
    file_url VARCHAR(2048),
    related_modules JSON
);

CREATE TABLE compliance_records (
    employee_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    training_completed JSON,
    cert_renewals_due TIMESTAMP,
    next_review_date TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE forklifts (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255),
    area VARCHAR(255)
);

CREATE TABLE forklift_inspections (
    inspection_id VARCHAR(255) PRIMARY KEY,
    display_id VARCHAR(255) NOT NULL,
    forklift_id VARCHAR(255),
    operator_name VARCHAR(255),
    date TIMESTAMP,
    checklist JSON,
    FOREIGN KEY (forklift_id) REFERENCES forklifts(id)
);

CREATE TABLE work_hours (
    id VARCHAR(255) PRIMARY KEY,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    hours_worked INT,
    notes TEXT
);

CREATE TABLE predefined_checklist_items (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT
);

CREATE TABLE predefined_hazards (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT
);

CREATE TABLE predefined_controls (
    id VARCHAR(255) PRIMARY KEY,
    text TEXT,
    reference JSON
);
`;


export default function HelpPage() {
  return (
    <AppShell>
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Centro de Ayuda</h2>
                <p className="text-muted-foreground">
                    Un resumen del modelo de datos de la aplicación y el esquema SQL.
                </p>
            </div>
        </div>

        <div className="grid gap-6">
            <Card>
                <CardHeader>
                    <CardTitle>Modelo de Datos</CardTitle>
                    <CardDescription>Resumen de las colecciones de datos (tablas) y sus relaciones.</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {dataModel.map(collection => (
                        <Card key={collection.name} className="flex flex-col">
                            <CardHeader>
                                <CardTitle>{collection.name}</CardTitle>
                                <CardDescription>{collection.description}</CardDescription>
                            </CardHeader>
                            {collection.relations.length > 0 && (
                                <CardContent className="flex-1">
                                    <h4 className="font-semibold text-sm mb-2">Relaciones:</h4>
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
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Database /> Esquema de Base de Datos SQL</CardTitle>
                    <CardDescription>Utiliza estas sentencias <code>CREATE TABLE</code> para configurar una base de datos relacional compatible.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CodeBlock code={sqlSchema} />
                </CardContent>
            </Card>
        </div>
      </div>
    </AppShell>
  );
}
