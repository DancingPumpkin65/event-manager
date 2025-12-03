import { createFileRoute, Outlet, useNavigate } from '@tanstack/react-router';
import { useAuth } from '@/context/AuthContext';
import { useEffect } from 'react';

export const Route = createFileRoute('/admin')({
  component: AdminLayout,
});

function AdminLayout() {
  const { isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: '/login', search: { redirect: location.pathname } });
    } else if (!isAdmin) {
      navigate({ to: '/unauthorized' });
    }
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  // Prevent flash of content
  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="admin-layout">
      <Outlet />
    </div>
  );
}
