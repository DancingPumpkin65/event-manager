/**
 * Event feature constants
 */

export const EVENT_QUERY_KEYS = {
  all: ['events'] as const,
  lists: () => [...EVENT_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { isActive?: boolean }) => [...EVENT_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...EVENT_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...EVENT_QUERY_KEYS.details(), id] as const,
} as const;
