import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const EVENT_STATS_QUERY_KEYS = {
    all: ['event-stats'] as const,
    summary: (eventId: string) => [...EVENT_STATS_QUERY_KEYS.all, 'summary', eventId] as const,
    badges: (eventId: string, status: 'CONFIRMED' | 'PENDING') =>
        [...EVENT_STATS_QUERY_KEYS.all, 'badges', eventId, status] as const,
    courses: (eventId: string) => [...EVENT_STATS_QUERY_KEYS.all, 'courses', eventId] as const,
};

export const getEventStatsQueryOptions = (eventId: string) =>
    queryOptions({
        queryKey: EVENT_STATS_QUERY_KEYS.summary(eventId),
        queryFn: () => apiClient.getEventStatsSummary(eventId),
    });

export const getBadgeListQueryOptions = (
    eventId: string,
    status: 'CONFIRMED' | 'PENDING',
    page: number = 1,
    limit: number = 10
) =>
    queryOptions({
        queryKey: [...EVENT_STATS_QUERY_KEYS.badges(eventId, status), { page, limit }],
        queryFn: () => apiClient.getBadgeList(eventId, status, page, limit),
    });

export const getCoursesWithAttendeesQueryOptions = (eventId: string) =>
    queryOptions({
        queryKey: EVENT_STATS_QUERY_KEYS.courses(eventId),
        queryFn: () => apiClient.getCoursesWithAttendees(eventId),
    });
