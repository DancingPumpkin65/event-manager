import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

interface UseBadgePrintOptions {
  type: 'participant' | 'staff';
  eventId?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function usePrintParticipantBadge(options?: Omit<UseBadgePrintOptions, 'type'>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ participantId, printedBy }: { participantId: string; printedBy: string }) => {
      return apiClient.updateParticipantBadgePrint(participantId, printedBy);
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch participant queries
      if (options?.eventId) {
        queryClient.invalidateQueries({ queryKey: ['participants', options.eventId] });
      }
      queryClient.invalidateQueries({ queryKey: ['participant', variables.participantId] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Failed to print participant badge:', error);
      options?.onError?.(error);
    },
  });
}

export function usePrintStaffBadge(options?: Omit<UseBadgePrintOptions, 'type'>) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ staffId, badgeId, printedBy }: { staffId: string; badgeId: string; printedBy: string }) => {
      return apiClient.updateStaffBadgePrint(staffId, { badgeId, printedBy });
    },
    onSuccess: (_data, variables) => {
      // Invalidate and refetch staff queries
      if (options?.eventId) {
        queryClient.invalidateQueries({ queryKey: ['staff', options.eventId] });
      }
      queryClient.invalidateQueries({ queryKey: ['staff', variables.staffId] });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      console.error('Failed to print staff badge:', error);
      options?.onError?.(error);
    },
  });
}
