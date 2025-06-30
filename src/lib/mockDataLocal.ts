// This file contains mock data that is still used for local component state,
// separate from the main Firestore data context.

import type { Area } from '@/types';

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
