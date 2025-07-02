
'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user for development without real login
const MOCK_USER: FirebaseUser = {
  uid: 'admin-user-id-001',
  email: 'admin@example.com',
  displayName: 'Admin User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: {},
  providerData: [],
  refreshToken: '',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => '',
  getIdTokenResult: async () => ({} as any),
  reload: async () => {},
  toJSON: () => ({}),
  providerId: 'password',
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Set user to mock user immediately for development
  const [user, setUser] = useState<FirebaseUser | null>(MOCK_USER);
  const [loading, setLoading] = useState(false); // Set to false as we're not waiting for auth state

  // You can comment out the mock user and uncomment the useEffect below to use real auth
  /*
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);
  */
  
  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
