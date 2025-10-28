/**
 * Badge feature constants
 */

export const BADGE_QUERY_KEYS = {
  all: ['badges'] as const,
  lists: () => [...BADGE_QUERY_KEYS.all, 'list'] as const,
  list: (filters?: { eventId?: string; participantId?: string; courseId?: string }) =>
    [...BADGE_QUERY_KEYS.lists(), { filters }] as const,
  details: () => [...BADGE_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...BADGE_QUERY_KEYS.details(), id] as const,
  byBarcode: (barcode: string) => [...BADGE_QUERY_KEYS.all, 'barcode', barcode] as const,
} as const;
