'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User as FirebaseUser, IdTokenResult } from 'firebase/auth';

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// A mock admin user to bypass the login flow for development.
const mockAdminUser: FirebaseUser = {
  uid: 'admin-user-id-001',
  email: 'admin@example.com',
  displayName: 'Admin User',
  photoURL: null,
  emailVerified: true,
  isAnonymous: false,
  metadata: { creationTime: new Date().toISOString(), lastSignInTime: new Date().toISOString() },
  providerData: [],
  refreshToken: 'mock-refresh-token',
  tenantId: null,
  delete: async () => {},
  getIdToken: async () => 'mock-id-token',
  getIdTokenResult: async () => ({
    token: 'mock-id-token',
    expirationTime: new Date(Date.now() + 3600 * 1000).toISOString(),
    authTime: new Date().toISOString(),
    issuedAtTime: new Date().toISOString(),
    signInProvider: null,
    signInSecondFactor: null,
    claims: { admin: true },
  } as IdTokenResult),
  reload: async () => {},
  toJSON: () => ({}),
  providerId: 'password',
};


export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // --- DEVELOPMENT BYPASS ---
  // This provides a mock admin user to all components.
  // The original Firebase logic is commented out below.
  const [user] = useState<FirebaseUser | null>(mockAdminUser);
  const [loading] = useState(false);

  /*
  // Original Firebase Logic:
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
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
