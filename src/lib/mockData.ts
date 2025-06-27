import type { Incident, Observation, Audit, CorrectiveAction, SafetyDoc, Area, ComplianceRecord, JSA } from '@/types';
import { subDays, formatISO } from 'date-fns';

export const mockIncidents: Incident[] = [
  { incident_id: 'INC001', date: formatISO(subDays(new Date(), 5)), area: 'Assembly Line 1', description: 'Minor slip on wet floor, no injury.', severity: 'Low', linked_docs: ['doc001.pdf'] },
  { incident_id: 'INC002', date: formatISO(subDays(new Date(), 25)), area: 'Warehouse', description: 'Forklift collision with racking.', severity: 'Medium', linked_docs: ['doc002.pdf'] },
  { incident_id: 'INC003', date: formatISO(subDays(new Date(), 60)), area: 'Welding Station', description: 'Improper PPE usage, resulted in minor burns.', severity: 'High', linked_docs: [] },
  { incident_id: 'INC004', date: formatISO(subDays(new Date(), 90)), area: 'Packaging', description: 'Repetitive strain injury reported.', severity: 'Medium', linked_docs: [] },
  { incident_id: 'INC005', date: formatISO(subDays(new Date(), 120)), area: 'Assembly Line 2', description: 'Faulty guard on machine X.', severity: 'Low', linked_docs: ['doc005.pdf'] },
];

