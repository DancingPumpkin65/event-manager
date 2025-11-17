import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui';
import type { EventOutput } from '@/features/event/types';

interface RecentEventsProps {
  events: EventOutput[];
}

export function RecentEvents({ events }: RecentEventsProps) {
  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
      </Card.Header>
      <Card.Body>
        {events.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No events yet</p>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link
                key={event.id}
                to="/admin/events/$eventId/$eventName/dashboard" 
                params={{ eventId: event.id, eventName: event.name }}
                className="block group"
              >
                <div className="flex items-start justify-between p-3 rounded-lg hover:bg-gray-50 transition">
                  <div className="flex-1 min-w-0 pt-4">
                    <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600 truncate">
                      {event.name}
                    </h4>
                    {event.location && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {event.location}
                      </p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        {new Date(event.startDate).toLocaleDateString()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        event.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        'bg-red-100 text-red-700'
                      }`}>
                        {event.status}
                      </span>
                    </div>
                  </div>
                  <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 flex-shrink-0 ml-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card.Body>
    </Card>
  );
}
