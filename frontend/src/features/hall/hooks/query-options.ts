import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateSalleInput, UpdateSalleInput } from '@/features/salle/types';

export const hallKeys = {
    all: ['halls'] as const,
    lists: () => [...hallKeys.all, 'list'] as const,
    listByEvent: (eventId: string) => [...hallKeys.lists(), { eventId }] as const,
    details: () => [...hallKeys.all, 'detail'] as const,
    detail: (id: string) => [...hallKeys.details(), id] as const,
};

export const getHallsQueryOptions = (eventId: string) =>
    queryOptions({
        queryKey: hallKeys.listByEvent(eventId),
        queryFn: () => apiClient.listHallsForEvent(eventId),
    });

export const getSallesQueryOptions = (
    page: number = 1,
    limit: number = 10,
    eventId?: string,
    search?: string,
    sortBy?: string,
    order?: 'asc' | 'desc'
) =>
    queryOptions({
        queryKey: [...hallKeys.lists(), { page, limit, eventId, search, sortBy, order }],
        queryFn: () => apiClient.listSalles(page, limit, eventId, search, sortBy, order),
    });

export function useCreateHall() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (input: CreateSalleInput) => apiClient.createSalle(input),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hallKeys.listByEvent(variables.eventId) });
        },
    });
}

export function useUpdateHall() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; eventId: string; data: UpdateSalleInput }) =>
            apiClient.updateSalle(id, data),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hallKeys.detail(variables.id) });
            queryClient.invalidateQueries({ queryKey: hallKeys.listByEvent(variables.eventId) });
        },
    });
}

export function useDeleteHall() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id }: { id: string; eventId: string }) => apiClient.deleteSalle(id),
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: hallKeys.listByEvent(variables.eventId) });
        },
    });
}
