import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/events')({
  // No auth check here - staff-portal handles its own auth by showing login form
  component: EventsLayout,
});

function EventsLayout() {
  return <Outlet />;
}
