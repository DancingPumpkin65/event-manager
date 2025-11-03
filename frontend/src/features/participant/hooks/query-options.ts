/**
 * Participant React Query hooks and query options
 */

import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { PARTICIPANT_QUERY_KEYS } from '../constants';
import { queryClient } from '@/lib/query-client';
import type { CreateParticipantInput, UpdateParticipantInput } from '../types';

/**
 * Query options for listing participants
 */
export const getParticipantsQueryOptions = (
  eventId: string,
  page: number = 1,
  limit: number = 10,
  search?: string,
  status?: string,
  badgePrinted?: boolean,
  sortBy?: string,
  order?: 'asc' | 'desc'
) =>
  queryOptions({
    queryKey: [...PARTICIPANT_QUERY_KEYS.list(eventId), { page, limit, search, status, badgePrinted, sortBy, order }],
    queryFn: () => apiClient.listParticipants(eventId, page, limit, search, status, badgePrinted, sortBy, order),
  });

/**
 * Query options for getting a single participant
 */
export const getParticipantQueryOptions = (participantId: string) =>
  queryOptions({
    queryKey: PARTICIPANT_QUERY_KEYS.detail(participantId),
    queryFn: () => apiClient.getParticipant(participantId),
  });

/**
 * Hook for creating participant
 */
export function useCreateParticipant() {
  return useMutation({
    mutationFn: (input: CreateParticipantInput) => apiClient.createParticipant(input),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.list(variables.eventId) });
    },
  });
}

/**
 * Hook for updating participant
 */
export function useUpdateParticipant() {
  return useMutation({
    mutationFn: (input: UpdateParticipantInput) => apiClient.updateParticipant(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.list(data.eventId) });
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.detail(data.id) });
    },
  });
}

/**
 * Hook for deleting participant
 */
export function useDeleteParticipant() {
  return useMutation({
    mutationFn: (participantId: string) => apiClient.deleteParticipant(participantId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.lists() });
    },
  });
}

/**
 * Hook for bulk importing participants
 */
export function useBulkCreateParticipants() {
  return useMutation({
    mutationFn: ({ eventId, participants }: { eventId: string; participants: Array<{ participantFields: Record<string, any> }> }) =>
      apiClient.bulkCreateParticipants(eventId, participants),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.list(variables.eventId) });
    },
  });
}

/**
 * Hook for updating badge print information
 */
export function useUpdateBadgePrint() {
  return useMutation({
    mutationFn: ({
      participantId,
      badgeId,
      printedBy,
    }: {
      participantId: string;
      badgeId: string;
      printedBy: string;
    }) =>
      apiClient.updateParticipantBadgePrint(participantId, printedBy, badgeId),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.list(data.eventId) });
      queryClient.invalidateQueries({ queryKey: PARTICIPANT_QUERY_KEYS.detail(data.id) });
    },
  });
}
