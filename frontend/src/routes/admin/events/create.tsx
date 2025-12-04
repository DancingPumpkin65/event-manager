import { createFileRoute, useNavigate } from '@tanstack/react-router';
import EventForm from '@/features/event/components/event-form';
import { useCreateEvent } from '@/features/event/hooks/query-options';
import { Button } from '@/components/ui';
import type { CreateEventInput } from '@/features/event/types';
import { Link } from '@tanstack/react-router';
import { ChevronLeft, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Route = createFileRoute('/admin/events/create')({
  component: CreateEventPage,

});

function CreateEventPage() {
  const navigate = useNavigate();
  const createEventMutation = useCreateEvent();
  const { user, logout, userType } = useAuth();

  const handleSubmit = async (data: CreateEventInput) => {
    try {
      const newEvent = await createEventMutation.mutateAsync(data);
      const eventName = newEvent.name.toLowerCase().replace(/\s+/g, '-');
      navigate({
        to: '/admin/events/$eventId/$eventName/dashboard',
        params: { eventId: newEvent.id, eventName }
      });
    } catch (error: any) {
      console.error('Failed to create event:', error);
      throw error;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const handleCancel = () => {
    navigate({ to: '/admin/events' });
  };

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Link
                  to="/admin/dashboard"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <span
                  className="text-gray-900 font-medium"
                >
                  Events
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.username}</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                  {userType?.toUpperCase()}
                </span>
              </div>
              <Button variant='danger' size="sm" onClick={handleLogout} title="Logout"
                leftIcon={<LogOut className="h-5 w-5 mr-2" />}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-6">
          <EventForm
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
}
