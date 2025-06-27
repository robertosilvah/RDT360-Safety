export type Comment = {
  user: string;
  comment: string;
  date: string;
};

export type Incident = {
  incident_id: string;
  date: string;
  area: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  linked_docs: string[];
  status: 'Open' | 'Under Investigation' | 'Closed';
  assigned_to?: string;
  comments: Comment[];
};

export type Observation = {
  observation_id: string;
  report_type: 'Safety Concern' | 'Positive Observation' | 'Near Miss';
  submitted_by: string;
  date: string;
  areaId: string;
  person_involved?: string;
  risk_level: 1 | 2 | 3 | 4;
  description: string;
  actions: string;
  unsafe_category: 'Unsafe Behavior' | 'Unsafe Condition' | 'N/A';
  status: 'Open' | 'Closed';
  imageUrl?: string;
  safety_walk_id?: string;
};

export type SafetyWalk = {
  safety_walk_id: string;
  walker: string;
  date: string;
  checklist_items: { item: string; checked: boolean }[];
  status: 'Scheduled' | 'In Progress' | 'Completed';
  comments: Comment[];
  people_involved?: string;
  safety_feeling_scale?: number;
};

export type CorrectiveAction = {
  action_id: string;
  related_to_incident?: string;
  related_to_observation?: string;
  related_to_forklift_inspection?: string; // e.g., 'FINSP-001-tires'
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  responsible_person: string;
  description: string;
  comments: Comment[];
};

export type SafetyDoc = {
  doc_id: string;
  title: string;
  category: 'Policy' | 'Procedure' | 'Form' | 'Training Material';
  file_url: string;
  related_modules: string[];
};

export type Area = {
  area_id: string;
  name: string;
  machines: string[];
  children?: Area[];
};

export type ComplianceRecord = {
  employee_id: string;
  name: string;
  training_completed: { course: string; date: string }[];
  cert_renewals_due: string;
  next_review_date: string;
};

export type JsaStep = {
  step_description: string;
  hazards: string[];
  controls: string[];
};

export type JSA = {
  jsa_id: string;
  title: string;
  job_description: string;
  areaId: string;
  required_ppe: string[];
  steps: JsaStep[];
  created_by: string;
  created_date: string;
  signatures: { employee_name: string; sign_date: string }[];
};

export type HotWorkPermit = {
  permit_id: string;
  title: string;
  description: string;
  areaId: string;
  valid_from: string;
  valid_to: string;
  precautions: string[];
  created_by: string;
  created_date: string;
  signatures: { employee_name: string; sign_date: string }[];
};

export type Forklift = {
  id: string;
  name: string;
  area: string;
};

export type ForkliftChecklistItem = {
  id: string;
  question: string;
  status: 'Pass' | 'Fail' | 'N/A';
  comment?: string;
  actionId?: string;
};

export type ForkliftInspection = {
  inspection_id: string;
  forklift_id: string;
  operator_name: string;
  date: string;
  checklist: ForkliftChecklistItem[];
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: 'Administrator' | 'Manager' | 'Operator' | 'Maintenance' | 'HR';
  status: 'Active' | 'Pending';
};
