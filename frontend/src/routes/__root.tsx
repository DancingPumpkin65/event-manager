import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/router-devtools';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@/lib/query-client';
import { Toaster } from 'sonner';
import { ErrorBoundary } from '@/components/ErrorBoundary';

export const Route = createRootRoute({
  component: RootComponent,
  context: () => ({
    queryClient,
  }),
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
      <Toaster />
      {process.env.NODE_ENV === 'development' && (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      )}
    </QueryClientProvider>
  );
}
