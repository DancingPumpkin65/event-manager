import { RouterProvider, createRouter } from '@tanstack/react-router';
import { AuthProvider } from './context/AuthContext';
import { StaffProvider } from './context/StaffContext';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a new router instance
const queryClient = new QueryClient();
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StaffProvider>
          <RouterProvider router={router} />
        </StaffProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
