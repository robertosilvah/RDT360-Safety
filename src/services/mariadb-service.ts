// services/mariadb.js
// This is a mock implementation for the MariaDB local API.
// In a real application, these functions would make fetch requests to your local API endpoints.

import type { Observation, CorrectiveAction, Incident, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, ConfinedSpacePermit, IncidentData, Comment, WorkHoursLog } from '@/types';

const logAction = (action: string, data?: any) => {
    console.log(`[MariaDB Mock] Action: ${action}`, data || '');
    // In a real scenario, you'd probably want to return mock data.
    // For now, we'll return empty arrays or promises that resolve to void.
};

export const subscribeToCollection = (collectionName: string, callback: (data: any[]) => void) => {
    logAction('subscribeToCollection', { collectionName });
    // Simulate an initial empty state and do not update further.
    callback([]); 
    // Return a dummy unsubscribe function.
    return () => {}; 
};

export const subscribeToDoc = (collectionName: string, docId: string, callback: (data: any | null) => void) => {
    logAction('subscribeToDoc', { collectionName, docId });
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
