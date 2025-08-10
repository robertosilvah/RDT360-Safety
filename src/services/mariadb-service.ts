

// services/mariadb.js
// This is a mock implementation for the MariaDB local API.
// In a real application, these functions would make fetch requests to your local API endpoints.

import type { Observation, CorrectiveAction, Incident, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, ConfinedSpacePermit, IncidentData, Comment, WorkHoursLog, ToolboxTalk, ToolboxSignature, PredefinedHazard, PredefinedControl } from '@/types';

// IMPORTANT: When you are ready to connect to your real MariaDB backend,
// you will need to replace the content of these functions with real API calls.

// 1. Set your backend API's base URL. It's best to use an environment variable.
const API_BASE_URL = process.env.NEXT_PUBLIC_MARIADB_API_URL || 'http://localhost:3001/api';

const logAction = (action: string, data?: any) => {
    console.log(`[MariaDB Mock] Action: ${action}`, data || '');
};

// --- EXAMPLE: Real Implementation vs. Mock ---

// This is a generic function to fetch all incidents.
// Use this as a template for your other "getter" functions.
const getIncidents = async (): Promise<Incident[]> => {
    // REAL IMPLEMENTATION (uncomment when your backend is ready)
    /*
    try {
        const response = await fetch(`${API_BASE_URL}/incidents`);
        if (!response.ok) {
            throw new Error(`API call failed: ${response.statusText}`);
        }
        const data: Incident[] = await response.json();
        return data;
    } catch (error) {
        console.error('Failed to fetch incidents:', error);
        return []; // Return an empty array on error
    }
    */

    // MOCK IMPLEMENTATION (remove this part when you go live)
    console.log('[MariaDB Mock] Fetching all incidents...');
    return Promise.resolve([]); // Return an empty array for the mock
};

// --- NOTE ON FILE UPLOADS ---
// The functions below handle METADATA (information about files), but not the files themselves.
// By default, this application uses FIREBASE STORAGE for all file uploads (images, documents).
// If you want to use a fully local setup with MariaDB, you have two options:
// 1. (Recommended) Continue using Firebase Storage for files. It's robust and scalable.
//    Your MariaDB will store the URL pointing to the file in Firebase Storage. No changes are needed here.
// 2. (Advanced) Build your own file upload endpoint in your local backend API.
//    That endpoint would be responsible for saving the file to your server's disk and returning a URL.
//    You would then call that endpoint from functions like `addToolboxTalk` before saving the metadata to MariaDB.


// --- Functions to be fully implemented ---
// You will need to replace the content of these functions with real API calls.

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    logAction('subscribeToCollection (not supported in API model, use direct fetches)', { collectionName });
    // In a REST API model, you typically fetch data directly instead of subscribing.
    // For example, you might call a function like `getIncidents()` here.
    callback([]); 
    return () => {}; 
};

export const subscribeToDoc = (collectionName: string, docId: string, callback: (data: any | null) => void) => {
    logAction('subscribeToDoc (not supported in API model)', { collectionName, docId });
    callback(null);
    return () => {};
};

export const ensureAdminUserExists = async () => {
    logAction('ensureAdminUserExists');
};

export const addObservation = async (observation: any) => {
    logAction('addObservation', observation);
    return { id: 'mock-obs-id' };
};

export const updateObservation = async (observation: any) => {
    logAction('updateObservation', observation);
};

export const deleteObservation = async (observationId: string) => {
    logAction('deleteObservation', { observationId });
};

export const addCorrectiveAction = async (action: any) => {
    logAction('addCorrectiveAction', action);
};

export const updateCorrectiveAction = async (action: any) => {
    logAction('updateCorrectiveAction', action);
};

export const addIncident = async (incident: any) => {
    logAction('addIncident', incident);
};

export const deleteIncident = async (incidentId: string) => {
    logAction('deleteIncident', { incidentId });
};

export const createInvestigationForIncident = async (incidentId: string, displayId: string): Promise<string> => {
    logAction('createInvestigationForIncident', { incidentId, displayId });
    return 'mock-inv-id';
};

export const updateIncident = async (incident: any) => {
    logAction('updateIncident', incident);
};

export const addSafetyWalk = async (walk: any) => {
    logAction('addSafetyWalk', walk);
};

export const updateSafetyWalk = async (walk: any) => {
    logAction('updateSafetyWalk', walk);
};

export const addForkliftInspection = async (inspection: any) => {
    logAction('addForkliftInspection', inspection);
};

export const addForklift = async (forklift: any) => {
    logAction('addForklift', forklift);
};

export const updateForklift = async (forklift: any) => {
    logAction('updateForklift', forklift);
};

export const removeForklift = async (forkliftId: string) => {
    logAction('removeForklift', { forkliftId });
};

export const addUser = async (user: any) => {
    logAction('addUser', user);
};

