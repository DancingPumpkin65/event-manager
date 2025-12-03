import { createFileRoute, redirect } from '@tanstack/react-router';
import { apiClient } from '@/lib/api-client';

export const Route = createFileRoute('/')({
  beforeLoad: async () => {
    // Check if user is authenticated via cookie-based session
    try {
      const session = await apiClient.getSession();
      if (!session.authenticated) {
        throw redirect({ to: '/login' });
      }
      // Authenticated, redirect to events (admin dashboard)
      throw redirect({ to: '/admin/events' });
    } catch (error) {
      // If getSession fails or throws redirect, handle appropriately
      if ((error as any)?.to) {
        throw error; // Re-throw redirect
      }
      // Any other error, redirect to login
      throw redirect({ to: '/login' });
    }
  },
});

