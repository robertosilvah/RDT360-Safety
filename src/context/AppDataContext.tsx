
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, IncidentData, ConfinedSpacePermit, WorkHoursLog, ToolboxTalk, ToolboxSignature, PredefinedHazard, PredefinedControl } from '@/types';
import api from '@/services/backend';

interface AppDataContextType {
  observations: Observation[];
  addObservation: (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => Promise<any>;
  updateObservation: (observation: Observation) => Promise<void>;
  deleteObservation: (observationId: string) => Promise<void>;
  correctiveActions: CorrectiveAction[];
  addCorrectiveAction: (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'| 'created_date' | 'completion_date' | 'type'>) => Promise<void>;
  updateCorrectiveAction: (updatedAction: CorrectiveAction) => Promise<void>;
  addCommentToAction: (actionId: string, comment: Omit<Comment, 'date' | 'user'>, imageFile?: File | null) => Promise<void>;
  incidents: Incident[];
  addIncident: (incidentData: IncidentData) => Promise<void>;
  deleteIncident: (incidentId: string) => Promise<void>;
  createInvestigationForIncident: (incident: Incident) => Promise<string | undefined>;
  updateIncident: (updatedIncident: Incident) => Promise<void>;
  addCommentToIncident: (incidentId: string, comment: Comment) => Promise<void>;
  safetyWalks: SafetyWalk[];
  addSafetyWalk: (walk: Omit<SafetyWalk, 'safety_walk_id' | 'display_id'>) => Promise<void>;
  updateSafetyWalk: (walk: SafetyWalk) => Promise<void>;
  addCommentToSafetyWalk: (walkId: string, comment: Comment) => Promise<void>;
  forkliftInspections: ForkliftInspection[];
  addForkliftInspection: (inspection: Omit<ForkliftInspection, 'inspection_id' | 'display_id'>) => Promise<void>;
  forklifts: Forklift[];
  addForklift: (forklift: Omit<Forklift, 'imageUrl'> & { imageFile?: File }) => Promise<void>;
  updateForklift: (forklift: Forklift & { imageFile?: File }) => Promise<void>;
  removeForklift: (forkliftId: string) => Promise<void>;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUserStatus: (userId: string, status: User['status']) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  predefinedChecklistItems: PredefinedChecklistItem[];
  addPredefinedChecklistItem: (item: Omit<PredefinedChecklistItem, 'id'>) => Promise<void>;
  updatePredefinedChecklistItem: (item: PredefinedChecklistItem) => Promise<void>;
  removePredefinedChecklistItem: (itemId: string) => Promise<void>;
  predefinedHazards: PredefinedHazard[];
  addPredefinedHazard: (item: Omit<PredefinedHazard, 'id'>) => Promise<void>;
  updatePredefinedHazard: (item: PredefinedHazard) => Promise<void>;
  removePredefinedHazard: (itemId: string) => Promise<void>;
  predefinedControls: PredefinedControl[];
  addPredefinedControl: (item: Omit<PredefinedControl, 'id'>) => Promise<void>;
  updatePredefinedControl: (item: PredefinedControl) => Promise<void>;
  removePredefinedControl: (itemId: string) => Promise<void>;
  areas: Area[];
  addArea: (area: Omit<Area, 'area_id' | 'children'>, parentId?: string | null) => Promise<void>;
  updateArea: (updatedArea: Area) => Promise<void>;
  deleteArea: (areaId: string) => Promise<void>;
  safetyDocs: SafetyDoc[];
  addSafetyDoc: (doc: Omit<SafetyDoc, 'doc_id' | 'display_id'>) => Promise<void>;
  complianceRecords: ComplianceRecord[];
  addComplianceRecord: (record: Omit<ComplianceRecord, 'display_id'>) => Promise<void>;
  updateComplianceRecord: (record: ComplianceRecord) => Promise<void>;
  removeComplianceRecord: (employeeId: string) => Promise<void>;
  investigations: Investigation[];
  updateInvestigation: (investigation: Investigation) => Promise<void>;
  addCommentToInvestigation: (investigationId: string, comment: Comment) => Promise<void>;
  addDocumentToInvestigation: (investigationId: string, document: { name: string; url: string }) => Promise<void>;
  jsas: JSA[];
  addJsa: (jsa: Omit<JSA, 'jsa_id' | 'display_id' | 'status' | 'created_by' | 'created_date' | 'signatures'>) => Promise<boolean>;
  updateJsa: (updatedJsa: JSA) => Promise<boolean>;
  hotWorkPermits: HotWorkPermit[];
  addHotWorkPermit: (permit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => Promise<void>;
  updateHotWorkPermit: (updatedPermit: HotWorkPermit) => Promise<void>;
  addCommentToHotWorkPermit: (permitId: string, comment: Comment) => Promise<void>;
  confinedSpacePermits: ConfinedSpacePermit[];
  addConfinedSpacePermit: (permit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => Promise<void>;
  updateConfinedSpacePermit: (updatedPermit: ConfinedSpacePermit) => Promise<void>;
  addCommentToConfinedSpacePermit: (permitId: string, comment: Comment) => Promise<void>;
  brandingSettings: BrandingSettings | null;
  updateBrandingSettings: (logoFile: File) => Promise<void>;
  uploadSettings: UploadSettings | null;
  updateUploadSettings: (settings: UploadSettings) => Promise<void>;
  workHours: WorkHoursLog[];
  addWorkHoursLog: (log: Omit<WorkHoursLog, 'id'>) => Promise<void>;
  updateWorkHoursLog: (log: WorkHoursLog) => Promise<void>;
  removeWorkHoursLog: (logId: string) => Promise<void>;
  toolboxTalks: ToolboxTalk[];
  addToolboxTalk: (talk: Omit<ToolboxTalk, 'id' | 'display_id' | 'signatures' | 'attachments'>, attachment?: File) => Promise<void>;
  addToolboxSignature: (talkId: string, signature: Omit<ToolboxSignature, 'id' | 'toolbox_talk_id'>) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [observations, setObservations] = useState<Observation[]>([]);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [safetyWalks, setSafetyWalks] = useState<SafetyWalk[]>([]);
  const [forkliftInspections, setForkliftInspections] = useState<ForkliftInspection[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [forklifts, setForklifts] = useState<Forklift[]>([]);
  const [predefinedChecklistItems, setPredefinedChecklistItems] = useState<PredefinedChecklistItem[]>([]);
  const [predefinedHazards, setPredefinedHazards] = useState<PredefinedHazard[]>([]);
  const [predefinedControls, setPredefinedControls] = useState<PredefinedControl[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [safetyDocs, setSafetyDocs] = useState<SafetyDoc[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [jsas, setJsas] = useState<JSA[]>([]);
  const [hotWorkPermits, setHotWorkPermits] = useState<HotWorkPermit[]>([]);
  const [confinedSpacePermits, setConfinedSpacePermits] = useState<ConfinedSpacePermit[]>([]);
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);
  const [uploadSettings, setUploadSettings] = useState<UploadSettings | null>(null);
  const [workHours, setWorkHours] = useState<WorkHoursLog[]>([]);
  const [toolboxTalks, setToolboxTalks] = useState<ToolboxTalk[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  useEffect(() => {
    const unsubscribers = [
        api.subscribeToCollection<Observation>('observations', (data) => { setObservations(data); setIsDataLoaded(true); }, 'observation_id'),
        api.subscribeToCollection<CorrectiveAction>('correctiveActions', (actions) => {
            const now = new Date();
            const processedActions = actions.map(action => {
                let derivedType = action.type;
                if (!derivedType) {
                    if (action.related_to_incident) derivedType = 'Reactive';
                    else if (action.related_to_observation || action.related_to_forklift_inspection) derivedType = 'Preventive';
                    else derivedType = 'Other';
                }
                const derivedCreatedDate = action.created_date || action.due_date;
                let finalStatus = action.status;
                if (finalStatus !== 'Completed' && new Date(action.due_date) < now) {
                    finalStatus = 'Overdue';
                }
                return { ...action, type: derivedType, created_date: derivedCreatedDate, status: finalStatus };
            });
            setCorrectiveActions(processedActions);
        }, 'action_id'),
        api.subscribeToCollection<Incident>('incidents', setIncidents, 'incident_id'),
        api.subscribeToCollection<SafetyWalk>('safetyWalks', setSafetyWalks, 'safety_walk_id'),
        api.subscribeToCollection<ForkliftInspection>('forkliftInspections', setForkliftInspections, 'inspection_id'),
        api.subscribeToCollection<User>('users', setUsers, 'id'),
        api.subscribeToCollection<Forklift>('forklifts', setForklifts, 'id'),
        api.subscribeToCollection<PredefinedChecklistItem>('predefinedChecklistItems', setPredefinedChecklistItems, 'id'),
        api.subscribeToCollection<PredefinedHazard>('predefinedHazards', setPredefinedHazards, 'id'),
        api.subscribeToCollection<PredefinedControl>('predefinedControls', setPredefinedControls, 'id'),
        api.subscribeToCollection<Area>('areas', (allAreas) => {
            const areaMap = new Map<string, Area>();
            const rootAreas: Area[] = [];
            allAreas.forEach(area => {
                area.children = [];
                areaMap.set(area.area_id, area);
            });
            allAreas.forEach(area => {
                if (area.parentId && areaMap.has(area.parentId)) {
                    const parent = areaMap.get(area.parentId)!;
                    if (!parent.children) parent.children = [];
                    parent.children.push(area);
                } else {
                    rootAreas.push(area);
                }
            });
            setAreas(rootAreas);
        }, 'area_id'),
        api.subscribeToCollection<SafetyDoc>('safetyDocs', setSafetyDocs, 'doc_id'),
        api.subscribeToCollection<ComplianceRecord>('complianceRecords', setComplianceRecords, 'employee_id'),
        api.subscribeToCollection<Investigation>('investigations', setInvestigations, 'investigation_id'),
        api.subscribeToCollection<JSA>('jsas', (jsasFromDb) => {
            const now = new Date();
            const jsasToUpdate = jsasFromDb.filter(jsa => jsa.status === 'Active' && new Date(jsa.valid_to) < now);
            
            if (jsasToUpdate.length > 0) {
              api.batchUpdateJsaStatus(jsasToUpdate.map(j => j.jsa_id), 'Expired');
            }
            
            const processedJsas = jsasFromDb.map(jsa => {
                if (jsa.status === 'Active' && new Date(jsa.valid_to) < now) {
                    return { ...jsa, status: 'Expired' as const };
                }
                return jsa;
            });
            setJsas(processedJsas);
        }, 'jsa_id'),
        api.subscribeToCollection<HotWorkPermit>('hotWorkPermits', setHotWorkPermits, 'permit_id'),
        api.subscribeToCollection<ConfinedSpacePermit>('confinedSpacePermits', setConfinedSpacePermits, 'permit_id'),
        api.subscribeToDoc('settings', 'branding', setBrandingSettings),
        api.subscribeToDoc('settings', 'uploads', (settings) => {
            setUploadSettings(settings || { imageMaxSizeMB: 5, docMaxSizeMB: 10 });
        }),
        api.subscribeToCollection<WorkHoursLog>('workHours', setWorkHours, 'id'),
        api.subscribeToCollection<ToolboxTalk>('toolboxTalks', (talks) => {
            const talksWithSignatures: ToolboxTalk[] = talks.map(talk => ({...talk, signatures: []}));
            setToolboxTalks(talksWithSignatures);
        }, 'id'),
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);
  
  useEffect(() => {
    if (isDataLoaded && users.length > 0) {
      api.ensureAdminUserExists();
    }
  }, [isDataLoaded, users]);

  useEffect(() => {
    if (isDataLoaded && jsas.length > 0) {
        api.ensureSampleJsaExists();
    }
  }, [isDataLoaded, jsas]);

  const addObservation = (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => {
    const displayId = `OBS${String(observations.length + 1).padStart(3, '0')}`;
    return api.addObservation({ ...observation, display_id: displayId, status: 'Open' });
  };
  
  const addCorrectiveAction = (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments' | 'created_date' | 'completion_date' | 'type'>) => {
    const displayId = `ACT${String(correctiveActions.length + 1).padStart(3, '0')}`;
    let type: CorrectiveAction['type'] = 'Other';
    if (action.related_to_incident) type = 'Reactive';
    else if (action.related_to_observation || action.related_to_forklift_inspection) type = 'Preventive';
    return api.addCorrectiveAction({ ...action, display_id: displayId, comments: [], created_date: new Date().toISOString(), type });
  };

  const updateCorrectiveAction = (updatedAction: CorrectiveAction) => {
    const originalAction = correctiveActions.find(a => a.action_id === updatedAction.action_id);
    if (originalAction && originalAction.status !== 'Completed' && updatedAction.status === 'Completed') {
        (updatedAction as Partial<CorrectiveAction>).completion_date = new Date().toISOString();
    }
    return api.updateCorrectiveAction(updatedAction);
  };
  
  const addIncident = (incidentData: IncidentData) => {
    const displayId = `INC${String(incidents.length + 1).padStart(3, '0')}`;
    const newIncidentForDb = { ...incidentData, display_id: displayId, status: 'Open' as const, linked_docs: [], comments: [] };
    return api.addIncident(newIncidentForDb);
  };

  const createInvestigationForIncident = async (incident: Incident) => {
    if (incident.investigation_id) return incident.investigation_id;
    const displayId = `INV${String(investigations.length + 1).padStart(3, '0')}`;
    return api.createInvestigationForIncident(incident.incident_id, displayId);
  }

  const addSafetyWalk = (walk: Omit<SafetyWalk, 'safety_walk_id' | 'display_id'>) => {
    const displayId = `SWALK${String(safetyWalks.length + 1).padStart(3, '0')}`;
    return api.addSafetyWalk({...walk, display_id: displayId});
  };

  const addForkliftInspection = (inspection: Omit<ForkliftInspection, 'inspection_id' | 'display_id'>) => {
    const displayId = `FINSP${String(forkliftInspections.length + 1).padStart(3, '0')}`;
    return api.addForkliftInspection({...inspection, display_id: displayId});
  };
  
  const addArea = (area: Omit<Area, 'area_id' | 'children'>, parentId?: string | null) => {
    return api.addArea(area, parentId);
  };
  
  const deleteArea = async (areaId: string) => {
    const findAreaRecursive = (areasToSearch: Area[], id: string): Area | undefined => {
        for (const area of areasToSearch) {
            if (area.area_id === id) return area;
            if (area.children) {
                const found = findAreaRecursive(area.children, id);
                if (found) return found;
            }
        }
        return undefined;
    };
    const areaToDelete = findAreaRecursive(areas, areaId);
    if (!areaToDelete) return;
    const idsToDelete: string[] = [];
    const collectIds = (area: Area) => {
        idsToDelete.push(area.area_id);
        area.children?.forEach(collectIds);
    };
    collectIds(areaToDelete);
    return api.deleteArea(idsToDelete);
  };

  const addSafetyDoc = (docData: Omit<SafetyDoc, 'doc_id' | 'display_id'>) => {
    const displayId = `DOC${String(safetyDocs.length + 1).padStart(3, '0')}`;
    return api.addSafetyDoc({...docData, display_id: displayId});
  };

  const addComplianceRecord = (record: Omit<ComplianceRecord, 'display_id'>) => {
    const displayId = `CR${String(complianceRecords.length + 1).padStart(3, '0')}`;
    return api.addComplianceRecord({...record, display_id: displayId});
  };

  const addJsa = async (jsaData: Omit<JSA, 'jsa_id' | 'display_id' | 'status' | 'created_by' | 'created_date' | 'signatures'>): Promise<boolean> => {
    const displayId = `JSA${String(jsas.length + 1).padStart(3, '0')}`;
    return await api.addJsa(jsaData, displayId);
  };

  const updateJsa = async (updatedJsa: JSA): Promise<boolean> => {
    return await api.updateJsa(updatedJsa);
  }

  const addHotWorkPermit = (permit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => {
    const displayId = `HWP${String(hotWorkPermits.length + 1).padStart(3, '0')}`;
    return api.addHotWorkPermit(permit, displayId, locationName);
  };

  const addCommentToHotWorkPermit = async (permitId: string, comment: Comment) => {
    const permit = hotWorkPermits.find(p => p.permit_id === permitId);
    if (permit) {
      return api.addCommentToDocument('hotWorkPermits', permitId, [...(permit.comments || []), comment]);
    }
  };

  const addConfinedSpacePermit = async (permit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => {
    const displayId = `CSP${String(confinedSpacePermits.length + 1).padStart(3, '0')}`;
    return api.addConfinedSpacePermit(permit, displayId, locationName);
  };

  const addCommentToConfinedSpacePermit = async (permitId: string, comment: Comment) => {
    const permit = confinedSpacePermits.find(p => p.permit_id === permitId);
    if (permit) {
      return api.addCommentToDocument('confinedSpacePermits', permitId, [...(permit.comments || []), comment]);
    }
  };

  const addToolboxTalk = async (talk: Omit<ToolboxTalk, 'id' | 'display_id' | 'signatures' | 'attachments'>, attachment?: File) => {
      const displayId = `TT${String(toolboxTalks.length + 1).padStart(4, '0')}`;
      await api.addToolboxTalk({ ...talk, display_id: displayId }, attachment);
  };

  const addToolboxSignature = async (talkId: string, signature: Omit<ToolboxSignature, 'id' | 'toolbox_talk_id'>) => {
      await api.addToolboxSignature(talkId, { ...signature, toolbox_talk_id: talkId });
  };
  
  const addCommentToAction = (actionId: string, comment: Omit<Comment, 'date' | 'user'>, imageFile?: File | null) => {
      return api.addCommentToAction(actionId, comment, imageFile);
  };

  return (
    <AppDataContext.Provider value={{
      observations, addObservation,
      updateObservation: api.updateObservation, 
      deleteObservation: api.deleteObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction,
      addCommentToAction,
      incidents, addIncident, deleteIncident: api.deleteIncident, createInvestigationForIncident,
      updateIncident: api.updateIncident,
      addCommentToIncident: (incidentId, comment) => {
        const incident = incidents.find(i => i.incident_id === incidentId);
        if(incident) return api.addCommentToDocument('incidents', incidentId, [...incident.comments, comment]);
        return Promise.resolve();
      },
      safetyWalks, addSafetyWalk,
      updateSafetyWalk: api.updateSafetyWalk,
      addCommentToSafetyWalk: (walkId, comment) => {
        const walk = safetyWalks.find(w => w.safety_walk_id === walkId);
        if(walk) return api.addCommentToDocument('safetyWalks', walkId, [...walk.comments, comment]);
        return Promise.resolve();
      },
      forkliftInspections, addForkliftInspection,
      forklifts,
      addForklift: api.addForklift,
      updateForklift: api.updateForklift,
      removeForklift: api.removeForklift,
      users,
      addUser: api.addUser,
      updateUserStatus: api.updateUserStatus,
      removeUser: api.removeUser,
      predefinedChecklistItems,
      addPredefinedChecklistItem: api.addPredefinedChecklistItem,
      updatePredefinedChecklistItem: api.updatePredefinedChecklistItem,
      removePredefinedChecklistItem: api.removePredefinedChecklistItem,
      predefinedHazards,
      addPredefinedHazard: api.addPredefinedHazard,
      updatePredefinedHazard: api.updatePredefinedHazard,
      removePredefinedHazard: api.removePredefinedHazard,
      predefinedControls,
      addPredefinedControl: api.addPredefinedControl,
      updatePredefinedControl: api.updatePredefinedControl,
      removePredefinedControl: api.removePredefinedControl,
      areas, addArea,
      updateArea: api.updateArea,
      deleteArea,
      safetyDocs, addSafetyDoc,
      complianceRecords, addComplianceRecord,
      updateComplianceRecord: api.updateComplianceRecord,
      removeComplianceRecord: api.removeComplianceRecord,
      investigations,
      updateInvestigation: api.updateInvestigation,
      addCommentToInvestigation: (investigationId, comment) => {
        const investigation = investigations.find(i => i.investigation_id === investigationId);
        if(investigation) return api.addCommentToDocument('investigations', investigationId, [...investigation.documents, comment]);
        return Promise.resolve();
      },
      addDocumentToInvestigation: (investigationId, documentData) => {
        const investigation = investigations.find(i => i.investigation_id === investigationId);
        if(investigation) return api.addDocumentToInvestigation(investigationId, [...investigation.documents, documentData]);
        return Promise.resolve();
      },
      jsas, addJsa, updateJsa,
      hotWorkPermits, addHotWorkPermit,
      updateHotWorkPermit: api.updateHotWorkPermit,
      addCommentToHotWorkPermit,
      confinedSpacePermits, addConfinedSpacePermit,
      updateConfinedSpacePermit: api.updateConfinedSpacePermit,
      addCommentToConfinedSpacePermit,
      brandingSettings,
      updateBrandingSettings: api.updateBrandingSettings,
      uploadSettings,
      updateUploadSettings: api.updateUploadSettings,
      workHours,
      addWorkHoursLog: api.addWorkHoursLog,
      updateWorkHoursLog: api.updateWorkHoursLog,
      removeWorkHoursLog: api.removeWorkHoursLog,
      toolboxTalks, addToolboxTalk, addToolboxSignature,
    }}>
      {children}
    </AppDataContext.Provider>
  );
};

export const useAppData = () => {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
};
