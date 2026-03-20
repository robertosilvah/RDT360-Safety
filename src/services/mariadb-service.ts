
// services/mariadb.js
// This is a mock implementation for the MariaDB local API.
// In a real application, these functions would make fetch requests to your local API endpoints.
import type { Observation, CorrectiveAction, Incident, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, ConfinedSpacePermit, IncidentData, Comment, WorkHoursLog, ToolboxTalk, ToolboxSignature, PredefinedHazard, PredefinedControl, EmailSettings } from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_MARIADB_API_URL || 'http://localhost:3001/api';

const apiFetch = async (path: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API call failed for ${path}: ${response.statusText}`, errorBody);
      throw new Error(`API call failed: ${response.statusText}`);
    }
    // Return nothing for DELETE requests, which often have no body
    if (options.method === 'DELETE' || response.status === 204) {
        return;
    }
    return response.json();
  } catch (error) {
    console.error(`Error during API call to ${path}:`, error);
    throw error;
  }
};

export const subscribeToCollection = <T extends { [key: string]: any }>(
  collectionName: string,
  callback: (data: T[]) => void
): (() => void) => {
    const interval = setInterval(async () => {
        try {
            const data = await apiFetch(`/${collectionName}`);
            callback(data);
        } catch (error) {
            console.error(`Failed to fetch collection ${collectionName}:`, error);
        }
    }, 5000); // Poll every 5 seconds

    // Initial fetch
    apiFetch(`/${collectionName}`).then(callback).catch(error => console.error(`Initial fetch failed for ${collectionName}:`, error));

    return () => clearInterval(interval);
};

export const subscribeToDoc = (collectionName: string, docId: string, callback: (data: any | null) => void): (() => void) => {
  const interval = setInterval(async () => {
    try {
        const data = await apiFetch(`/${collectionName}/${docId}`);
        callback(data);
    } catch (error) {
        console.error(`Failed to fetch document ${collectionName}/${docId}:`, error);
    }
  }, 5000); // Poll every 5 seconds

  // Initial fetch
  apiFetch(`/${collectionName}/${docId}`).then(callback).catch(error => console.error(`Initial fetch failed for ${collectionName}/${docId}:`, error));

  return () => clearInterval(interval);
};

export const ensureAdminUserExists = async () => {};
export const ensureSampleJsaExists = async () => {};

export const addObservation = (observation: Omit<Observation, 'observation_id'>, imageFile?: File | null) => {
    let imageUrl;
    if (imageFile) {
        console.warn("[MariaDB Mock] File upload is not implemented. Using placeholder URL.");
        imageUrl = `/uploads/mock/${imageFile.name}`;
    }
    return apiFetch('/observations', { method: 'POST', body: JSON.stringify({ ...observation, imageUrl }) });
};
export const updateObservation = (observation: any) => apiFetch(`/observations/${observation.observation_id}`, { method: 'PUT', body: JSON.stringify(observation) });
export const deleteObservation = (id: string) => apiFetch(`/observations/${id}`, { method: 'DELETE' });

export const addCorrectiveAction = (action: any) => apiFetch('/corrective-actions', { method: 'POST', body: JSON.stringify(action) });
export const updateCorrectiveAction = (action: any) => apiFetch(`/corrective-actions/${action.action_id}`, { method: 'PUT', body: JSON.stringify(action) });

// File uploads are complex and would need a dedicated endpoint in the backend for multipart/form-data.
// This mock will not handle the file upload itself.
export const addCommentToAction = async (actionId: string, commentData: Omit<Comment, 'date' | 'user'>, imageFile?: File | null) => {
    let imageUrl;
    if (imageFile) {
        console.warn("[MariaDB Mock] File upload is not implemented. Storing placeholder URL.");
        imageUrl = `/uploads/mock/${imageFile.name}`;
    }
    const comment = { ...commentData, imageUrl, user: 'Mock User', date: new Date().toISOString() };
    await apiFetch(`/corrective-actions/${actionId}/comments`, { method: 'POST', body: JSON.stringify(comment) });
};


export const addIncident = (incident: any) => apiFetch('/incidents', { method: 'POST', body: JSON.stringify(incident) });
export const deleteIncident = (id: string) => apiFetch(`/incidents/${id}`, { method: 'DELETE' });
export const createInvestigationForIncident = (incidentId: string, displayId: string) => apiFetch(`/investigations`, { method: 'POST', body: JSON.stringify({ incident_id: incidentId, display_id: displayId, status: 'Open' }) });
export const updateIncident = (incident: any) => apiFetch(`/incidents/${incident.incident_id}`, { method: 'PUT', body: JSON.stringify(incident) });

export const addSafetyWalk = (walk: any) => apiFetch('/safety-walks', { method: 'POST', body: JSON.stringify(walk) });
export const updateSafetyWalk = (walk: any) => apiFetch(`/safety-walks/${walk.safety_walk_id}`, { method: 'PUT', body: JSON.stringify(walk) });

export const addForkliftInspection = (inspection: any) => apiFetch('/forklift-inspections', { method: 'POST', body: JSON.stringify(inspection) });

export const addForklift = async (forklift: Omit<Forklift, 'imageUrl'> & { imageFile?: File }) => {
    let imageUrl;
    if (forklift.imageFile) {
      console.warn("[MariaDB] File upload is not implemented. Storing placeholder URL.");
      imageUrl = `/uploads/mock/${forklift.imageFile.name}`;
    }
    const { imageFile, ...forkliftData } = forklift;
    await apiFetch('/forklifts', { method: 'POST', body: JSON.stringify({ ...forkliftData, imageUrl }) });
};
export const updateForklift = async (forklift: Forklift & { imageFile?: File }) => {
    let imageUrl = forklift.imageUrl;
    if (forklift.imageFile) {
      console.warn("[MariaDB] File upload is not implemented. Storing placeholder URL.");
      imageUrl = `/uploads/mock/${forklift.imageFile.name}`;
    }
    const { imageFile, ...forkliftData } = forklift;
    await apiFetch(`/forklifts/${forklift.id}`, { method: 'PUT', body: JSON.stringify({ ...forkliftData, imageUrl }) });
};
export const removeForklift = (id: string) => apiFetch(`/forklifts/${id}`, { method: 'DELETE' });

export const addUser = (user: any) => apiFetch('/users', { method: 'POST', body: JSON.stringify(user) });
export const updateUserStatus = (userId: string, status: string) => apiFetch(`/users/${userId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
export const removeUser = (id: string) => apiFetch(`/users/${id}`, { method: 'DELETE' });

export const addPredefinedChecklistItem = (item: any) => apiFetch('/predefined-checklist-items', { method: 'POST', body: JSON.stringify(item) });
export const updatePredefinedChecklistItem = (item: any) => apiFetch(`/predefined-checklist-items/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
export const removePredefinedChecklistItem = (id: string) => apiFetch(`/predefined-checklist-items/${id}`, { method: 'DELETE' });

export const addPredefinedHazard = (item: any) => apiFetch('/predefined-hazards', { method: 'POST', body: JSON.stringify(item) });
export const updatePredefinedHazard = (item: any) => apiFetch(`/predefined-hazards/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
export const removePredefinedHazard = (id: string) => apiFetch(`/predefined-hazards/${id}`, { method: 'DELETE' });

export const addPredefinedControl = (item: any) => apiFetch('/predefined-controls', { method: 'POST', body: JSON.stringify(item) });
export const updatePredefinedControl = (item: any) => apiFetch(`/predefined-controls/${item.id}`, { method: 'PUT', body: JSON.stringify(item) });
export const removePredefinedControl = (id: string) => apiFetch(`/predefined-controls/${id}`, { method: 'DELETE' });

export const addArea = (area: any, parentId?: string | null) => apiFetch('/areas', { method: 'POST', body: JSON.stringify({ ...area, parentId }) });
export const updateArea = (area: any) => apiFetch(`/areas/${area.area_id}`, { method: 'PUT', body: JSON.stringify(area) });
export const deleteArea = (id: string) => apiFetch(`/areas/${id}`, { method: 'DELETE' });

export const addSafetyDoc = (doc: any) => apiFetch('/documents', { method: 'POST', body: JSON.stringify(doc) });

export const addComplianceRecord = (record: any) => apiFetch('/compliance-records', { method: 'POST', body: JSON.stringify(record) });
export const updateComplianceRecord = (record: any) => apiFetch(`/compliance-records/${record.employee_id}`, { method: 'PUT', body: JSON.stringify(record) });
export const removeComplianceRecord = (id: string) => apiFetch(`/compliance-records/${id}`, { method: 'DELETE' });

export const updateInvestigation = (investigation: any) => apiFetch(`/investigations/${investigation.investigation_id}`, { method: 'PUT', body: JSON.stringify(investigation) });
export const addDocumentToInvestigation = (investigationId: string, document: { name: string; url: string }) => apiFetch(`/investigations/${investigationId}/documents`, { method: 'POST', body: JSON.stringify(document) });

export const addJsa = (jsa: any) => apiFetch('/jsas', { method: 'POST', body: JSON.stringify(jsa) });
export const updateJsa = (jsa: any) => apiFetch(`/jsas/${jsa.jsa_id}`, { method: 'PUT', body: JSON.stringify(jsa) });
export const batchUpdateJsaStatus = (jsaIds: string[], status: 'Active' | 'Expired' | 'Draft') => apiFetch('/jsas/batch-status', { method: 'PUT', body: JSON.stringify({ jsaIds, status }) });

export const addHotWorkPermit = (permit: any) => apiFetch('/hot-work-permits', { method: 'POST', body: JSON.stringify(permit) });
export const updateHotWorkPermit = (permit: any) => apiFetch(`/hot-work-permits/${permit.permit_id}`, { method: 'PUT', body: JSON.stringify(permit) });

export const addConfinedSpacePermit = (permit: any) => apiFetch('/confined-space-permits', { method: 'POST', body: JSON.stringify(permit) });
export const updateConfinedSpacePermit = (permit: any) => apiFetch(`/confined-space-permits/${permit.permit_id}`, { method: 'PUT', body: JSON.stringify(permit) });

export const addCommentToDocument = (collectionName: string, docId: string, comments: Comment[]) => apiFetch(`/${collectionName}/${docId}/comments`, { method: 'POST', body: JSON.stringify(comments) });

export const addToolboxTalk = (talk: any, attachment?: File) => apiFetch('/toolbox-talks', { method: 'POST', body: JSON.stringify({ ...talk, attachmentName: attachment?.name }) });
export const addToolboxSignature = (talkId: string, signature: any) => {
    // In a real API, this would handle a data URL or multipart/form-data upload
    console.warn("[MariaDB] File upload for signature is not implemented. Sending placeholder data.");
    return apiFetch(`/toolbox-signatures`, { method: 'POST', body: JSON.stringify({...signature, signature_image_url: 'placeholder/url'}) });
};
export const getSignaturesForTalk = (talkId: string, callback: (data: ToolboxSignature[]) => void): (() => void) => {
    const interval = setInterval(async () => {
        try {
            const data = await apiFetch(`/toolbox-signatures/for-talk/${talkId}`);
            callback(data);
        } catch (error) {
            console.error(`Failed to fetch signatures for talk ${talkId}:`, error);
        }
    }, 5000);
    
    apiFetch(`/toolbox-signatures/for-talk/${talkId}`).then(callback).catch(error => console.error(`Initial fetch for signatures failed for talk ${talkId}:`, error));
    
    return () => clearInterval(interval);
};

export const updateBrandingSettings = async (logoFile: File): Promise<void> => {
  // This would require a multipart/form-data upload endpoint in a real API.
  console.warn('[MariaDB] Branding settings update with file upload is not implemented.');
};
export const updateUploadSettings = async (settings: UploadSettings): Promise<void> => {
  console.warn('[MariaDB] Upload settings update is not implemented.');
};

export const updateEmailSettings = async (settings: EmailSettings): Promise<void> => {
  console.warn('[MariaDB] Email settings update is not implemented.');
};

export const addWorkHoursLog = (log: any) => apiFetch('/work-hours', { method: 'POST', body: JSON.stringify(log) });
export const updateWorkHoursLog = (log: any) => apiFetch(`/work-hours/${log.id}`, { method: 'PUT', body: JSON.stringify(log) });
export const removeWorkHoursLog = (id: string) => apiFetch(`/work-hours/${id}`, { method: 'DELETE' });
