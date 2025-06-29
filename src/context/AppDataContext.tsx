

'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, IncidentData } from '@/types';
import { db, storage } from '@/lib/firebase';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, DocumentReference } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface AppDataContextType {
  observations: Observation[];
  addObservation: (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => Promise<DocumentReference>;
  updateObservation: (observation: Observation) => Promise<void>;
  deleteObservation: (observationId: string) => Promise<void>;
  correctiveActions: CorrectiveAction[];
  addCorrectiveAction: (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'>) => Promise<void>;
  updateCorrectiveAction: (updatedAction: CorrectiveAction) => Promise<void>;
  addCommentToAction: (actionId: string, comment: Comment) => Promise<void>;
  incidents: Incident[];
  addIncident: (incidentData: IncidentData) => Promise<void>;
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
  addArea: (area: Omit<Area, 'area_id'>, parentId?: string | null) => Promise<void>;
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
  addJsa: (jsa: Omit<JSA, 'jsa_id'>) => Promise<void>;
  updateJsa: (updatedJsa: JSA) => Promise<void>;
  hotWorkPermits: HotWorkPermit[];
  addHotWorkPermit: (permit: Omit<HotWorkPermit, 'permit_id'>) => Promise<void>;
  updateHotWorkPermit: (updatedPermit: HotWorkPermit) => Promise<void>;
  brandingSettings: BrandingSettings | null;
  updateBrandingSettings: (logoFile: File) => Promise<void>;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

const mapFromSnapshot = <T>(snapshot: any, idField: keyof T): T[] => {
    return snapshot.docs.map((doc: any) => ({
        [idField]: doc.id,
        ...doc.data(),
    } as T));
};

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
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings | null>(null);

  useEffect(() => {
    const unsubscribers = [
      onSnapshot(collection(db, 'observations'), (snapshot) => setObservations(mapFromSnapshot(snapshot, 'observation_id'))),
      onSnapshot(collection(db, 'correctiveActions'), (snapshot) => {
        const actionsFromDb = mapFromSnapshot<CorrectiveAction>(snapshot, 'action_id');
        const now = new Date();
        const batch = writeBatch(db);
        let hasUpdates = false;
    
        const processedActions = actionsFromDb.map(action => {
            if (
                (action.status === 'Pending' || action.status === 'In Progress') &&
                new Date(action.due_date) < now
            ) {
                if (action.status !== 'Overdue') {
                    const actionRef = doc(db, 'correctiveActions', action.action_id);
                    batch.update(actionRef, { status: 'Overdue' });
                    hasUpdates = true;
                }
                return { ...action, status: 'Overdue' as const };
            }
            return action;
        });
    
        if (hasUpdates) {
            batch.commit().catch(console.error);
        }
        
        setCorrectiveActions(processedActions);
      }),
      onSnapshot(collection(db, 'incidents'), (snapshot) => setIncidents(mapFromSnapshot(snapshot, 'incident_id'))),
      onSnapshot(collection(db, 'safetyWalks'), (snapshot) => setSafetyWalks(mapFromSnapshot(snapshot, 'safety_walk_id'))),
      onSnapshot(collection(db, 'forkliftInspections'), (snapshot) => setForkliftInspections(mapFromSnapshot(snapshot, 'inspection_id'))),
      onSnapshot(collection(db, 'users'), (snapshot) => {
        const usersFromDb = mapFromSnapshot<User>(snapshot, 'id');
        // Special handling for mock admin user to ensure it's always in the list for development
        const adminId = 'admin-user-id-001';
        const hasAdmin = usersFromDb.some(u => u.id === adminId);
        if (!hasAdmin) {
          usersFromDb.push({
            id: adminId,
            name: 'Admin User',
            email: 'admin@example.com',
            role: 'Administrator',
            status: 'Active',
          });
        }
        setUsers(usersFromDb);
      }),
      onSnapshot(collection(db, 'forklifts'), (snapshot) => setForklifts(mapFromSnapshot(snapshot, 'id'))),
      onSnapshot(collection(db, 'predefinedChecklistItems'), (snapshot) => setPredefinedChecklistItems(mapFromSnapshot(snapshot, 'id'))),
      onSnapshot(collection(db, 'areas'), (snapshot) => setAreas(mapFromSnapshot(snapshot, 'area_id'))),
      onSnapshot(collection(db, 'safetyDocs'), (snapshot) => setSafetyDocs(mapFromSnapshot(snapshot, 'doc_id'))),
      onSnapshot(collection(db, 'complianceRecords'), (snapshot) => setComplianceRecords(mapFromSnapshot(snapshot, 'employee_id'))),
      onSnapshot(collection(db, 'investigations'), (snapshot) => setInvestigations(mapFromSnapshot(snapshot, 'investigation_id'))),
      onSnapshot(collection(db, 'jsas'), (snapshot) => setJsas(mapFromSnapshot(snapshot, 'jsa_id'))),
      onSnapshot(collection(db, 'hotWorkPermits'), (snapshot) => setHotWorkPermits(mapFromSnapshot(snapshot, 'permit_id'))),
      onSnapshot(doc(db, 'settings', 'branding'), (doc) => {
        if (doc.exists()) {
          setBrandingSettings(doc.data() as BrandingSettings);
        } else {
          setBrandingSettings(null); // No branding settings yet
        }
      }),
    ];
    return () => unsubscribers.forEach(unsub => unsub());
  }, []);

  const addObservation = async (observation: Omit<Observation, 'observation_id' | 'display_id' | 'status'>) => {
    const displayId = `OBS${String(observations.length + 1).padStart(3, '0')}`;
    return await addDoc(collection(db, 'observations'), { ...observation, display_id: displayId, status: 'Open' });
  };

  const updateObservation = async (observation: Observation) => {
    const { observation_id, ...data } = observation;
    await updateDoc(doc(db, 'observations', observation_id), data);
  };
  
  const deleteObservation = async (observationId: string) => {
    await deleteDoc(doc(db, 'observations', observationId));
  };

  const addCorrectiveAction = async (action: Omit<CorrectiveAction, 'action_id' | 'display_id' | 'comments'>) => {
    const displayId = `ACT${String(correctiveActions.length + 1).padStart(3, '0')}`;
    const { linkType, ...rest } = action as any;
    await addDoc(collection(db, 'correctiveActions'), { ...rest, display_id: displayId, comments: [] });
  };
  
  const updateCorrectiveAction = async (updatedAction: CorrectiveAction) => {
     const { action_id, ...data } = updatedAction;
     const { linkType, ...rest } = data as any;
     await updateDoc(doc(db, 'correctiveActions', action_id), rest);
  };
  
  const addCommentToAction = async (actionId: string, comment: Comment) => {
    const action = correctiveActions.find(a => a.action_id === actionId);
    if (action) {
      const updatedComments = [...action.comments, comment];
      await updateDoc(doc(db, 'correctiveActions', actionId), { comments: updatedComments });
    }
  };

  const addIncident = async (incidentData: IncidentData) => {
    const displayId = `INC${String(incidents.length + 1).padStart(3, '0')}`;
    const newIncidentForDb = {
        ...incidentData,
        display_id: displayId,
        status: 'Open' as const,
        linked_docs: [],
        comments: [],
    };
    await addDoc(collection(db, 'incidents'), newIncidentForDb);
  };

  const createInvestigationForIncident = async (incident: Incident) => {
    if (incident.investigation_id) return incident.investigation_id;

    const batch = writeBatch(db);
    const displayId = `INV${String(investigations.length + 1).padStart(3, '0')}`;

    const newInvestigation: Omit<Investigation, 'investigation_id'> = {
        display_id: displayId,
        incident_id: incident.incident_id,
        status: 'Open',
        root_cause: '',
        contributing_factors: '',
        events_history: '',
        lessons_learned: '',
        action_plan: '',
        documents: [],
        comments: [],
    };
    const investigationRef = doc(collection(db, 'investigations'));
    batch.set(investigationRef, newInvestigation);

    const incidentRef = doc(db, 'incidents', incident.incident_id);
    batch.update(incidentRef, {
        investigation_id: investigationRef.id,
        status: 'Under Investigation'
    });

    await batch.commit();
    return investigationRef.id;
  }

  const updateIncident = async (updatedIncident: Incident) => {
    const { incident_id, ...data } = updatedIncident;
    await updateDoc(doc(db, 'incidents', incident_id), data);
  };
  
  const addCommentToIncident = async (incidentId: string, comment: Comment) => {
    const incident = incidents.find(i => i.incident_id === incidentId);
    if (incident) {
      await updateDoc(doc(db, 'incidents', incidentId), { comments: [...incident.comments, comment] });
    }
  };

  const addSafetyWalk = async (walk: Omit<SafetyWalk, 'safety_walk_id' | 'display_id'>) => {
    const displayId = `SWALK${String(safetyWalks.length + 1).padStart(3, '0')}`;
    await addDoc(collection(db, 'safetyWalks'), {...walk, display_id: displayId});
  };

  const updateSafetyWalk = async (updatedWalk: SafetyWalk) => {
    const { safety_walk_id, ...data } = updatedWalk;
    await updateDoc(doc(db, 'safetyWalks', safety_walk_id), data);
  };

  const addCommentToSafetyWalk = async (walkId: string, comment: Comment) => {
    const walk = safetyWalks.find(w => w.safety_walk_id === walkId);
    if(walk) {
      await updateDoc(doc(db, 'safetyWalks', walkId), { comments: [...walk.comments, comment] });
    }
  };

  const addForkliftInspection = async (inspection: Omit<ForkliftInspection, 'inspection_id' | 'display_id'>) => {
    const displayId = `FINSP${String(forkliftInspections.length + 1).padStart(3, '0')}`;
    await addDoc(collection(db, 'forkliftInspections'), {...inspection, display_id: displayId});
  };

  const addForklift = async (forklift: Forklift) => {
    await setDoc(doc(db, 'forklifts', forklift.id), forklift);
  };
  const updateForklift = async (updatedForklift: Forklift) => {
    await updateDoc(doc(db, 'forklifts', updatedForklift.id), updatedForklift);
  };
  const removeForklift = async (forkliftId: string) => {
    await deleteDoc(doc(db, 'forklifts', forkliftId));
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    await addDoc(collection(db, 'users'), user);
  };
  const updateUserStatus = async (userId: string, status: User['status']) => {
    await updateDoc(doc(db, 'users', userId), { status });
  };
  const removeUser = async (userId: string) => {
    await deleteDoc(doc(db, 'users', userId));
  };

  const addPredefinedChecklistItem = async (item: Omit<PredefinedChecklistItem, 'id'>) => {
    await addDoc(collection(db, 'predefinedChecklistItems'), item);
  };
  const updatePredefinedChecklistItem = async (updatedItem: PredefinedChecklistItem) => {
    await updateDoc(doc(db, 'predefinedChecklistItems', updatedItem.id), updatedItem);
  };
  const removePredefinedChecklistItem = async (itemId: string) => {
    await deleteDoc(doc(db, 'predefinedChecklistItems', itemId));
  };

  const addArea = async (area: Omit<Area, 'area_id'>, parentId?: string | null) => {
      // For simplicity, this example doesn't handle nested adds in Firestore.
      // A more robust solution would use nested collections or path properties.
      await addDoc(collection(db, 'areas'), area);
  };
  const updateArea = async (updatedArea: Area) => {
    const { area_id, ...data } = updatedArea;
    await updateDoc(doc(db, 'areas', area_id), data);
  };
  const deleteArea = async (areaId: string) => {
    // This is a simplified delete. A real implementation would need to handle
    // deleting sub-collections (children) recursively.
    await deleteDoc(doc(db, 'areas', areaId));
  };

  const addSafetyDoc = async (docData: Omit<SafetyDoc, 'doc_id' | 'display_id'>) => {
    const displayId = `DOC${String(safetyDocs.length + 1).padStart(3, '0')}`;
    await addDoc(collection(db, 'safetyDocs'), {...docData, display_id: displayId});
  };

  const addComplianceRecord = async (record: Omit<ComplianceRecord, 'display_id'>) => {
    const displayId = `CR${String(complianceRecords.length + 1).padStart(3, '0')}`;
    await setDoc(doc(db, 'complianceRecords', record.employee_id), {...record, display_id: displayId});
  };
  const updateComplianceRecord = async (record: ComplianceRecord) => {
    await updateDoc(doc(db, 'complianceRecords', record.employee_id), record);
  };
  const removeComplianceRecord = async (employeeId: string) => {
    await deleteDoc(doc(db, 'complianceRecords', employeeId));
  };

  const updateInvestigation = async (updatedInvestigation: Investigation) => {
      const { investigation_id, ...data } = updatedInvestigation;
      await updateDoc(doc(db, 'investigations', investigation_id), data);
  };
  const addCommentToInvestigation = async (investigationId: string, comment: Comment) => {
    const investigation = investigations.find(i => i.investigation_id === investigationId);
    if(investigation) {
        await updateDoc(doc(db, 'investigations', investigationId), { comments: [...investigation.comments, comment] });
    }
  };
  const addDocumentToInvestigation = async (investigationId: string, documentData: { name: string; url: string }) => {
    const investigation = investigations.find(i => i.investigation_id === investigationId);
    if(investigation) {
      await updateDoc(doc(db, 'investigations', investigationId), { documents: [...investigation.documents, documentData] });
    }
  };

  const addJsa = async (jsa: Omit<JSA, 'jsa_id'>) => {
    await addDoc(collection(db, 'jsas'), jsa);
  };
  const updateJsa = async (updatedJsa: JSA) => {
    const { jsa_id, ...data } = updatedJsa;
    await updateDoc(doc(db, 'jsas', jsa_id), data);
  };

  const addHotWorkPermit = async (permit: Omit<HotWorkPermit, 'permit_id'>) => {
    await addDoc(collection(db, 'hotWorkPermits'), permit);
  };
  const updateHotWorkPermit = async (updatedPermit: HotWorkPermit) => {
    const { permit_id, ...data } = updatedPermit;
    await updateDoc(doc(db, 'hotWorkPermits', permit_id), data);
  };
  
  const updateBrandingSettings = async (logoFile: File) => {
    if (!logoFile) return;
    const storageRef = ref(storage, `branding/logo`);
    await uploadBytes(storageRef, logoFile);
    const logoUrl = await getDownloadURL(storageRef);
    await setDoc(doc(db, 'settings', 'branding'), { logoUrl });
  };

  return (
    <AppDataContext.Provider value={{
      observations, addObservation, updateObservation, deleteObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction, addCommentToAction,
      incidents, updateIncident, addCommentToIncident, addIncident, createInvestigationForIncident,
      safetyWalks, addSafetyWalk, updateSafetyWalk, addCommentToSafetyWalk,
      forkliftInspections, addForkliftInspection,
      forklifts, addForklift, updateForklift, removeForklift,
      users, addUser, updateUserStatus, removeUser,
      predefinedChecklistItems, addPredefinedChecklistItem, updatePredefinedChecklistItem, removePredefinedChecklistItem,
      areas, addArea, updateArea, deleteArea,
      safetyDocs, addSafetyDoc,
      complianceRecords, addComplianceRecord, updateComplianceRecord, removeComplianceRecord,
      investigations, updateInvestigation, addCommentToInvestigation, addDocumentToInvestigation,
      jsas, addJsa, updateJsa,
      hotWorkPermits, addHotWorkPermit, updateHotWorkPermit,
      brandingSettings, updateBrandingSettings,
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
