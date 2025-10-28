/**
 * Badge React Query hooks and query options
 */

import { queryOptions, useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { BADGE_QUERY_KEYS } from '../constants';
import { queryClient } from '@/lib/query-client';
import type { CreateBadgeInput, ListBadgesFilter } from '../types';

/**
 * Query options for listing badges
 */
export const getBadgesQueryOptions = (filter?: ListBadgesFilter) =>
  queryOptions({
    queryKey: BADGE_QUERY_KEYS.list(filter),
    queryFn: () => apiClient.listBadges(filter),
  });

/**
 * Query options for getting a single badge
 */
export const getBadgeQueryOptions = (badgeId: string) =>
  queryOptions({
    queryKey: BADGE_QUERY_KEYS.detail(badgeId),
    queryFn: () => apiClient.getBadge(badgeId),
  });

/**
 * Query options for getting badge by barcode
 */
export const getBadgeByBarcodeQueryOptions = (barcode: string) =>
  queryOptions({
    queryKey: BADGE_QUERY_KEYS.byBarcode(barcode),
    queryFn: () => apiClient.getBadgeByBarcode(barcode),
  });

/**
 * Hook for creating badge
 */
export function useCreateBadge() {
  return useMutation({
    mutationFn: (input: CreateBadgeInput) => apiClient.createBadge(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: BADGE_QUERY_KEYS.lists() });
    },
  });
}
