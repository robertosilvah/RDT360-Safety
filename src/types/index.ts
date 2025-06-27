export type Incident = {
  incident_id: string;
  date: string;
  area: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High';
  linked_docs: string[];
};

export type Observation = {
  observation_id: string;
  submitted_by: string;
  date: string;
  location: string;
  details: string;
  status: 'Open' | 'Closed';
  assigned_to: string;
};

export type Audit = {
  audit_id: string;
  auditor: string;
  date: string;
  checklist_items: { item: string; checked: boolean }[];
  status: 'Scheduled' | 'In Progress' | 'Completed';
  assigned_actions: string[];
  schedule: string;
};

export type CorrectiveAction = {
  action_id: string;
  related_to_incident?: string;
  related_to_observation?: string;
  due_date: string;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Overdue';
  responsible_person: string;
  description: string;
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
};

export type ComplianceRecord = {
  employee_id: string;
  name: string;
  training_completed: { course: string; date: string }[];
  cert_renewals_due: string;
  next_review_date: string;
};
