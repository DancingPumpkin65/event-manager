import { queryOptions } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const dashboardKeys = {
  all: ['dashboard'] as const,
  stats: () => [...dashboardKeys.all, 'stats'] as const,
};

export const getDashboardStatsQueryOptions = () =>
  queryOptions({
    queryKey: dashboardKeys.stats(),
    queryFn: () => apiClient.getDashboardStats(),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
