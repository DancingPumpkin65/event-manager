/**
 * Course feature constants
 */

export const COURSE_QUERY_KEYS = {
  all: ['courses'] as const,
  lists: () => [...COURSE_QUERY_KEYS.all, 'list'] as const,
  list: (eventId: string) => [...COURSE_QUERY_KEYS.lists(), eventId] as const,
  registrations: (courseId: string) => [...COURSE_QUERY_KEYS.all, 'registrations', courseId] as const,
} as const;
