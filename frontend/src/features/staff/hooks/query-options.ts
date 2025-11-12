import { queryOptions, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type {
  CreateStaffInput,
  UpdateStaffInput,
  UpdateBadgePrintInput,
} from '../types';

// Query options for getting all staff for an event
export const getStaffQueryOptions = (eventId: string) =>
  queryOptions({
    queryKey: ['staff', eventId],
    queryFn: async () => {
      return apiClient.listStaffForEvent(eventId);
    },
  });

// Query options for getting staff with filters
export const getStaffWithFiltersQueryOptions = (eventId: string, filters?: { search?: string; badgePrinted?: boolean; sortBy?: 'username' | 'createdAt'; order?: 'asc' | 'desc' }) =>
  queryOptions({
    queryKey: ['staff', eventId, filters],
    queryFn: async () => {
      return apiClient.listStaffWithFilters(eventId, filters);
    },
  });

// Query options for getting a single staff member
export const getStaffByIdQueryOptions = (staffId: string) =>
  queryOptions({
    queryKey: ['staff', staffId],
    queryFn: async () => {
      return apiClient.getStaff(staffId);
    },
  });

// Create staff mutation
export const useCreateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateStaffInput) => {
      return apiClient.createStaff(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

// Update staff mutation
export const useUpdateStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateStaffInput & { id: string }) => {
      return apiClient.updateStaff(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

// Update badge print mutation
export const useUpdateBadgePrint = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...data }: UpdateBadgePrintInput & { id: string }) => {
      return apiClient.updateStaffBadgePrint(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};

// Delete staff mutation
export const useDeleteStaff = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      await apiClient.deleteStaff(id);
      return { id, eventId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    },
  });
};
