/**
 * Authentication Context Provider
 * Manages user authentication state using React Query
 */

import { createContext, useContext, type ReactNode } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getSessionQueryOptions } from '@/features/auth/hooks/query-options';
import type { SessionOutput } from '@/features/auth/types';

interface AuthContextType {
  session: SessionOutput;
  isAuthenticated: boolean;
  isAdmin: boolean;
  user: SessionOutput['user'];
  userType: SessionOutput['userType'];
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { data: session } = useSuspenseQuery(getSessionQueryOptions());

  const value: AuthContextType = {
    session,
    isAuthenticated: session.authenticated,
    isAdmin: session.userType === 'admin',
    user: session.user,
    userType: session.userType,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

/**
 * Hook to check if user is admin
 */
export function useIsAdmin() {
  const { userType } = useAuth(); // Assuming useAuth is available here or we need to access context. 
  // Wait, useAuth is exported from here.
  return userType === 'admin';
}

/**
 * Hook to check if user is organizer or admin
 * For now mapped to admin since we don't have organizer
 */
export function useCanManageEvents() {
  return useIsAdmin();
}
