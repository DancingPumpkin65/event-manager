import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { ATTENDANCE_QUERY_KEYS } from '../constants';

export const getAttendanceListQueryOptions = (
  eventId: string,
  page: number = 1,
  limit: number = 10,
  participantId?: string,
  courseId?: string,
  hallId?: string,
  sortBy?: 'checkInTime' | 'createdAt',
  order?: 'asc' | 'desc'
) =>
  queryOptions({
    queryKey: [...ATTENDANCE_QUERY_KEYS.list({ eventId, participantId, courseId }), { page, limit, sortBy, order }],
    queryFn: () => apiClient.listAttendance({ eventId, page, limit, participantId, courseId, hallId, sortBy, order }),
  });

export const getAttendanceStatsQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ATTENDANCE_QUERY_KEYS.stats(eventId),
    queryFn: () => apiClient.getAttendanceStats(eventId),
  });
