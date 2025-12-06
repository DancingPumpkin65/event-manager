import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery, useQuery } from '@tanstack/react-query'
import { getEventQueryOptions } from '@/features/event/hooks/query-options'
import { apiClient } from '@/lib/api-client'

export const Route = createFileRoute('/events/$eventId/$eventName/staff-portal/')({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId)),
    ]),
  component: StaffDashboard,
})

function StaffDashboard() {
  const { eventId, eventName } = Route.useParams()
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId))

  const { data: participantsData } = useQuery({
    queryKey: ['participants', eventId],
    queryFn: async () => apiClient.listParticipants(eventId),
  })

  const participants = (participantsData as any)?.participants || participantsData || [];

  return (
    <div className="space-y-8">

      {/* Event Info */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {eventName}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Info label="Start Date">
            {new Date(event.startDate).toLocaleDateString()}
          </Info>

          <Info label="End Date">
            {new Date(event.endDate).toLocaleDateString()}
          </Info>

          <Info label="Status">
            <span
              className={`inline-flex px-2 py-1 text-xs font-semibold rounded ${event.status === 'ACTIVE'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
                }`}
            >
              {event.status}
            </span>
          </Info>

          <Info label="Total Participants">
            {participants.length}
          </Info>
        </div>
      </div>
    </div>
  )
}

function Info({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <span className="text-sm text-gray-600">{label}:</span>
      <p className="font-medium text-gray-900 tabular-nums">{children}</p>
    </div>
  )
}
