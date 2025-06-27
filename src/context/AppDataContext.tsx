'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection, User, Forklift, PredefinedChecklistItem, Area } from '@/types';
import {
  mockObservations,
  mockCorrectiveActions,
  mockIncidents,
  mockSafetyWalks,
  mockForkliftInspections,
  mockUsers,
  mockForklifts,
  mockPredefinedChecklistItems,
  mockAreas,
} from '@/lib/mockData';

interface AppDataContextType {
  observations: Observation[];
  addObservation: (observation: Observation) => void;
  correctiveActions: CorrectiveAction[];
  addCorrectiveAction: (action: CorrectiveAction) => void;
  updateCorrectiveAction: (updatedAction: CorrectiveAction) => void;
  addCommentToAction: (actionId: string, comment: Comment) => void;
  incidents: Incident[];
  updateIncident: (updatedIncident: Incident) => void;
  addCommentToIncident: (incidentId: string, comment: Comment) => void;
  safetyWalks: SafetyWalk[];
  addSafetyWalk: (walk: SafetyWalk) => void;
  updateSafetyWalk: (walk: SafetyWalk) => void;
  addCommentToSafetyWalk: (walkId: string, comment: Comment) => void;
  forkliftInspections: ForkliftInspection[];
  addForkliftInspection: (inspection: ForkliftInspection) => void;
  forklifts: Forklift[];
  addForklift: (forklift: Forklift) => void;
  updateForklift: (forklift: Forklift) => void;
  removeForklift: (forkliftId: string) => void;
  users: User[];
  addUser: (user: User) => void;
  updateUserStatus: (userId: string, status: User['status']) => void;
  removeUser: (userId: string) => void;
  predefinedChecklistItems: PredefinedChecklistItem[];
  addPredefinedChecklistItem: (item: PredefinedChecklistItem) => void;
  updatePredefinedChecklistItem: (item: PredefinedChecklistItem) => void;
  removePredefinedChecklistItem: (itemId: string) => void;
  areas: Area[];
  addArea: (area: Area, parentId?: string | null) => void;
  updateArea: (updatedArea: Area) => void;
  deleteArea: (areaId: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [observations, setObservations] = useState<Observation[]>(mockObservations);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(mockCorrectiveActions);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [safetyWalks, setSafetyWalks] = useState<SafetyWalk[]>(mockSafetyWalks);
  const [forkliftInspections, setForkliftInspections] = useState<ForkliftInspection[]>(mockForkliftInspections);
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [forklifts, setForklifts] = useState<Forklift[]>(mockForklifts);
  const [predefinedChecklistItems, setPredefinedChecklistItems] = useState<PredefinedChecklistItem[]>(mockPredefinedChecklistItems);
  const [areas, setAreas] = useState<Area[]>(mockAreas);

  // Observations
  const addObservation = (observation: Observation) => {
    setObservations(prev => [observation, ...prev]);
  };

  // Corrective Actions
  const addCorrectiveAction = (action: CorrectiveAction) => {
    setCorrectiveActions(prev => [action, ...prev]);
  };
  
  const updateCorrectiveAction = (updatedAction: CorrectiveAction) => {
     setCorrectiveActions(prev => prev.map(a => a.action_id === updatedAction.action_id ? updatedAction : a));
  };
  
  const addCommentToAction = (actionId: string, comment: Comment) => {
    setCorrectiveActions(prev => prev.map(a => a.action_id === actionId ? {...a, comments: [...a.comments, comment]} : a));
  };

  // Incidents
  const updateIncident = (updatedIncident: Incident) => {
    setIncidents(prev => prev.map(i => i.incident_id === updatedIncident.incident_id ? updatedIncident : i));
  };
  
  const addCommentToIncident = (incidentId: string, comment: Comment) => {
    setIncidents(prev => prev.map(i => i.incident_id === incidentId ? {...i, comments: [...i.comments, comment]} : i));
  };

  // Safety Walks
  const addSafetyWalk = (walk: SafetyWalk) => {
    setSafetyWalks(prev => [walk, ...prev]);
  };

  const updateSafetyWalk = (updatedWalk: SafetyWalk) => {
    setSafetyWalks(prev => prev.map(w => w.safety_walk_id === updatedWalk.safety_walk_id ? updatedWalk : w));
  };

  const addCommentToSafetyWalk = (walkId: string, comment: Comment) => {
    setSafetyWalks(prev => prev.map(w => w.safety_walk_id === walkId ? {...w, comments: [...w.comments, comment]} : w));
  };

  // Forklift Inspections
  const addForkliftInspection = (inspection: ForkliftInspection) => {
    setForkliftInspections(prev => [inspection, ...prev]);
  };

  // Forklifts
  const addForklift = (forklift: Forklift) => {
    setForklifts(prev => [forklift, ...prev]);
  };
  const updateForklift = (updatedForklift: Forklift) => {
    setForklifts(prev => prev.map(f => f.id === updatedForklift.id ? updatedForklift : f));
  };
  const removeForklift = (forkliftId: string) => {
    setForklifts(prev => prev.filter(f => f.id !== forkliftId));
  };

  // Users
  const addUser = (user: User) => {
    setUsers(prev => [user, ...prev]);
  };

  const updateUserStatus = (userId: string, status: User['status']) => {
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, status } : u));
  };

  const removeUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // Predefined Checklist Items
  const addPredefinedChecklistItem = (item: PredefinedChecklistItem) => {
    setPredefinedChecklistItems(prev => [item, ...prev]);
  };
  const updatePredefinedChecklistItem = (updatedItem: PredefinedChecklistItem) => {
    setPredefinedChecklistItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };
  const removePredefinedChecklistItem = (itemId: string) => {
    setPredefinedChecklistItems(prev => prev.filter(item => item.id !== itemId));
  };

  // Areas
    const addArea = (area: Area, parentId?: string | null) => {
        if (!parentId) {
            setAreas(prev => [...prev, area]);
            return;
        }

        const addRecursive = (items: Area[]): Area[] => {
            return items.map(item => {
                if (item.area_id === parentId) {
                    return { ...item, children: [...(item.children || []), area] };
                }
                if (item.children) {
                    return { ...item, children: addRecursive(item.children) };
                }
                return item;
            });
        };
        setAreas(addRecursive);
    };

    const updateArea = (updatedArea: Area) => {
        const updateRecursive = (items: Area[]): Area[] => {
            return items.map(item => {
                if (item.area_id === updatedArea.area_id) {
                    return { ...updatedArea, children: item.children || [] };
                }
                if (item.children) {
                    return { ...item, children: updateRecursive(item.children) };
                }
                return item;
            });
        };
        setAreas(updateRecursive);
    };

    const deleteArea = (areaId: string) => {
        const deleteRecursive = (items: Area[], id: string): Area[] => {
            return items.filter(item => item.area_id !== id).map(item => {
                if (item.children) {
                    return { ...item, children: deleteRecursive(item.children, id) };
                }
                return item;
            });
        };
        setAreas(prev => deleteRecursive(prev, areaId));
    };


  return (
    <AppDataContext.Provider value={{
      observations, addObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction, addCommentToAction,
      incidents, updateIncident, addCommentToIncident,
      safetyWalks, addSafetyWalk, updateSafetyWalk, addCommentToSafetyWalk,
      forkliftInspections, addForkliftInspection,
      forklifts, addForklift, updateForklift, removeForklift,
      users, addUser, updateUserStatus, removeUser,
      predefinedChecklistItems, addPredefinedChecklistItem, updatePredefinedChecklistItem, removePredefinedChecklistItem,
      areas, addArea, updateArea, deleteArea,
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
