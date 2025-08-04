
export type WorkHoursLog = {
  id: string;
  log_date: string;
  hours_worked: number;
  notes?: string;
}

export type Comment = {
  user: string;
  comment: string;
  date: string;
};

export type Investigation = {
  investigation_id: string;
  display_id: string;
  incident_id: string;
  status: 'Open' | 'In Progress' | 'Closed';
  root_cause: string;
  contributing_factors: string;
  events_history: string;
  lessons_learned: string;
  action_plan: string;
  documents: { name: string; url: string }[];
  comments: Comment[];
};

export type IncidentData = Omit<Incident, 'incident_id' | 'display_id' | 'linked_docs' | 'comments' | 'investigation_id' | 'status'>;

export type Incident = {
  incident_id: string;
  display_id: string;
  date: string;
  area: string;
  type: 'Incident' | 'Accident';
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  reported_by: string;
  linked_docs: string[];
  status: 'Open' | 'Under Investigation' | 'Closed';
  assigned_to?: string;
  comments: Comment[];
  investigation_id?: string;
};

export type Observation = {
  observation_id: string;
  display_id: string;
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

export type SafetyWalkChecklistItem = {
  item: string;
  status: 'Pass' | 'Fail' | 'N/A' | 'Pending';
  comment?: string;
};

export type SafetyWalk = {
  safety_walk_id: string;
  display_id: string;
  walker: string;
  date: string;
  checklist_items: SafetyWalkChecklistItem[];
  status: 'Scheduled' | 'In Progress' | 'Completed';
  comments: Comment[];
  people_involved?: string;
  safety_feeling_scale?: number;
};

export type CorrectiveAction = {
  action_id: string;
  display_id: string;
  related_to_incident?: string;
  related_to_observation?: string;
  related_to_forklift_inspection?: string;
  related_to_investigation?: string;
  due_date: string;
  created_date: string;
  completion_date?: string;
  type: 'Preventive' | 'Reactive' | 'Other';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  responsible_person: string;
  description: string;
  comments: Comment[];
};

export type SafetyDoc = {
  doc_id: string;
  display_id: string;
  title: string;
  category: 'Policy' | 'Procedure' | 'Form' | 'Training Material';
  file_url: string;
  related_modules: string[];
};

export type Area = {
  area_id: string;
  name: string;
  machines: string[];
  parentId?: string;
  children?: Area[];
};

export type ComplianceRecord = {
  employee_id: string;
  display_id: string;
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
  display_id: string;
  title: string;
  job_description: string;
  areaId: string;
  required_ppe: string[];
  steps: JsaStep[];
  created_by: string;
  created_date: string;
  valid_from: string;
  valid_to: string;
  status: 'Active' | 'Expired' | 'Draft';
  signatures: { employee_name: string; sign_date: string }[];
};

export type ChecklistStatus = 'Yes' | 'No' | 'N/A';

export type HotWorkPermitChecklist = {
  fire_extinguisher: ChecklistStatus;
  equipment_good_repair: ChecklistStatus;
  energy_locked_out: ChecklistStatus;
  flammables_removed: ChecklistStatus;
  floors_swept: ChecklistStatus;
  fire_resistive_covers: ChecklistStatus;
  openings_covered: ChecklistStatus;
  walls_ceilings_protected: ChecklistStatus;
  adequate_ventilation: ChecklistStatus;
  atmosphere_checked: ChecklistStatus;
  vapors_purged: ChecklistStatus;
  confined_space_permit: ChecklistStatus;
  fire_watch_provided: 'Yes' | 'No';
};

export type HotWorkPermit = {
  permit_id: string;
  display_id: string;
  status: 'Active' | 'Expired' | 'Closed' | 'Draft' | 'Denied';
  supervisor: string;
  performed_by_type: 'RDT Employee' | 'Contractor';
  areaId: string;
  locationName: string;
  work_to_be_performed_by: string;
  permit_expires: string; 
  work_complete?: string; 
  final_check?: string; 
  special_instructions?: string;
  fire_watch_required: 'Yes' | 'No';
  checklist: HotWorkPermitChecklist;
  created_date: string;
  supervisor_signature?: { name: string; date: string };
  employee_signature?: { name: string; date: string };
  final_supervisor_signature?: { name: string; date: string };
  comments: Comment[];
};

export type ConfinedSpacePermitChecklist = {
  isolation_and_blinding_complete: ChecklistStatus;
  cleaning_and_purging_complete: ChecklistStatus;
  ventilation_adequate: ChecklistStatus;
  standby_person_present: ChecklistStatus;
  rescue_equipment_ready: ChecklistStatus;
  communication_established: ChecklistStatus;
  atmospheric_testing_ok: 'Yes' | 'No';
  oxygen_level: string; // e.g., "20.9%"
  combustible_gases_level: string; // e.g., "<10% LEL"
  toxic_gases_level: string; // e.g., "0 ppm H2S"
};

export type ConfinedSpacePermit = {
  permit_id: string;
  display_id: string;
  status: 'Active' | 'Expired' | 'Closed' | 'Draft' | 'Denied';
  supervisor: string;
  entrants: string; // Comma-separated
  areaId: string;
  locationName: string;
  work_description: string;
  permit_expires: string;
  work_complete?: string;
  final_check?: string;
  special_instructions?: string;
  checklist: ConfinedSpacePermitChecklist;
  created_date: string;
  supervisor_signature?: { name: string; date: string };
  entrant_signature?: { name: string; date: string };
  final_supervisor_signature?: { name: string; date: string };
  comments: Comment[];
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
  display_id: string;
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

export type PredefinedChecklistItem = {
  id: string;
  text: string;
};

export type BrandingSettings = {
  logoUrl: string;
};

export type UploadSettings = {
  imageMaxSizeMB: number;
  docMaxSizeMB: number;
};