export const updateUserStatus = async (userId: string, status: string) => {
    logAction('updateUserStatus', { userId, status });
};

export const removeUser = async (userId: string) => {
    logAction('removeUser', { userId });
};

export const addPredefinedChecklistItem = async (item: any) => {
    logAction('addPredefinedChecklistItem', item);
};

export const updatePredefinedChecklistItem = async (item: any) => {
    logAction('updatePredefinedChecklistItem', item);
};

export const removePredefinedChecklistItem = async (itemId: string) => {
    logAction('removePredefinedChecklistItem', { itemId });
};

export const addPredefinedHazard = async (item: any) => {
    logAction('addPredefinedHazard', item);
};
export const updatePredefinedHazard = async (item: any) => {
    logAction('updatePredefinedHazard', item);
};
export const removePredefinedHazard = async (itemId: string) => {
    logAction('removePredefinedHazard', { itemId });
};

export const addPredefinedControl = async (item: any) => {
    logAction('addPredefinedControl', item);
};
export const updatePredefinedControl = async (item: any) => {
    logAction('updatePredefinedControl', item);
};
export const removePredefinedControl = async (itemId: string) => {
    logAction('removePredefinedControl', { itemId });
};

export const addArea = async (area: any, parentId?: string | null) => {
    logAction('addArea', { area, parentId });
};

export const updateArea = async (area: any) => {
    logAction('updateArea', area);
};

export const deleteArea = async (areaIds: string[]) => {
    logAction('deleteArea', { areaIds });
};

export const addSafetyDoc = async (docData: any) => {
    logAction('addSafetyDoc', docData);
};

export const addComplianceRecord = async (record: any) => {
    logAction('addComplianceRecord', record);
};

export const updateComplianceRecord = async (record: any) => {
    logAction('updateComplianceRecord', record);
};

export const removeComplianceRecord = async (employeeId: string) => {
    logAction('removeComplianceRecord', { employeeId });
};

export const updateInvestigation = async (investigation: any) => {
    logAction('updateInvestigation', investigation);
};

export const addDocumentToInvestigation = async (investigationId: string, documents: any) => {
    logAction('addDocumentToInvestigation', { investigationId, documents });
};

export const addJsa = async (jsaData: any, displayId: string): Promise<boolean> => {
    logAction('addJsa', { jsaData, displayId });
    return true;
};

export const updateJsa = async (updatedJsa: any): Promise<boolean> => {
    logAction('updateJsa', updatedJsa);
    return true;
};

export const batchUpdateJsaStatus = async (jsaIds: string[], status: 'Active' | 'Expired' | 'Draft'): Promise<void> => {
    logAction('batchUpdateJsaStatus', { jsaIds, status });
};

export const addHotWorkPermit = async (permit: any, displayId: string, locationName: string) => {
    logAction('addHotWorkPermit', { permit, displayId, locationName });
};

export const updateHotWorkPermit = async (permit: any) => {
    logAction('updateHotWorkPermit', permit);
};

export const addConfinedSpacePermit = async (permit: any, displayId: string, locationName: string) => {
    logAction('addConfinedSpacePermit', { permit, displayId, locationName });
};

export const updateConfinedSpacePermit = async (permit: any) => {
    logAction('updateConfinedSpacePermit', permit);
};

export const addCommentToDocument = async (collectionName: string, docId: string, comments: Comment[]) => {
    logAction('addCommentToDocument', { collectionName, docId, comments });
};

export const addToolboxTalk = async (talk: Omit<ToolboxTalk, 'id' | 'display_id' | 'signatures' | 'attachments'>, attachment?: File) => {
    logAction('addToolboxTalk', { talk, attachment: attachment?.name });
    return { id: 'mock-talk-id' };
};

export const addToolboxSignature = async (talkId: string, signature: Omit<ToolboxSignature, 'id'>) => {
    logAction('addToolboxSignature', { talkId, signature });
    return { id: 'mock-signature-id' };
};

export const getSignaturesForTalk = (talkId: string, callback: (data: ToolboxSignature[]) => void): (() => void) => {
    logAction('getSignaturesForTalk', { talkId });
    callback([]);
    return () => {};
};

export const updateBrandingSettings = async (logoFile: File): Promise<void> => {
    logAction('updateBrandingSettings', { logoFileName: logoFile.name });
};

export const updateUploadSettings = async (settings: any): Promise<void> => {
    logAction('updateUploadSettings', settings);
};

export const addWorkHoursLog = async (log: any): Promise<void> => {
    logAction('addWorkHoursLog', log);
};

export const updateWorkHoursLog = async (log: any): Promise<void> => {
    logAction('updateWorkHoursLog', log);
};

export const removeWorkHoursLog = async (logId: string): Promise<void> => {
    logAction('removeWorkHoursLog', { logId });
};
