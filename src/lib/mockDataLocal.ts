// This file contains mock data that is still used for local component state,
// separate from the main Firestore data context.

import type { JSA, HotWorkPermit, Area } from '@/types';
import { subDays, formatISO } from 'date-fns';

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
