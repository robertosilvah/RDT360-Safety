'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { Observation, CorrectiveAction, Incident, Comment, SafetyWalk, ForkliftInspection } from '@/types';
import {
  mockObservations,
  mockCorrectiveActions,
  mockIncidents,
  mockSafetyWalks,
  mockForkliftInspections,
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
  forkliftInspections: ForkliftInspection[];
  addForkliftInspection: (inspection: ForkliftInspection) => void;
}

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export const AppDataProvider = ({ children }: { children: ReactNode }) => {
  const [observations, setObservations] = useState<Observation[]>(mockObservations);
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>(mockCorrectiveActions);
  const [incidents, setIncidents] = useState<Incident[]>(mockIncidents);
  const [safetyWalks, setSafetyWalks] = useState<SafetyWalk[]>(mockSafetyWalks);
  const [forkliftInspections, setForkliftInspections] = useState<ForkliftInspection[]>(mockForkliftInspections);

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

  // Forklift Inspections
  const addForkliftInspection = (inspection: ForkliftInspection) => {
    setForkliftInspections(prev => [inspection, ...prev]);
  };

  return (
    <AppDataContext.Provider value={{
      observations, addObservation,
      correctiveActions, addCorrectiveAction, updateCorrectiveAction, addCommentToAction,
      incidents, updateIncident, addCommentToIncident,
      safetyWalks,
      forkliftInspections, addForkliftInspection,
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
