import { createFileRoute } from '@tanstack/react-router';
import { useSuspenseQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import { apiClient } from '@/lib/api-client';

// Lazy load the heavy BadgeLayoutEditor component (includes JsBarcode, canvas rendering)
const BadgeLayoutEditor = lazy(() => import('@/features/badge/components/BadgeLayoutEditor'));

// Loading fallback for the editor
function EditorLoadingFallback() {
  return (
    <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading Badge Editor...</p>
      </div>
    </div>
  );
}

export const Route = createFileRoute(
  '/admin/events/$eventId/$eventName/badge-layout',
)({
  component: BadgeLayoutPage,
  loader: ({ context, params }) => {
    return context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId));
  },
});

function BadgeLayoutPage() {
  const { eventId } = Route.useParams();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const queryClient = useQueryClient();

  // Get participant and staff fields from event
  const participantFields = event.participantFields || [];
  const staffFields = event.staffFields || [];

  // Mutation to update event badge layout
  const updateEventMutation = useMutation({
    mutationFn: (badgeLayout: any) => apiClient.updateEvent({ id: eventId, badgeLayout }),
    onSuccess: () => {
      // Invalidate event query to refresh data
      queryClient.invalidateQueries({ queryKey: getEventQueryOptions(eventId).queryKey });
    },
    onError: (error) => {
      console.error('Failed to save badge layout:', error);
    }
  });

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2 text-balance">Badge Layout Editor</h1>
          <p className="text-gray-600">
            Customize the PDF badge layout for {event.name}
          </p>
        </div>
      </div>

      {/* Editor - Lazy loaded with Suspense */}
      <div className="bg-white pt-8">
        <Suspense fallback={<EditorLoadingFallback />}>
          <BadgeLayoutEditor
            participantFields={participantFields}
            staffFields={staffFields}
            initialConfig={event.badgeLayout as any}
            onSave={(config) => {
              updateEventMutation.mutate(config);
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}
