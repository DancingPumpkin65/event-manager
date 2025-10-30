/**
 * Course React Query hooks and query options
 */

import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { COURSE_QUERY_KEYS } from '../constants';
import { queryClient } from '@/lib/query-client';
import type { CreateCourseInput } from '../types';

/**
 * Query options for listing courses
 */
export const getCoursesQueryOptions = (
  eventId: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
  sortBy?: string,
  order?: 'asc' | 'desc'
) =>
  queryOptions({
    queryKey: [...COURSE_QUERY_KEYS.lists(), { page, limit, search, eventId, sortBy, order }],
    queryFn: () => apiClient.listCourses(eventId, page, limit, search, sortBy, order),
  });

/**
 * Query options for getting course registrations
 */
export const getCourseRegistrationsQueryOptions = (courseId: string) =>
  queryOptions({
    queryKey: COURSE_QUERY_KEYS.registrations(courseId),
    queryFn: () => apiClient.getCourseRegistrations(courseId),
  });

/**
 * Hook for creating course
 */
export function useCreateCourse() {
  return useMutation({
    mutationFn: (input: CreateCourseInput) => apiClient.createCourse(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.list(variables.eventId) });
    },
  });
}

/**
 * Hook for updating course
 */
export function useUpdateCourse() {
  return useMutation({
    mutationFn: ({ courseId, data }: { courseId: string; data: Partial<CreateCourseInput> }) =>
      apiClient.updateCourse(courseId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for deleting course
 */
export function useDeleteCourse() {
  return useMutation({
    mutationFn: (courseId: string) => apiClient.deleteCourse(courseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for registering participant to course
 */
export function useRegisterParticipant() {
  return useMutation({
    mutationFn: ({ participantId, courseId }: { participantId: string; courseId: string }) =>
      apiClient.registerParticipant(participantId, courseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.registrations(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for unregistering participant from course
 */
export function useUnregisterParticipant() {
  return useMutation({
    mutationFn: ({ participantId, courseId }: { participantId: string; courseId: string }) =>
      apiClient.unregisterParticipant(participantId, courseId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.registrations(variables.courseId) });
      queryClient.invalidateQueries({ queryKey: COURSE_QUERY_KEYS.lists() });
    },
  });
}
