import { createFileRoute, Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import {
  DoorClosed,
  IdCardLanyard,
  LayoutDashboard,
  Presentation,
  UserCheck,
  User,
  UserStar,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react';
import { Button, Skeleton } from '@/components/ui';

// Skeleton for event layout - only shows skeleton for dynamic content (event name, status, user info)
// Static navigation items don't need skeletons since they're not loaded from data
function EventLayoutSkeleton() {
  const navLabels = ['Dashboard', 'Participants', 'Staff', 'Courses', 'Halls', 'Badge Layout', 'Attendance'];
  
  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Breadcrumb - only event name is skeleton (dynamic) */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <span className="text-gray-500">Home</span>
                <span className="text-gray-400">›</span>
                <span className="text-gray-500">Events</span>
                <span className="text-gray-400">›</span>
                <Skeleton height="h-4" width="w-32" />
              </div>
            </div>
            {/* User Menu - skeleton for dynamic user info */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <Skeleton height="h-6" width="w-6" circle />
                <Skeleton height="h-4" width="w-20" />
                <Skeleton height="h-5" width="w-12" className="rounded" />
              </div>
              <Skeleton height="h-9" width="w-20" className="rounded-lg" />
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 relative">
          {/* Sidebar - only event name/status are skeletons, nav items are static text */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
              {/* Event Header - skeleton for dynamic event name and status */}
              <div className="p-4 border-b border-gray-100">
                <Skeleton height="h-5" width="w-3/4" className="mb-2" />
                <div className="flex items-center gap-1">
                  <Skeleton height="h-2" width="w-2" circle />
                  <Skeleton height="h-3" width="w-16" />
                </div>
              </div>
              {/* Navigation Items - static text, no skeletons needed */}
              <nav className="p-2">
                {navLabels.map((label) => (
                  <div key={label} className="flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 text-gray-400">
                    <div className="w-5 h-5 bg-gray-200 rounded" />
                    <span className="text-sm">{label}</span>
                  </div>
                ))}
              </nav>
            </div>
          </aside>

          {/* Main content area skeleton */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="space-y-6">
                {/* Page header */}
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton height="h-8" width="w-48" />
                    <Skeleton height="h-4" width="w-32" />
                  </div>
                  <Skeleton height="h-10" width="w-32" className="rounded-lg" />
                </div>
                {/* Content placeholder - generic cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="border border-gray-100 rounded-lg p-4 space-y-2">
                      <Skeleton height="h-4" width="w-24" />
                      <Skeleton height="h-6" width="w-16" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

export const Route = createFileRoute('/admin/events/$eventId/$eventName')({
  component: RouteComponent,
  pendingComponent: EventLayoutSkeleton,
})

function RouteComponent() {
  const { eventId } = Route.useParams();
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: event } = useSuspenseQuery(getEventQueryOptions(eventId));
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Check if we're on a staff-portal or login route - these should render without admin layout
  const isStaffRoute = location.pathname.includes('/staff-portal') || location.pathname.includes('/login');

  // For staff routes, render just the outlet without admin navigation
  if (isStaffRoute) {
    return <Outlet key={location.pathname} />;
  }

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  const eventName = event.name.toLowerCase().replace(/\s+/g, '-');
  const closeSidebar = () => setIsSidebarOpen(false);

  const navItems = [
    { to: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: 'participants', icon: User, label: 'Participants' },
    { to: 'staff', icon: UserStar, label: 'Staff' },
    { to: 'courses', icon: Presentation, label: 'Courses' },
    { to: 'halls', icon: DoorClosed, label: 'Halls' },
    { to: 'badge-layout', icon: IdCardLanyard, label: 'Badge Layout' },
    { to: 'attendance', icon: UserCheck, label: 'Attendance' },
  ];

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                aria-label="Toggle menu"
              >
                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </button>

              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Link
                  to="/admin/dashboard"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <Link
                  to="/admin/events"
                  className="text-gray-500 hover:text-blue-600 transition-colors"
                >
                  Events
                </Link>
                <ChevronLeft className="w-4 h-4 text-gray-400 rotate-180" />
                <span className="text-gray-900 font-medium truncate max-w-[200px]">
                  {event.name}
                </span>
              </div>
            </div>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-medium">
                    {user?.username?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <span className="text-sm text-gray-700 font-medium">{user?.username}</span>
                <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                  {userType?.toUpperCase()}
                </span>
              </div>
              <Button variant='danger' size='sm' onClick={handleLogout} title='Logout'
                leftIcon={<LogOut className="h-5 w-5 mr-2" />}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-4 relative">
          {/* Mobile sidebar overlay */}
          {isSidebarOpen && (
            <div
              className="fixed inset-0 bg-black/50 z-40 lg:hidden"
              onClick={closeSidebar}
            />
          )}

          {/* Sidebar */}
          <aside
            className={`
              fixed lg:static inset-y-0 left-0 z-50 lg:z-30
              w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out
              ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
              lg:transform-none
            `}
          >
            <div className="h-full lg:h-auto overflow-y-auto bg-white lg:bg-transparent">
              {/* Sidebar Card */}
              <div className="m-4 lg:m-0">
                {/* Event Header */}
                <div className="py-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{event.name}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {event.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                            Active Event
                          </span>
                        ) : (
                          <span className="text-gray-400">Inactive</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={closeSidebar}
                      className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                      aria-label="Close menu"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Navigation Items */}
                <nav className="p-2">
                  {navItems.map((item) => {
                    const isActive = location.pathname.includes(`/${item.to}`);
                    const href = `/admin/events/${event.id}/${eventName}/${item.to}`;
                    return (
                      <Link
                        key={item.to}
                        to={href}
                        className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all
                          ${isActive
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-600 hover:bg-white hover:text-gray-900'
                          }
                        `}
                        onClick={closeSidebar}
                      >
                        <item.icon className={`w-5 h-5 ${isActive ? `text-blue-600` : `text-gray-600`}`} />
                        <span className="text-sm">{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main content */}
          <main className="flex-1 min-w-0">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Outlet key={location.pathname} />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
