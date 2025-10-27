/**
 * Authentication Context
 * Provides authentication state and functions throughout the app
 * Uses HttpOnly cookie-based authentication
 */

import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '@/lib/api-client';
import type { LoginInput, StaffLoginInput, StaffLoginOutput, AdminUser } from '@/features/auth/types';

interface AuthContextType {
  user: AdminUser | StaffLoginOutput | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  userType: 'admin' | 'staff' | null;
  isAdmin: boolean;
  isStaff: boolean;
  login: (credentials: LoginInput) => Promise<void>;
  staffLogin: (credentials: StaffLoginInput) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | StaffLoginOutput | null>(null);
  const [userType, setUserType] = useState<'admin' | 'staff' | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already authenticated on mount
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const session = await apiClient.getSession();
      if (session.authenticated && session.user) {
        setUser(session.user);
        setUserType(session.userType);
      } else {
        setUser(null);
        setUserType(null);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setUserType(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginInput) => {
    await apiClient.login(credentials);
    // Verify session after login to get full user details
    await checkAuth();
  };

  const staffLogin = async (credentials: StaffLoginInput) => {
    await apiClient.staffLogin(credentials);
    // Verify session after login to get full user details
    await checkAuth();
  };

  const logout = async () => {
    await apiClient.logout();
    setUser(null);
    setUserType(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    userType,
    isAdmin: userType === 'admin',
    isStaff: userType === 'staff',
    login,
    staffLogin,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Helper hooks
export function useIsAdmin() {
  const { isAdmin } = useAuth();
  return isAdmin;
}

export function useIsStaff() {
  const { isStaff } = useAuth();
  return isStaff;
}

export function useRequireAdmin() {
  const { isAdmin, isLoading } = useAuth();
  if (!isLoading && !isAdmin) {
    throw new Error('Admin access required');
  }
  return isAdmin;
}

export function useRequireStaff() {
  const { isStaff, isLoading } = useAuth();
  if (!isLoading && !isStaff) {
    throw new Error('Staff access required');
  }
  return isStaff;
}

