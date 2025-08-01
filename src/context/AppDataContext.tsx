
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, IncidentData, ConfinedSpacePermit } from '@/types';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, DocumentReference } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as firebaseService from '@/services/firebase-service';

interface AppDataContextType {
  observations: Observation[];
  addObservation: (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => Promise<DocumentReference>;
  updateObservation: (observation: Observation) => Promise<void>;
  deleteObservation: (observationId: string) => Promise<void>;
  correctiveActions: CorrectiveAction[];
  addCorrectiveAction: (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'| 'created_date' | 'completion_date' | 'type'>) => Promise<void>;
  updateCorrectiveAction: (updatedAction: CorrectiveAction) => Promise<void>;
  addCommentToAction: (actionId: string, comment: Comment) => Promise<void>;
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
  addForklift: (forklift: Forklift) => Promise<void>;
  updateForklift: (forklift: Forklift) => Promise<void>;
  removeForklift: (forkliftId: string) => Promise<void>;
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUserStatus: (userId: string, status: User['status']) => Promise<void>;
  removeUser: (userId: string) => Promise<void>;
  predefinedChecklistItems: PredefinedChecklistItem[];
  addPredefinedChecklistItem: (item: Omit<PredefinedChecklistItem, 'id'>) => Promise<void>;
  updatePredefinedChecklistItem: (item: PredefinedChecklistItem) => Promise<void>;
  removePredefinedChecklistItem: (itemId: string) => Promise<void>;
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
  const [areas, setAreas] = useState<Area[]>([]);
  const [safetyDocs, setSafetyDocs] = useState<SafetyDoc[]>([]);
  const [complianceRecords, setComplianceRecords] = useState<ComplianceRecord[]>([]);
  const [investigations, setInvestigations] = useState<Investigation[]>([]);
  const [jsas, setJsas] = useState<JSA[]>([]);
  const [hotWorkPermits, setHotWorkPermits] = useState<HotWorkPermit[]>([]);
  const [confinedSpacePermits, setConfinedSpacePermits] = useState<ConfinedSpacePermit[]>([]);
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);
  const [uploadSettings, setUploadSettings] = useState<UploadSettings | null>(null);

  useEffect(() => {
    const unsubscribers = [
        firebaseService.subscribeToCollection<Observation>('observations', setObservations),
        firebaseService.subscribeToCollection<CorrectiveAction>('correctiveActions', (actions) => {
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
        firebaseService.subscribeToCollection<Incident>('incidents', setIncidents, 'incident_id'),
        firebaseService.subscribeToCollection<SafetyWalk>('safetyWalks', setSafetyWalks, 'safety_walk_id'),
        firebaseService.subscribeToCollection<ForkliftInspection>('forkliftInspections', setForkliftInspections, 'inspection_id'),
        firebaseService.subscribeToCollection<User>('users', setUsers, 'id'),
        firebaseService.subscribeToCollection<Forklift>('forklifts', setForklifts, 'id'),
        firebaseService.subscribeToCollection<PredefinedChecklistItem>('predefinedChecklistItems', setPredefinedChecklistItems, 'id'),
        firebaseService.subscribeToCollection<Area>('areas', (allAreas) => {
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
        firebaseService.subscribeToCollection<SafetyDoc>('safetyDocs', setSafetyDocs, 'doc_id'),
        firebaseService.subscribeToCollection<ComplianceRecord>('complianceRecords', setComplianceRecords, 'employee_id'),
        firebaseService.subscribeToCollection<Investigation>('investigations', setInvestigations, 'investigation_id'),
        firebaseService.subscribeToCollection<JSA>('jsas', (jsasFromDb) => {
            const now = new Date();
            const batch = writeBatch(db);
            let hasUpdates = false;
            const processedJsas = jsasFromDb.map(jsa => {
                if (jsa.status === 'Active' && new Date(jsa.valid_to) < now) {
                    const jsaRef = doc(db, 'jsas', jsa.jsa_id);
                    batch.update(jsaRef, { status: 'Expired' });
                    hasUpdates = true;
                    return { ...jsa, status: 'Expired' as const };
                }
                return jsa;
            });
            if (hasUpdates) batch.commit().catch(console.error);
            setJsas(processedJsas);
        }, 'jsa_id'),
        firebaseService.subscribeToCollection<HotWorkPermit>('hotWorkPermits', setHotWorkPermits, 'permit_id'),
        firebaseService.subscribeToCollection<ConfinedSpacePermit>('confinedSpacePermits', setConfinedSpacePermits, 'permit_id'),
        firebaseService.subscribeToDoc('settings', 'branding', setBrandingSettings),
        firebaseService.subscribeToDoc('settings', 'uploads', (settings) => {
            setUploadSettings(settings || { imageMaxSizeMB: 5, docMaxSizeMB: 10 });
        }),
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);
  
  useEffect(() => {
    if (users.length > 0 && !users.some(u => u.id === 'admin-user-id-001')) {
      firebaseService.ensureAdminUserExists();
    }
  }, [users]);

  const addObservation = (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => {
    const displayId = `OBS${String(observations.length + 1).padStart(3, '0')}`;
    return firebaseService.addObservation({ ...observation, display_id: displayId, status: 'Open' });
  };
  
  const addCorrectiveAction = (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments' | 'created_date' | 'completion_date' | 'type'>) => {
    const displayId = `ACT${String(correctiveActions.length + 1).padStart(3, '0')}`;
    let type: CorrectiveAction['type'] = 'Other';
    if (action.related_to_incident) type = 'Reactive';
    else if (action.related_to_observation || action.related_to_forklift_inspection) type = 'Preventive';
    return firebaseService.addCorrectiveAction({ ...action, display_id: displayId, comments: [], created_date: new Date().toISOString(), type });
  };

  const updateCorrectiveAction = (updatedAction: CorrectiveAction) => {
    const originalAction = correctiveActions.find(a => a.action_id === updatedAction.action_id);
    if (originalAction && originalAction.status !== 'Completed' && updatedAction.status === 'Completed') {
        (updatedAction as Partial<CorrectiveAction>).completion_date = new Date().toISOString();
    }
    return firebaseService.updateCorrectiveAction(updatedAction);
  };
  
  const addIncident = (incidentData: IncidentData) => {
    const displayId = `INC${String(incidents.length + 1).padStart(3, '0')}`;
    const newIncidentForDb = { ...incidentData, display_id: displayId, status: 'Open' as const, linked_docs: [], comments: [] };
    return firebaseService.addIncident(newIncidentForDb);
  };

  const createInvestigationForIncident = async (incident: Incident) => {
    if (incident.investigation_id) return incident.investigation_id;
    const displayId = `INV${String(investigations.length + 1).padStart(3, '0')}`;
    return firebaseService.createInvestigationForIncident(incident.incident_id, displayId);
  }

  const deleteIncident = (incidentId: string) => {
    return firebaseService.deleteIncident(incidentId);
  }

  const addSafetyWalk = (walk: Omit<SafetyWalk, 'safety_walk_id' | 'display_id'>) => {
    const displayId = `SWALK${String(safetyWalks.length + 1).padStart(3, '0')}`;
    return firebaseService.addSafetyWalk({...walk, display_id: displayId});
  };

  const addForkliftInspection = (inspection: Omit<ForkliftInspection, 'inspection_id' | 'display_id'>) => {
    const displayId = `FINSP${String(forkliftInspections.length + 1).padStart(3, '0')}`;
    return firebaseService.addForkliftInspection({...inspection, display_id: displayId});
  };
  
  const addArea = (area: Omit<Area, 'area_id' | 'children'>, parentId?: string | null) => {
    return firebaseService.addArea(area, parentId);
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
    return firebaseService.deleteArea(idsToDelete);
  };

  const addSafetyDoc = (docData: Omit<SafetyDoc, 'doc_id' | 'display_id'>) => {
    const displayId = `DOC${String(safetyDocs.length + 1).padStart(3, '0')}`;
    return firebaseService.addSafetyDoc({...docData, display_id: displayId});
  };

  const addComplianceRecord = (record: Omit<ComplianceRecord, 'display_id'>) => {
    const displayId = `CR${String(complianceRecords.length + 1).padStart(3, '0')}`;
    return firebaseService.addComplianceRecord({...record, display_id: displayId});
  };

  const addJsa = (jsaData: Omit<JSA, 'jsa_id' | 'display_id' | 'status' | 'created_by' | 'created_date' | 'signatures'>): Promise<boolean> => {
    const displayId = `JSA${String(jsas.length + 1).padStart(3, '0')}`;
    return firebaseService.addJsa(jsaData, displayId);
  };

  const updateJsa = (updatedJsa: JSA): Promise<boolean> => {
    return firebaseService.updateJsa(updatedJsa);
  };

  const addHotWorkPermit = (permit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => {
    const displayId = `HWP${String(hotWorkPermits.length + 1).padStart(3, '0')}`;
    return firebaseService.addHotWorkPermit(permit, displayId, locationName);
  };

  const addCommentToHotWorkPermit = async (permitId: string, comment: Comment) => {
    const permit = hotWorkPermits.find(p => p.permit_id === permitId);
    if (permit) {
      return firebaseService.addCommentToDocument('hotWorkPermits', permitId, [...(permit.comments || []), comment]);
    }
  };

  const addConfinedSpacePermit = async (permit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, locationName: string) => {
    const displayId = `CSP${String(confinedSpacePermits.length + 1).padStart(3, '0')}`;
    return firebaseService.addConfinedSpacePermit(permit, displayId, locationName);
  };

  const addCommentToConfinedSpacePermit = async (permitId: string, comment: Comment) => {
    const permit = confinedSpacePermits.find(p => p.permit_id === permitId);
    if (permit) {
      return firebaseService.addCommentToDocument('confinedSpacePermits', permitId, [...(permit.comments || []), comment]);
    }
  };

  return (
    <AppDataContext.Provider value={{
      observations, addObservation,
      updateObservation: firebaseService.updateObservation, 
      deleteObservation: firebaseService.deleteObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction,
      addCommentToAction: (actionId, comment) => {
          const action = correctiveActions.find(a => a.action_id === actionId);
          if (action) return firebaseService.addCommentToDocument('correctiveActions', actionId, [...action.comments, comment]);
          return Promise.resolve();
      },
      incidents, addIncident, deleteIncident, createInvestigationForIncident,
      updateIncident: firebaseService.updateIncident,
      addCommentToIncident: (incidentId, comment) => {
        const incident = incidents.find(i => i.incident_id === incidentId);
        if(incident) return firebaseService.addCommentToDocument('incidents', incidentId, [...incident.comments, comment]);
        return Promise.resolve();
      },
      safetyWalks, addSafetyWalk,
      updateSafetyWalk: firebaseService.updateSafetyWalk,
      addCommentToSafetyWalk: (walkId, comment) => {
        const walk = safetyWalks.find(w => w.safety_walk_id === walkId);
        if(walk) return firebaseService.addCommentToDocument('safetyWalks', walkId, [...walk.comments, comment]);
        return Promise.resolve();
      },
      forkliftInspections, addForkliftInspection,
      forklifts,
      addForklift: firebaseService.addForklift,
      updateForklift: firebaseService.updateForklift,
      removeForklift: firebaseService.removeForklift,
      users,
      addUser: firebaseService.addUser,
      updateUserStatus: firebaseService.updateUserStatus,
      removeUser: firebaseService.removeUser,
      predefinedChecklistItems,
      addPredefinedChecklistItem: firebaseService.addPredefinedChecklistItem,
      updatePredefinedChecklistItem: firebaseService.updatePredefinedChecklistItem,
      removePredefinedChecklistItem: firebaseService.removePredefinedChecklistItem,
      areas, addArea,
      updateArea: firebaseService.updateArea,
      deleteArea,
      safetyDocs, addSafetyDoc,
      complianceRecords, addComplianceRecord,
      updateComplianceRecord: firebaseService.updateComplianceRecord,
      removeComplianceRecord: firebaseService.removeComplianceRecord,
      investigations,
      updateInvestigation: firebaseService.updateInvestigation,
      addCommentToInvestigation: (investigationId, comment) => {
        const investigation = investigations.find(i => i.investigation_id === investigationId);
        if(investigation) return firebaseService.addCommentToDocument('investigations', investigationId, [...investigation.comments, comment]);
        return Promise.resolve();
      },
      addDocumentToInvestigation: (investigationId, documentData) => {
        const investigation = investigations.find(i => i.investigation_id === investigationId);
        if(investigation) return firebaseService.addDocumentToInvestigation(investigationId, [...investigation.documents, documentData]);
        return Promise.resolve();
      },
      jsas, addJsa, updateJsa,
      hotWorkPermits, addHotWorkPermit,
      updateHotWorkPermit: firebaseService.updateHotWorkPermit,
      addCommentToHotWorkPermit,
      confinedSpacePermits, addConfinedSpacePermit,
      updateConfinedSpacePermit: firebaseService.updateConfinedSpacePermit,
      addCommentToConfinedSpacePermit,
      brandingSettings,
      updateBrandingSettings: firebaseService.updateBrandingSettings,
      uploadSettings,
      updateUploadSettings: firebaseService.updateUploadSettings,
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

    
