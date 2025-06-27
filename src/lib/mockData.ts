import type { Incident, Observation, SafetyWalk, CorrectiveAction, SafetyDoc, Area, ComplianceRecord, JSA, HotWorkPermit, Comment, ForkliftInspection } from '@/types';
import { subDays, formatISO, subHours } from 'date-fns';

const mockUser = "Safety Manager";

const mockComments: Comment[] = [
    { user: 'John Doe', comment: 'Initial review complete.', date: formatISO(subDays(new Date(), 2)) },
    { user: 'Jane Smith', comment: 'Follow-up needed with maintenance.', date: formatISO(subDays(new Date(), 1)) },
];

export const mockIncidents: Incident[] = [
  { incident_id: 'INC001', date: formatISO(subDays(new Date(), 5)), area: 'Assembly Line 1', description: 'Minor slip on wet floor, no injury.', severity: 'Low', linked_docs: ['doc001.pdf'], status: 'Closed', assigned_to: 'John Doe', comments: [{user: 'Safety Team', comment: 'Area cleaned and "Wet Floor" sign placed. Resolved.', date: formatISO(subDays(new Date(), 4))}] },
  { incident_id: 'INC002', date: formatISO(subDays(new Date(), 25)), area: 'Warehouse', description: 'Forklift collision with racking. Minor damage to rack, no product loss.', severity: 'Medium', linked_docs: ['doc002.pdf'], status: 'Under Investigation', assigned_to: 'Sarah Miller', comments: [{user: 'Sarah Miller', comment: 'Assessing rack stability. Forklift driver has been interviewed.', date: formatISO(subDays(new Date(), 24))}] },
  { incident_id: 'INC003', date: formatISO(subDays(new Date(), 60)), area: 'Welding Station', description: 'Improper PPE usage (no face shield) by a contractor, resulted in minor flash burn.', severity: 'High', linked_docs: [], status: 'Closed', assigned_to: 'Safety Manager', comments: [{user: 'Safety Manager', comment: 'Contractor removed from site. Re-briefing on PPE for all contractors scheduled.', date: formatISO(subDays(new Date(), 59))}, {user: 'Safety Manager', comment: 'Corrective action ACT001 created.', date: formatISO(subDays(new Date(), 59))}] },
  { incident_id: 'INC004', date: formatISO(subDays(new Date(), 90)), area: 'Packaging', description: 'Repetitive strain injury reported by an employee working on the palletizer.', severity: 'Medium', linked_docs: [], status: 'Open', comments: [] },
  { incident_id: 'INC005', date: formatISO(subDays(new Date(), 120)), area: 'Assembly Line 2', description: 'Faulty guard on machine X, discovered during routine check. No incident occurred.', severity: 'Low', linked_docs: ['doc005.pdf'], status: 'Closed', assigned_to: 'Maintenance Team', comments: [{user: 'Maintenance Team', comment: 'Guard has been repaired and tested.', date: formatISO(subDays(new Date(), 119))}]},
];

