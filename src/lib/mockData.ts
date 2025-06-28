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

// Mock data for UI development where real data is not yet available or needed
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

// Note: This is now just for calculating the initial pie chart state.
// The actual data comes from the `observations` state in AppDataContext.
export const mockObservationStatus = [
    { name: 'Open', value: 4, fill: 'var(--color-open)' },
    { name: 'Closed', value: 2, fill: 'var(--color-closed)' },
];

// Note: This mock data is used by the JSA and Hot Work pages,
// which still use local state.
// To make them persistent, they should be moved to Firestore
// and managed through AppDataContext like the other data types.
export { mockJSAs, mockHotWorkPermits, mockAreas } from '@/lib/mockDataLocal';
