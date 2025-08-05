




import { db, storage } from '@/lib/firebase';
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc, setDoc, writeBatch, DocumentReference,
  getDocs, query, where, getDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { Observation, CorrectiveAction, Incident, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area, SafetyDoc, ComplianceRecord, Investigation, JSA, HotWorkPermit, BrandingSettings, UploadSettings, ConfinedSpacePermit, IncidentData, Comment, WorkHoursLog, ToolboxTalk, ToolboxSignature, PredefinedHazard, PredefinedControl } from '@/types';

// Generic subscribe to collection function
export const subscribeToCollection = <T extends { [key: string]: any }>(
  collectionName: string,
  callback: (data: T[]) => void,
  idField: keyof T
): (() => void) => {
  const q = collection(db, collectionName);
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      [idField]: doc.id,
    } as T));
    callback(data);
  });
};

// Generic subscribe to a single document
export const subscribeToDoc = <T>(
    collectionName: string,
    docId: string,
    callback: (data: T | null) => void
): (() => void) => {
    const docRef = doc(db, collectionName, docId);
    return onSnapshot(docRef, (doc) => {
        callback(doc.exists() ? doc.data() as T : null);
    });
};

// Ensure admin user exists
export const ensureAdminUserExists = async () => {
  const adminDocRef = doc(db, "users", "admin-user-id-001");
  const docSnap = await getDoc(adminDocRef);
  if (!docSnap.exists()) {
    const adminUser: Omit<User, 'id'> = {
      name: 'Admin User',
      email: 'admin@example.com',
      role: 'Administrator',
      status: 'Active',
    };
    await setDoc(adminDocRef, adminUser);
  }
};

// Observation Functions
export const addObservation = (observation: Omit<Observation, 'observation_id'>) => {
  return addDoc(collection(db, 'observations'), observation);
};

export const updateObservation = async (observation: Observation) => {
  const { observation_id, ...data } = observation;
  await updateDoc(doc(db, 'observations', observation_id), data);
};

export const deleteObservation = async (observationId: string) => {
  await deleteDoc(doc(db, 'observations', observationId));
};

// Corrective Action Functions
export const addCorrectiveAction = async (action: Omit<CorrectiveAction, 'action_id'>) => {
  await addDoc(collection(db, 'correctiveActions'), action);
};

export const updateCorrectiveAction = async (updatedAction: CorrectiveAction) => {
  const { action_id, ...data } = updatedAction;
  await updateDoc(doc(db, 'correctiveActions', action_id), data as { [x: string]: any });
};

// Incident Functions
export const addIncident = async (incidentData: Omit<Incident, 'incident_id'>) => {
  await addDoc(collection(db, 'incidents'), incidentData);
};

export const deleteIncident = async (incidentId: string) => {
  await deleteDoc(doc(db, 'incidents', incidentId));
};

