'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection, User } from '@/types';
import {
  mockObservations,
  mockCorrectiveActions,
  mockIncidents,
  mockSafetyWalks,
  mockForkliftInspections,
  mockUsers,
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
  users: User[];
  addUser: (user: User) => void;
  updateUserStatus: (userId: string, status: User['status']) => void;
  removeUser: (userId: string) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [observations, setObservations] = useState<Observation[]>(mockObservations);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(mockCorrectiveActions);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [safetyWalks, setSafetyWalks] = useState<SafetyWalk[]>(mockSafetyWalks);
  const [forkliftInspections, setForkliftInspections] = useState<ForkliftInspection[]>(mockForkliftInspections);
  const [users, setUsers] = useState<User[]>(mockUsers);

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

  return (
    <AppDataContext.Provider value={{
      observations, addObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction, addCommentToAction,
      incidents, updateIncident, addCommentToIncident,
      safetyWalks, addSafetyWalk, updateSafetyWalk, addCommentToSafetyWalk,
      forkliftInspections, addForkliftInspection,
      users, addUser, updateUserStatus, removeUser,
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
