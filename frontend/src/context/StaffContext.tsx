import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Staff } from '@/features/staff/types';
import { apiClient } from '@/lib/api-client';

interface StaffContextType {
  staff: Staff | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (staff: Staff) => void;
  logout: () => void;
}

const StaffContext = createContext<StaffContextType | undefined>(undefined);

export function StaffProvider({ children }: { children: React.ReactNode }) {
  const [staff, setStaff] = useState<Staff | null>(null);

  // Check for existing session on mount
  const { data: session, isLoading } = useQuery({
    queryKey: ['auth', 'session'],
    queryFn: () => apiClient.getSession(),
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Sync session state with local state
  useEffect(() => {
    if (session?.authenticated && session.userType === 'staff' && session.user) {
      const user = session.user as any;
      setStaff({
        ...user,
        createdAt: new Date(user.createdAt),
        updatedAt: new Date(user.updatedAt),
        badgePrintedAt: user.badgePrintedAt ? new Date(user.badgePrintedAt) : null,
      } as Staff);
    }
  }, [session]);

  const login = useCallback((newStaff: Staff) => {
    setStaff(newStaff);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
    setStaff(null);
  }, []);

  return (
    <StaffContext.Provider
      value={{
        staff,
        isAuthenticated: !!staff,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </StaffContext.Provider>
  );
}

export function useStaffAuth() {
  const context = useContext(StaffContext);
  if (context === undefined) {
    throw new Error('useStaffAuth must be used within StaffProvider');
  }
  return context;
}

