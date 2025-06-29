import type { PredefinedChecklistItem } from '@/types';

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

export const mockPredefinedChecklistItems: PredefinedChecklistItem[] = [
  { id: 'pcl-1', text: 'PPE Compliance' },
  { id: 'pcl-2', text: 'Machine Guarding' },
  { id: 'pcl-3', text: 'Housekeeping & Slip/Trip Hazards' },
  { id: 'pcl-4', text: 'Fire Extinguisher Accessibility' },
  { id: 'pcl-5', text: 'Emergency E-Stops Clear' },
];

// Note: This mock data is used by the JSA and Hot Work pages,
// which still use local state.
// To make them persistent, they should be moved to Firestore
// and managed through AppDataContext like the other data types.
export { mockJSAs, mockHotWorkPermits, mockAreas } from '@/lib/mockDataLocal';
