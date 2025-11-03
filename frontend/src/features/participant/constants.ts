/**
 * Participant feature constants
 */

export const PARTICIPANT_QUERY_KEYS = {
  all: ['participants'] as const,
  lists: () => [...PARTICIPANT_QUERY_KEYS.all, 'list'] as const,
  list: (eventId: string) => [...PARTICIPANT_QUERY_KEYS.lists(), eventId] as const,
  details: () => [...PARTICIPANT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...PARTICIPANT_QUERY_KEYS.details(), id] as const,
} as const;
