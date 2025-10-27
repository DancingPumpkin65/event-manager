/**
 * Auth React Query hooks and query options
 */

import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { AUTH_QUERY_KEYS } from '../constants';
import { queryClient } from '@/lib/query-client';
import type { LoginInput, RegisterInput } from '../types';

/**
 * Query options for getting current session
 */
export const getSessionQueryOptions = () =>
  queryOptions({
    queryKey: AUTH_QUERY_KEYS.session(),
    queryFn: () => apiClient.getSession(),
    retry: false,
    staleTime: Infinity, // Session doesn't change unless we mutate it
  });

/**
 * Hook for register mutation
 */
export function useRegister() {
  return useMutation({
    mutationFn: (input: RegisterInput) => apiClient.register(input),
    onSuccess: () => {
      // Invalidate session query to refetch with new user
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.session() });
    },
  });
}

/**
 * Hook for login mutation
 */
export function useLogin() {
  return useMutation({
    mutationFn: (input: LoginInput) => apiClient.login(input),
    onSuccess: () => {
      // Invalidate session query to refetch with new session
      queryClient.invalidateQueries({ queryKey: AUTH_QUERY_KEYS.session() });
    },
  });
}

/**
 * Hook for logout mutation
 */
export function useLogout() {
  return useMutation({
    mutationFn: () => apiClient.logout(),
    onSuccess: () => {
      // Clear all queries on logout
      queryClient.clear();
    },
  });
}