export const createInvestigationForIncident = async (incidentId: string, displayId: string): Promise<string> => {
  const batch = writeBatch(db);
  const newInvestigation: Omit<Investigation, 'investigation_id'> = {
      display_id: displayId,
      incident_id: incidentId,
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

  const incidentRef = doc(db, 'incidents', incidentId);
  batch.update(incidentRef, {
      investigation_id: investigationRef.id,
      status: 'Under Investigation'
  });

  await batch.commit();
  return investigationRef.id;
};

export const updateIncident = async (updatedIncident: Incident) => {
  const { incident_id, ...data } = updatedIncident;
  await updateDoc(doc(db, 'incidents', incident_id), data);
};

// Safety Walk Functions
export const addSafetyWalk = async (walk: Omit<SafetyWalk, 'safety_walk_id'>) => {
  await addDoc(collection(db, 'safetyWalks'), walk);
};

export const updateSafetyWalk = async (updatedWalk: SafetyWalk) => {
  const { safety_walk_id, ...data } = updatedWalk;
  await updateDoc(doc(db, 'safetyWalks', safety_walk_id), data);
};

// Forklift Inspection Functions
export const addForkliftInspection = async (inspection: Omit<ForkliftInspection, 'inspection_id'>) => {
  await addDoc(collection(db, 'forkliftInspections'), inspection);
};

// Forklift Functions
export const addForklift = async (forklift: Forklift) => {
  await setDoc(doc(db, 'forklifts', forklift.id), forklift);
};
export const updateForklift = async (updatedForklift: Forklift) => {
  await updateDoc(doc(db, 'forklifts', updatedForklift.id), updatedForklift);
};
export const removeForklift = async (forkliftId: string) => {
  await deleteDoc(doc(db, 'forklifts', forkliftId));
};

// User Functions
export const addUser = async (user: Omit<User, 'id'>) => {
  await addDoc(collection(db, 'users'), user);
};
export const updateUserStatus = async (userId: string, status: User['status']) => {
  await updateDoc(doc(db, 'users', userId), { status });
};
export const removeUser = async (userId: string) => {
  await deleteDoc(doc(db, 'users', userId));
};

// Predefined Checklist Item Functions
export const addPredefinedChecklistItem = async (item: Omit<PredefinedChecklistItem, 'id'>) => {
  await addDoc(collection(db, 'predefinedChecklistItems'), item);
};
export const updatePredefinedChecklistItem = async (updatedItem: PredefinedChecklistItem) => {
  await updateDoc(doc(db, 'predefinedChecklistItems', updatedItem.id), updatedItem);
};
export const removePredefinedChecklistItem = async (itemId: string) => {
  await deleteDoc(doc(db, 'predefinedChecklistItems', itemId));
};

// Predefined Hazard Functions
export const addPredefinedHazard = async (item: Omit<PredefinedHazard, 'id'>) => {
  await addDoc(collection(db, 'predefinedHazards'), item);
};
export const updatePredefinedHazard = async (updatedItem: PredefinedHazard) => {
  await updateDoc(doc(db, 'predefinedHazards', updatedItem.id), updatedItem);
};
export const removePredefinedHazard = async (itemId: string) => {
  await deleteDoc(doc(db, 'predefinedHazards', itemId));
};

// Predefined Control Functions
export const addPredefinedControl = async (item: Omit<PredefinedControl, 'id'>) => {
  await addDoc(collection(db, 'predefinedControls'), item);
};
export const updatePredefinedControl = async (updatedItem: PredefinedControl) => {
  await updateDoc(doc(db, 'predefinedControls', updatedItem.id), updatedItem);
};
export const removePredefinedControl = async (itemId: string) => {
  await deleteDoc(doc(db, 'predefinedControls', itemId));
};


// Area Functions
export const addArea = async (area: Omit<Area, 'area_id' | 'children'>, parentId?: string | null) => {
  const newAreaData: any = { name: area.name, machines: area.machines };
  if (parentId) newAreaData.parentId = parentId;
  await addDoc(collection(db, 'areas'), newAreaData);
};
export const updateArea = async (updatedArea: Area) => {
  const { area_id, children, ...data } = updatedArea;
  await updateDoc(doc(db, 'areas', area_id), data);
};
export const deleteArea = async (areaIds: string[]) => {
  const batch = writeBatch(db);
  areaIds.forEach(id => batch.delete(doc(db, 'areas', id)));
  await batch.commit();
};

// Safety Doc Functions
export const addSafetyDoc = async (docData: Omit<SafetyDoc, 'doc_id'>) => {
  await addDoc(collection(db, 'safetyDocs'), docData);
};

// Compliance Record Functions
export const addComplianceRecord = async (record: Omit<ComplianceRecord, 'display_id'>) => {
  await setDoc(doc(db, 'complianceRecords', record.employee_id), record);
};
export const updateComplianceRecord = async (record: ComplianceRecord) => {
  await updateDoc(doc(db, 'complianceRecords', record.employee_id), record);
};
export const removeComplianceRecord = async (employeeId: string) => {
  await deleteDoc(doc(db, 'complianceRecords', employeeId));
};

// Investigation Functions
export const updateInvestigation = async (updatedInvestigation: Investigation) => {
  const { investigation_id, ...data } = updatedInvestigation;
  await updateDoc(doc(db, 'investigations', investigation_id), data);
};

export const addDocumentToInvestigation = async (investigationId: string, documents: { name: string; url: string }[]) => {
  await updateDoc(doc(db, 'investigations', investigationId), { documents });
};

// JSA Functions
export const addJsa = async (jsaData: Omit<JSA, 'jsa_id' | 'display_id' | 'status' | 'created_by' | 'created_date' | 'signatures'>, displayId: string): Promise<boolean> => {
    const status = new Date(jsaData.valid_to) < new Date() ? 'Expired' : 'Active';
    const newJsaForDb = { 
        ...jsaData,
        display_id: displayId, 
        status: status,
        created_by: 'Safety Manager', // Mocked
        created_date: new Date().toISOString(),
        signatures: [],
    };
    await addDoc(collection(db, 'jsas'), newJsaForDb);
    return true;
};
export const updateJsa = async (updatedJsa: JSA): Promise<boolean> => {
    const { jsa_id, ...data } = updatedJsa;
    data.status = new Date(data.valid_to) < new Date() ? 'Expired' : 'Active';
    await updateDoc(doc(db, 'jsas', jsa_id), data);
    return true;
};

export const batchUpdateJsaStatus = async (jsaIds: string[], status: 'Active' | 'Expired' | 'Draft'): Promise<void> => {
    const batch = writeBatch(db);
    jsaIds.forEach(id => {
        const docRef = doc(db, 'jsas', id);
        batch.update(docRef, { status });
    });
    await batch.commit();
}


// Hot Work Permit Functions
export const addHotWorkPermit = async (permit: Omit<HotWorkPermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, displayId: string, locationName: string) => {
  const newPermitData = { ...permit, display_id: displayId, created_date: new Date().toISOString(), status: 'Draft' as const, locationName: locationName, comments: [] };
  await addDoc(collection(db, 'hotWorkPermits'), newPermitData);
};
export const updateHotWorkPermit = async (updatedPermit: HotWorkPermit) => {
  const { permit_id, ...data } = updatedPermit;
  await updateDoc(doc(db, 'hotWorkPermits', permit_id), data);
};

// Confined Space Permit Functions
export const addConfinedSpacePermit = async (permit: Omit<ConfinedSpacePermit, 'permit_id' | 'display_id' | 'created_date' | 'status' | 'supervisor_signature' | 'locationName' | 'comments'>, displayId: string, locationName: string) => {
    const newPermitData = { ...permit, display_id: displayId, created_date: new Date().toISOString(), status: 'Draft' as const, locationName: locationName, comments: [] };
    await addDoc(collection(db, 'confinedSpacePermits'), newPermitData);
};
export const updateConfinedSpacePermit = async (updatedPermit: ConfinedSpacePermit) => {
    const { permit_id, ...data } = updatedPermit;
    await updateDoc(doc(db, 'confinedSpacePermits', permit_id), data);
};


// Generic function to add comments to any document
export const addCommentToDocument = async (collectionName: string, docId: string, comments: Comment[]) => {
  await updateDoc(doc(db, collectionName, docId), { comments });
};

// Toolbox Talk Functions
export const addToolboxTalk = async (talk: Omit<ToolboxTalk, 'id' | 'display_id' | 'signatures' | 'attachments'>, attachment?: File) => {
  let attachmentUrl = '';
  if (attachment) {
      const storageRef = ref(storage, `toolbox-attachments/${Date.now()}_${attachment.name}`);
      await uploadBytes(storageRef, attachment);
      attachmentUrl = await getDownloadURL(storageRef);
  }

  const newTalkData = {
      ...talk,
      signatures: [],
      attachments: attachment ? [{ name: attachment.name, url: attachmentUrl }] : [],
  };
  return await addDoc(collection(db, 'toolboxTalks'), newTalkData);
};

export const addToolboxSignature = async (talkId: string, signature: Omit<ToolboxSignature, 'id'>) => {
    const storageRef = ref(storage, `toolbox-signatures/${talkId}_${Date.now()}.png`);
    const uploadResult = await uploadString(storageRef, signature.signature_image_url, 'data_url');
    const downloadUrl = await getDownloadURL(uploadResult.ref);

    const signatureData = {
        ...signature,
        signature_image_url: downloadUrl
    };
    return await addDoc(collection(db, 'toolboxSignatures'), signatureData);
};

export const getSignaturesForTalk = (talkId: string, callback: (data: ToolboxSignature[]) => void): (() => void) => {
  const q = query(collection(db, 'toolboxSignatures'), where('toolbox_talk_id', '==', talkId));
  return onSnapshot(q, (querySnapshot) => {
    const data = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id,
    } as ToolboxSignature));
    callback(data);
  });
};

// Settings Functions
export const updateBrandingSettings = async (logoFile: File) => {
  if (!logoFile) return;
  const storageRef = ref(storage, `branding/logo`);
  await uploadBytes(storageRef, logoFile);
  const logoUrl = await getDownloadURL(storageRef);
  await setDoc(doc(db, 'settings', 'branding'), { logoUrl });
};
export const updateUploadSettings = async (settings: UploadSettings) => {
  await setDoc(doc(db, 'settings', 'uploads'), settings);
};

// Work Hours Log Functions
export const addWorkHoursLog = async (log: Omit<WorkHoursLog, 'id'>) => {
  await addDoc(collection(db, 'workHours'), log);
};
export const updateWorkHoursLog = async (updatedLog: WorkHoursLog) => {
  const { id, ...data } = updatedLog;
  await updateDoc(doc(db, 'workHours', id), data);
};
export const removeWorkHoursLog = async (logId: string) => {
  await deleteDoc(doc(db, 'workHours', logId));
};