export const mockObservations: Observation[] = [
  { observation_id: 'OBS001', submitted_by: 'John Doe', date: formatISO(subDays(new Date(), 2)), areaId: 'AREA01', description: 'Emergency exit blocked by pallets.', status: 'Open', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Safety Concern', risk_level: 3, actions: 'Pallets to be moved immediately. Area to be inspected daily.', unsafe_category: 'Unsafe Condition', person_involved: 'Warehouse Staff', safety_walk_id: 'SWALK001' },
  { observation_id: 'OBS002', submitted_by: 'Emily Jones', date: formatISO(subDays(new Date(), 10)), areaId: 'AREA02', description: 'Fire extinguisher needs inspection. Tag is expired.', status: 'Open', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Safety Concern', risk_level: 2, actions: 'Scheduled for inspection by EOD.', unsafe_category: 'Unsafe Condition' },
  { observation_id: 'OBS003', submitted_by: 'John Doe', date: formatISO(subDays(new Date(), 15)), areaId: 'AREA03', description: 'Excellent housekeeping observed. Clear walkways and properly stored materials.', status: 'Closed', report_type: 'Positive Observation', risk_level: 1, actions: 'Acknowledged with team lead.', unsafe_category: 'N/A' },
  { observation_id: 'OBS004', submitted_by: 'Sarah Miller', date: formatISO(subDays(new Date(), 32)), areaId: 'AREA04', description: 'Employee seen running with scissors.', status: 'Closed', imageUrl: 'https://placehold.co/600x400.png', report_type: 'Near Miss', risk_level: 4, actions: 'Employee coached on safe conduct. Review of tool handling procedures.', unsafe_category: 'Unsafe Behavior', person_involved: 'Mark Johnson' },
];

export const mockSafetyWalks: SafetyWalk[] = [
  { safety_walk_id: 'SWALK001', walker: 'Safety Team', date: formatISO(subDays(new Date(), 7)), checklist_items: [{ item: 'PPE Compliance', checked: true }, { item: 'Machine Guarding', checked: true }, { item: 'E-Stops Accessible', checked: true}], status: 'Completed', comments: [] },
  { safety_walk_id: 'SWALK002', walker: 'External Consultant', date: formatISO(subDays(new Date(), 45)), checklist_items: [{ item: 'Lockout/Tagout Procedures', checked: true }], status: 'Completed', comments: [] },
  { safety_walk_id: 'SWALK003', walker: 'Safety Team', date: formatISO(new Date()), checklist_items: [{ item: 'Housekeeping', checked: true }, {item: 'Chemical Storage', checked: false}], status: 'In Progress', comments: [] },
];


export const mockCorrectiveActions: CorrectiveAction[] = [
  { action_id: 'ACT001', related_to_incident: 'INC003', due_date: formatISO(new Date()), status: 'In Progress', responsible_person: 'Facility Manager', description: 'Review and reinforce PPE policy at Welding Station.', comments: [{user: 'Facility Manager', comment: 'Welding team has been retrained.', date: formatISO(subDays(new Date(), 1))}] },
  { action_id: 'ACT002', related_to_observation: 'OBS001', due_date: formatISO(subDays(new Date(), -5)), status: 'Pending', responsible_person: 'Warehouse Supervisor', description: 'Clear pallets from emergency exit path.', comments: [] },
  { action_id: 'ACT003', related_to_observation: 'OBS002', due_date: formatISO(new Date()), status: 'Completed', responsible_person: 'Maintenance Head', description: 'Inspect and certify all fire extinguishers.', comments: [{user: mockUser, comment: 'All extinguishers passed inspection.', date: formatISO(subDays(new Date(), 1))}]},
  { action_id: 'ACT004', due_date: formatISO(subDays(new Date(), 5)), status: 'Overdue', responsible_person: 'Area Supervisor', description: 'Repaint floor markings in packaging area.', comments: [{user: 'Area Supervisor', comment: 'Paint has been ordered, vendor delay.', date: formatISO(subDays(new Date(), 3))}] },
  { action_id: 'ACT-FL-001', related_to_forklift_inspection: 'FINSP-001-tires', due_date: new Date().toISOString(), status: 'Pending', responsible_person: 'Maintenance', description: 'Replace front left tire on Forklift FL-01.', comments: [] },
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
    areaId: 'AREA02',
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
    areaId: 'AREA03',
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


export const mockHotWorkPermits: HotWorkPermit[] = [
  {
    permit_id: 'HWP001',
    title: 'Welding on Support Beams - Section A',
    description: 'Repairing cracked support beams on the main assembly line platform.',
    areaId: 'AREA01',
    valid_from: new Date().toISOString(),
    valid_to: new Date(new Date().setHours(new Date().getHours() + 4)).toISOString(),
    precautions: [
      'Fire watch assigned for duration of work + 30 mins post-work.',
      'Area within 35-foot radius cleared of combustibles.',
      'Appropriate fire extinguisher (Type ABC) present and inspected.',
      'Welding curtains used to contain sparks.',
      'Atmosphere tested for flammable gases.',
    ],
    created_by: 'Safety Manager',
    created_date: formatISO(subDays(new Date(), 1)),
    signatures: [
      { employee_name: 'Mike Brown', sign_date: formatISO(new Date()) },
    ],
  },
  {
    permit_id: 'HWP002',
    title: 'Grinding Rusty Railing - Warehouse Entrance',
    description: 'Using an angle grinder to remove rust from the main warehouse entrance handrail before painting.',
    areaId: 'AREA02',
    valid_from: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    valid_to: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    precautions: [
        'Area within 35-foot radius cleared of combustibles.',
        'Appropriate fire extinguisher (Type ABC) present and inspected.',
        'Sparks contained with non-combustible shields.',
    ],
    created_by: 'Facility Manager',
    created_date: formatISO(new Date()),
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

export const mockForklifts = [
    { id: 'FL-01', name: 'Hyster 5000lb', area: 'Warehouse' },
    { id: 'FL-02', name: 'Toyota Electric', area: 'Warehouse' },
    { id: 'FL-03', name: 'Crown Reach Truck', area: 'Assembly Line 1' },
];

export const FORKLIFT_CHECKLIST_QUESTIONS: { id: string, question: string }[] = [
    { id: 'horn', question: 'Horn operational?' },
    { id: 'brakes', question: 'Brakes function correctly?' },
    { id: 'tires', question: 'Tires in good condition (no major cuts or wear)?' },
    { id: 'forks', question: 'Forks and mast in good condition (no cracks, bends)?' },
    { id: 'lights', question: 'Headlights, taillights, and warning lights working?' },
    { id: 'seatbelt', question: 'Seatbelt functional and in good condition?' },
    { id: 'leaks', question: 'No visible hydraulic, fuel, or oil leaks?' },
    { id: 'battery', question: 'Battery charged and connectors are clean?' },
];

export const mockForkliftInspections: ForkliftInspection[] = [
    {
        inspection_id: 'FINSP-001',
        forklift_id: 'FL-01',
        operator_name: 'John Doe',
        date: subDays(new Date(), 1).toISOString(),
        checklist: [
            { id: 'horn', question: 'Horn operational?', status: 'Pass' },
            { id: 'brakes', question: 'Brakes function correctly?', status: 'Pass' },
            { id: 'tires', question: 'Tires in good condition (no major cuts or wear)?', status: 'Fail', comment: 'Large gash in front left tire.', actionId: 'ACT-FL-001' },
            { id: 'forks', question: 'Forks and mast in good condition (no cracks, bends)?', status: 'Pass' },
            { id: 'lights', question: 'Headlights, taillights, and warning lights working?', status: 'Pass' },
            { id: 'seatbelt', question: 'Seatbelt functional and in good condition?', status: 'Pass' },
            { id: 'leaks', question: 'No visible hydraulic, fuel, or oil leaks?', status: 'Pass' },
            { id: 'battery', question: 'Battery charged and connectors are clean?', status: 'Pass' },
        ]
    }
];
