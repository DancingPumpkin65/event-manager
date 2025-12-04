import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventsQueryOptions, useDeleteEvent } from '@/features/event/hooks/query-options';
import { Button, Card, Alert, AlertDialog, SkeletonCard } from '@/components/ui';
import { ChevronLeft, LogOut } from 'lucide-react';

// Skeleton for events page loading state
function EventsPageSkeleton() {
  return (
    <div className="min-h-dvh bg-gray-50 safe-top safe-bottom">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Header skeleton */}
        <div className="flex justify-between items-center mb-8 animate-pulse">
          <div className="h-7 w-32 bg-gray-200 rounded"></div>
          <div className="flex gap-3">
            <div className="h-10 w-28 bg-gray-200 rounded"></div>
            <div className="h-10 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        {/* Cards grid skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/events/')({
  component: EventsPage,
  pendingComponent: EventsPageSkeleton,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(getEventsQueryOptions());
  },
});

function EventsPage() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const { data } = useSuspenseQuery(getEventsQueryOptions());
  const events = data.events;
  const [error, setError] = useState('');
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; eventId: string; eventName: string }>({
    isOpen: false,
    eventId: '',
    eventName: '',
  });
  const deleteEventMutation = useDeleteEvent();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const openDeleteDialog = (eventId: string, eventName: string) => {
    setDeleteDialog({ isOpen: true, eventId, eventName });
  };

  const closeDeleteDialog = () => {
    setDeleteDialog({ isOpen: false, eventId: '', eventName: '' });
  };

  const handleDeleteEvent = async () => {
    try {
      await deleteEventMutation.mutateAsync(deleteDialog.eventId);
      closeDeleteDialog();
    } catch (err) {
      setError('Failed to delete event');
      closeDeleteDialog();
    }
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium text-gray-900">All Events</h2>
          <Link to="/admin/events/create">
            <Button>Create Event</Button>
          </Link>
        </div>

        {error && (
          <Alert type="error" className="mb-6" onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <Card key={event.id} hover className="flex flex-col h-full">
              <Card.Body className="flex-1">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-lg font-medium text-gray-900 truncate" title={event.name}>
                    {event.name}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${event.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                    {event.status}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {event.location || 'No location provided'}
                </p>
                <div className="text-sm text-gray-500">
                  <div>Start: {new Date(event.startDate).toLocaleDateString()}</div>
                  <div>End: {new Date(event.endDate).toLocaleDateString()}</div>
                </div>
              </Card.Body>
              <Card.Footer className="flex justify-between items-center">
                <Link
                  to="/admin/events/$eventId/$eventName/dashboard"
                  params={{ eventId: event.id, eventName: event.name }}
                >
                  <Button variant='secondary' size='sm'>
                    View details
                  </Button>
                </Link>
                {userType === 'admin' && (
                  <Button
                    variant='danger'
                    size='sm'
                    onClick={() => openDeleteDialog(event.id, event.name)}
                  >
                    Delete
                  </Button>
                )}
              </Card.Footer>
            </Card>
          ))}
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        isOpen={deleteDialog.isOpen}
        onClose={closeDeleteDialog}
        onConfirm={handleDeleteEvent}
        title="Delete Event"
        description={`Are you sure you want to delete "${deleteDialog.eventName}"? This action cannot be undone and will remove all associated participants, courses, and attendance records.`}
        confirmLabel="Delete Event"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deleteEventMutation.isPending}
      />
    </div>
  );
}
