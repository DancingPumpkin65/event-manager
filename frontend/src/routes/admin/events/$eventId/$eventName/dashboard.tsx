import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventQueryOptions, useUpdateEvent } from '@/features/event/hooks/query-options';
import EventForm from '@/features/event/components/event-form';
import { getDashboardStatsQueryOptions } from '@/features/dashboard/hooks/query-options';
import type { CreateEventInput } from '@/features/event/types';
import { Button, Skeleton } from '@/components/ui';
import { CalendarCog } from 'lucide-react';

// Skeleton for dashboard page - matches actual event info layout
function DashboardPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with event name and edit button */}
      <div className="flex justify-between items-start mb-6">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-56" />
          <Skeleton height="h-4" width="w-40" />
        </div>
        <Skeleton height="h-10" width="w-28" className="rounded-lg" />
      </div>
      {/* Event info grid - matches actual 2-column layout */}
      <div className="grid grid-cols-2 gap-6">
        {/* Start Date */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Start Date</div>
          <Skeleton height="h-5" width="w-24" />
        </div>
        {/* End Date */}
        <div>
          <div className="text-sm text-gray-500 mb-1">End Date</div>
          <Skeleton height="h-5" width="w-24" />
        </div>
        {/* Status */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Status</div>
          <Skeleton height="h-5" width="w-16" />
        </div>
        {/* Participants Fields */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Participants Fields</div>
          <Skeleton height="h-5" width="w-16" />
        </div>
        {/* Staff Fields */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Staff Fields</div>
          <Skeleton height="h-5" width="w-16" />
        </div>
        {/* Hall Fields */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Hall Fields</div>
          <Skeleton height="h-5" width="w-16" />
        </div>
        {/* Course Fields */}
        <div>
          <div className="text-sm text-gray-500 mb-1">Course Fields</div>
          <Skeleton height="h-5" width="w-16" />
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/events/$eventId/$eventName/dashboard')({
  component: DashboardPage,
  pendingComponent: DashboardPageSkeleton,
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(getDashboardStatsQueryOptions());
  },
});

function DashboardPage() {
  const { eventId } = Route.useParams();
  const { isAdmin } = useAuth();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState('');
  const updateEventMutation = useUpdateEvent();

  const handleUpdateEvent = async (data: CreateEventInput) => {
    try {
      setError('');
      await updateEventMutation.mutateAsync({ id: event.id, ...data });
      setEditing(false);
    } catch (err: any) {
      setError(err.message || 'Failed to update event');
      console.error('Update event error:', err);
    }
  };

  // isAdmin from useAuth

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md">
          {error}
        </div>
      )}

      <div className="">
        {editing ? (
          <>
            <h2 className="text-2xl font-bold mb-6 text-balance">Edit Event</h2>
            {updateEventMutation.isPending && (
              <div className="mb-4 text-blue-600 text-sm">Updating event...</div>
            )}
            <EventForm
              initialData={{
                name: event.name,
                location: event.location || undefined,
                startDate: event.startDate,
                endDate: event.endDate,
                status: event.status,
                participantFields: event.participantFields,
                staffFields: event.staffFields,
                courseFields: event.courseFields,
                hallFields: event.hallFields,
              }}
              onSubmit={handleUpdateEvent}
              onCancel={() => setEditing(false)}
              submitLabel="Update Event"
            />
          </>
        ) : (
          <>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2 text-balance">{event.name}</h2>
                {event.location && (
                  <p className="text-gray-600">{event.location}</p>
                )}
              </div>
              {isAdmin && (
                <Button onClick={() => setEditing(true)}>
                  <CalendarCog className="inline mr-2" /> Edit Event
                </Button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <div className="text-sm text-gray-500 mb-1">Start Date</div>
                <div className="font-medium">
                  {new Date(event.startDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">End Date</div>
                <div className="font-medium">
                  {new Date(event.endDate).toLocaleDateString()}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Status</div>
                <div className={`font-medium ${event.status === 'ACTIVE' ? 'text-green-600' : 'text-gray-600'}`}>
                  {event.status}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Participants Fields</div>
                <div className="font-medium">{event.participantFields?.length || 0} fields</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Staff Fields</div>
                <div className="font-medium">{event.staffFields?.length || 0} fields</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Hall Fields</div>
                <div className="font-medium">{event.hallFields?.length || 0} fields</div>
              </div>
              <div>
                <div className="text-sm text-gray-500 mb-1">Course Fields</div>
                <div className="font-medium">{event.courseFields?.length || 0} fields</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
