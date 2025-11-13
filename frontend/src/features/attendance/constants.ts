/**
 * Attendance feature constants
 */

export const ATTENDANCE_QUERY_KEYS = {
  all: ['attendance'] as const,
  lists: () => [...ATTENDANCE_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { eventId?: string; participantId?: string; courseId?: string; salleId?: string }) =>
    [...ATTENDANCE_QUERY_KEYS.lists(), { filters }] as const,
  stats: (eventId: string) => [...ATTENDANCE_QUERY_KEYS.all, 'stats', eventId] as const,
} as const;
