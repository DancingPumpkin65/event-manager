/**
 * Protected Route Component
 * Redirects to login if user is not authenticated
 */

import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
  requireStaff?: boolean;
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  requireStaff = false,
  redirectTo = '/login'
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    // Not authenticated at all
    if (!isAuthenticated) {
      navigate({ to: redirectTo as any, replace: true });
      return;
    }

    // Require admin but user is not admin
    if (requireAdmin && !isAdmin) {
      console.error('Admin access required');
      navigate({ to: redirectTo as any, replace: true });
      return;
    }

    // Require staff but user is not staff
    if (requireStaff && !isStaff) {
      console.error('Staff access required');
      navigate({ to: redirectTo as any, replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, isStaff, requireAdmin, requireStaff, navigate, redirectTo]);

  if (isLoading) return null;
  if (!isAuthenticated) return null;
  if (requireAdmin && !isAdmin) return null;
  if (requireStaff && !isStaff) return null;

  return <>{children}</>;
}

// Hook-based approach for use in route definitions
export function useRequireAuth(options: { 
  requireAdmin?: boolean; 
  requireStaff?: boolean;
  redirectTo?: string;
} = {}) {
  const { 
    requireAdmin = false, 
    requireStaff = false, 
    redirectTo = '/login' 
  } = options;
  
  const { isAuthenticated, isLoading, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate({ to: redirectTo as any, replace: true });
      return;
    }

    if (requireAdmin && !isAdmin) {
      console.error('Admin access required');
      navigate({ to: '/login' as any, replace: true });
      return;
    }

    if (requireStaff && !isStaff) {
      console.error('Staff access required');
      navigate({ to: '/login' as any, replace: true });
      return;
    }
  }, [isAuthenticated, isLoading, isAdmin, isStaff, requireAdmin, requireStaff, navigate, redirectTo]);

  return { isLoading, isAuthenticated, isAdmin, isStaff };
}
