import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useSuspenseQuery } from '@tanstack/react-query';
import { getDashboardStatsQueryOptions } from '@/features/dashboard/hooks/query-options';
import { StatCard, RecentEvents, QuickActions } from '@/features/dashboard/components';
import { Button, SkeletonDashboard } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';
import { Link } from '@tanstack/react-router';
import { LogOut, Calendar, Zap } from 'lucide-react';

export const Route = createFileRoute('/admin/dashboard')({
  component: DashboardPage,
  pendingComponent: () => <SkeletonDashboard />,
  errorComponent: ({ error }) => (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-red-600 mb-4">Dashboard Error</h1>
      <p className="text-gray-600">{error.message}</p>
    </div>
  ),
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(getDashboardStatsQueryOptions());
  },
});

function DashboardPage() {
  const { user, logout, userType } = useAuth();
  const navigate = useNavigate();
  const { data: stats } = useSuspenseQuery(getDashboardStatsQueryOptions());

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <div className="min-h-dvh bg-slate-100">
      {/* Top Navigation Bar */}
      <nav className="sticky top-0 z-40 bg-slate-100 safe-top">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Breadcrumb */}
              <div className="hidden md:flex items-center gap-2 text-sm">
                <Link
                  to="/admin/dashboard"
                  className="text-gray-900 font-medium hover:text-blue-600 transition-colors"
                >
                  Home
                </Link>
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
              <Button variant='danger' size="sm" onClick={handleLogout} title="Logout"
                leftIcon={<LogOut className="h-5 w-5 mr-2" />}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Statistics Cards */}
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <QuickActions />
          <RecentEvents events={stats.recentEvents} />
          <StatCard
            title="Total Events"
            value={stats.totalEvents}
            icon={<Calendar className="w-8 h-8 text-blue-600" />}
            color="blue"
          />
          <StatCard
            title="Active Events"
            value={stats.activeEvents}
            icon={<Zap className="w-8 h-8 text-green-600" />}
            color="green"
          />
        </div>
      </div>
      {/* Recent Events and Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      </div>
    </div>
  );
}