export const mockObservations: Observation[] = [
  { observation_id: 'OBS001', submitted_by: 'John Doe', date: formatISO(subDays(new Date(), 2)), location: 'Assembly Line 1', description: 'Emergency exit blocked by pallets.', status: 'Open', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Safety Concern', risk_level: 3, actions: 'Pallets to be moved immediately. Area to be inspected daily.', unsafe_category: 'Unsafe Condition', person_involved: 'Warehouse Staff' },
  { observation_id: 'OBS002', submitted_by: 'Emily Jones', date: formatISO(subDays(new Date(), 10)), location: 'Warehouse', description: 'Fire extinguisher needs inspection. Tag is expired.', status: 'Open', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Safety Concern', risk_level: 2, actions: 'Scheduled for inspection by EOD.', unsafe_category: 'Unsafe Condition' },
  { observation_id: 'OBS003', submitted_by: 'John Doe', date: formatISO(subDays(new Date(), 15)), location: 'Welding Station', description: 'Excellent housekeeping observed. Clear walkways and properly stored materials.', status: 'Closed', report_type: 'Positive Observation', risk_level: 1, actions: 'Acknowledged with team lead.', unsafe_category: 'N/A' },
  { observation_id: 'OBS004', submitted_by: 'Sarah Miller', date: formatISO(subDays(new Date(), 32)), location: 'Packaging', description: 'Employee seen running with scissors.', status: 'Closed', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Near Miss', risk_level: 4, actions: 'Employee coached on safe conduct. Review of tool handling procedures.', unsafe_category: 'Unsafe Behavior', person_involved: 'Mark Johnson' },
];

export const mockAudits: Audit[] = [
  { audit_id: 'AUD001', auditor: 'Safety Team', date: formatISO(subDays(new Date(), 7)), checklist_items: [{ item: 'PPE Compliance', checked: true }, { item: 'Machine Guarding', checked: false }], status: 'Completed', assigned_actions: ['ACT001'], schedule: '2023-10-15' },
  { audit_id: 'AUD002', auditor: 'External Auditor', date: formatISO(subDays(new Date(), 45)), checklist_items: [{ item: 'Lockout/Tagout Procedures', checked: true }], status: 'Completed', assigned_actions: [], schedule: '2023-09-01' },
  { audit_id: 'AUD003', auditor: 'Safety Team', date: formatISO(new Date()), checklist_items: [], status: 'In Progress', assigned_actions: [], schedule: '2023-11-01' },
];

export const mockCorrectiveActions: CorrectiveAction[] = [
  { action_id: 'ACT001', related_to_incident: 'INC003', due_date: formatISO(new Date()), status: 'In Progress', responsible_person: 'Facility Manager', description: 'Review and reinforce PPE policy at Welding Station.' },
  { action_id: 'ACT002', related_to_observation: 'OBS001', due_date: formatISO(subDays(new Date(), -5)), status: 'Pending', responsible_person: 'Warehouse Supervisor', description: 'Clear pallets from emergency exit path.' },
  { action_id: 'ACT003', related_to_observation: 'OBS002', due_date: formatISO(new Date()), status: 'Completed', responsible_person: 'Maintenance Head', description: 'Inspect and certify all fire extinguishers.' },
  { action_id: 'ACT004', due_date: formatISO(subDays(new Date(), 5)), status: 'Overdue', responsible_person: 'Area Supervisor', description: 'Repaint floor markings in packaging area.' },
];

export const mockSafetyDocs: SafetyDoc[] = [
  { doc_id: 'DOC001', title: 'General Safety Policy', category: 'Policy', file_url: '/docs/safety-policy.pdf', related_modules: ['All'] },
  { doc_id: 'DOC002', title: 'Forklift Operation Procedure', category: 'Procedure', file_url: '/docs/forklift-procedure.pdf', related_modules: ['Warehouse'] },
  { doc_id: 'DOC003', title: 'Incident Report Form', category: 'Form', file_url: '/docs/incident-form.pdf', related_modules: ['Incidents'] },
  { doc_id: 'DOC004', title: 'Working at Heights Training', category: 'Training Material', file_url: '/docs/heights-training.pdf', related_modules: ['Compliance'] },
];

export const mockAreas: Area[] = [
  {
    area_id: 'AREA_HT',
    name: 'Heat Treatment',
    machines: [],
    children: [
      {
        area_id: 'AREA_HT_L1',
        name: 'Line 1',
        machines: ['Furnace 1'],
        children: [
          {
            area_id: 'AREA_HT_L1_OPX',
            name: 'Operation X',
            machines: ['Control Panel X'],
            children: [
              {
                area_id: 'AREA_HT_L1_OPX_BLA',
                name: 'bla bla',
                machines: ['Sensor bla'],
              },
            ],
          },
        ],
      },
      {
        area_id: 'AREA_HT_L2',
        name: 'Line 2',
        machines: ['Furnace 2'],
      },
    ],
  },
  { area_id: 'AREA01', name: 'Assembly Line 1', machines: ['Conveyor Belt A', 'Press Machine 3'] },
  { area_id: 'AREA02', name: 'Warehouse', machines: ['Forklift 1', 'Forklift 2', 'Pallet Wrapper'] },
  { area_id: 'AREA03', name: 'Welding Station', machines: ['Welder A', 'Welder B'] },
  { area_id: 'AREA04', name: 'Packaging', machines: ['Box Sealer 1', 'Label Printer 2'] },
];

export const mockComplianceRecords: ComplianceRecord[] = [
  { employee_id: 'EMP001', name: 'John Doe', training_completed: [{ course: 'Fire Safety', date: '2023-01-15' }, { course: 'First Aid', date: '2022-06-20' }], cert_renewals_due: '2024-06-20', next_review_date: '2024-01-01' },
  { employee_id: 'EMP002', name: 'Jane Smith', training_completed: [{ course: 'Fire Safety', date: '2023-01-15' }], cert_renewals_due: 'N/A', next_review_date: '2024-02-15' },
  { employee_id: 'EMP003', name: 'Mike Brown', training_completed: [{ course: 'Forklift Certified', date: '2022-11-10' }], cert_renewals_due: '2024-11-10', next_review_date: '2023-12-10' },
];

export const mockJSAs: JSA[] = [
  {
    jsa_id: 'JSA001',
    title: 'Forklift Operation and Battery Changeout',
    job_description: 'Operating a forklift to move materials within the warehouse and performing battery changeouts as needed.',
    required_ppe: ['High-visibility vest', 'Steel-toed boots', 'Safety glasses', 'Acid-resistant gloves'],
    steps: [
      {
        step_description: 'Pre-operation inspection of forklift.',
        hazards: ['Mechanical failure', 'Hydraulic leaks', 'Damaged tires'],
        controls: ['Follow daily inspection checklist', 'Do not operate if faults are found', 'Report any issues to supervisor immediately'],
      },
      {
        step_description: 'Driving and maneuvering the forklift.',
        hazards: ['Collisions with pedestrians or structures', 'Tip-overs', 'Falling loads'],
        controls: ['Maintain safe speed', 'Sound horn at intersections', 'Keep forks low when traveling', 'Ensure load is stable and secure'],
      },
      {
        step_description: 'Battery changeout procedure.',
        hazards: ['Acid splash', 'Electrical shock', 'Crushing injury from battery'],
        controls: ['Wear required PPE (gloves, glasses)', 'Use designated lifting equipment', 'Ensure charging area is well-ventilated', 'Follow lockout/tagout procedure'],
      }
    ],
    created_by: 'Safety Team',
    created_date: formatISO(subDays(new Date(), 20)),
    signatures: [
      { employee_name: 'John Doe', sign_date: formatISO(subDays(new Date(), 19)) },
      { employee_name: 'Jane Smith', sign_date: formatISO(subDays(new Date(), 18)) },
    ],
  },
  {
    jsa_id: 'JSA002',
    title: 'Welding in Designated Area',
    job_description: 'Performing standard welding tasks on steel components within the designated welding station.',
    required_ppe: ['Welding helmet', 'Flame-resistant jacket', 'Leather gloves', 'Respirator'],
    steps: [
      {
        step_description: 'Area preparation.',
        hazards: ['Fire from sparks', 'Combustible materials nearby'],
        controls: ['Clear a 35-foot radius of all flammable materials', 'Have a fire extinguisher readily available', 'Use welding screens to contain sparks'],
      },
      {
        step_description: 'Equipment setup and inspection.',
        hazards: ['Electric shock', 'Damaged cables'],
        controls: ['Inspect all cables and connections before starting', 'Ensure proper grounding of welding machine'],
      },
    ],
    created_by: 'Welding Supervisor',
    created_date: formatISO(subDays(new Date(), 45)),
    signatures: [],
  },
];


export const mockObservationsByMonth = [
    { name: 'Jan', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Feb', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Mar', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Apr', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'May', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Jun', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Jul', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Aug', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Sep', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Oct', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Nov', total: Math.floor(Math.random() * 30) + 10 },
    { name: 'Dec', total: Math.floor(Math.random() * 30) + 10 },
];
  
export const mockObservationStatus = [
    { name: 'Open', value: mockObservations.filter(obs => obs.status === 'Open').length, fill: 'var(--color-open)' },
    { name: 'Closed', value: mockObservations.filter(obs => obs.status === 'Closed').length, fill: 'var(--color-closed)' },
];
