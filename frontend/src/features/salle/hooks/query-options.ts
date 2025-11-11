import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { CreateSalleInput, UpdateSalleInput } from '../types';

export const salleKeys = {
  all: ['salles'] as const,
  lists: () => [...salleKeys.all, 'list'] as const,
  list: () => [...salleKeys.lists()] as const,
  details: () => [...salleKeys.all, 'detail'] as const,
  detail: (id: string) => [...salleKeys.details(), id] as const,
};

export const getSallesQueryOptions = () =>
  queryOptions({
    queryKey: salleKeys.list(),
    queryFn: () => apiClient.listSalles(),
  });

export const getSalleQueryOptions = (salleId: string) =>
  queryOptions({
    queryKey: salleKeys.detail(salleId),
    queryFn: () => apiClient.getSalle(salleId),
  });

export function useCreateSalle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (input: CreateSalleInput) => apiClient.createSalle(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salleKeys.lists() });
    },
  });
}

export function useUpdateSalle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSalleInput }) => 
      apiClient.updateSalle(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: salleKeys.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: salleKeys.lists() });
    },
  });
}

export function useDeleteSalle() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (salleId: string) => apiClient.deleteSalle(salleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salleKeys.lists() });
    },
  });
}
