/**
 * Event React Query hooks and query options
 */

import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { EVENT_QUERY_KEYS } from '../constants';
import { queryClient } from '@/lib/query-client';
import type { CreateEventInput, UpdateEventInput } from '../types';

/**
 * Query options for listing events
 */
export const getEventsQueryOptions = (isActive?: boolean) =>
  queryOptions({
    queryKey: EVENT_QUERY_KEYS.list({ isActive }),
    queryFn: () => apiClient.listEvents(isActive),
  });

/**
 * Query options for getting a single event
 */
export const getEventQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: EVENT_QUERY_KEYS.detail(eventId),
    queryFn: () => apiClient.getEvent(eventId),
  });

/**
 * Hook for creating event
 */
export function useCreateEvent() {
  return useMutation({
    mutationFn: (input: CreateEventInput) => apiClient.createEvent(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for updating event
 */
export function useUpdateEvent() {
  return useMutation({
    mutationFn: (input: UpdateEventInput) => apiClient.updateEvent(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.detail(variables.id) });
    },
  });
}

/**
 * Hook for deleting event
 */
export function useDeleteEvent() {
  return useMutation({
    mutationFn: (eventId: string) => apiClient.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EVENT_QUERY_KEYS.lists() });
    },
  });
}
