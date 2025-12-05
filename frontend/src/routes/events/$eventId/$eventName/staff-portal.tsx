import { createFileRoute, Link, Outlet, useNavigate, useLocation } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { useStaffAuth } from '@/context/StaffContext';
import { apiClient } from '@/lib/api-client';
import { getEventQueryOptions } from '@/features/event/hooks/query-options';
import {
    LayoutDashboard,
    Users,
    ScanLine,
    LogOut,
    Menu,
    X,
    Lock,
    UserStar,
    LogIn,
    UserCheck
} from 'lucide-react';
import { Alert, Button, Card, Input, SkeletonLoader, SkeletonStaffPortal } from '@/components/ui';
import { useAuth } from '@/context/AuthContext';

export const Route = createFileRoute('/events/$eventId/$eventName/staff-portal')({
    component: StaffPortalLayout,
    loader: async ({ context, params }) => {
        // Try to prefetch event data, but don't block if it fails (e.g., not authenticated yet)
        try {
            await context.queryClient.ensureQueryData(getEventQueryOptions(params.eventId));
        } catch {
            // Ignore errors - component will handle authentication
        }
    },
});

function StaffPortalLayout() {
    const { eventId, eventName } = Route.useParams();
    const { staff, logout, isAuthenticated, isLoading: isAuthLoading } = useStaffAuth();
    const { userType } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { data: event, isLoading: isEventLoading, error } = useQuery(getEventQueryOptions(eventId));
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    // Force logout if staff is authenticated but for a different event
    useEffect(() => {
        if (!isAuthLoading && isAuthenticated && staff && staff.eventId !== eventId) {
            logout();
        }
    }, [isAuthLoading, isAuthenticated, staff, eventId, logout]);

    // Show loading while checking auth
    if (isAuthLoading) {
        return <SkeletonStaffPortal />;
    }

    // If not authenticated as staff (or mismatched event), show login form
    // Use eventName from URL params as fallback if event data not loaded
    if (!isAuthenticated || userType !== 'staff') {
        return <StaffLoginForm eventId={eventId} eventName={eventName} event={event || { name: decodeURIComponent(eventName) }} />;
    }

    // Show loading while fetching event data (after authentication)
    if (isEventLoading) {
        return <SkeletonLoader text="Loading event data..." />;
    }

    // Handle error loading event (after authentication)
    if (error || !event) {
        return (
            <div className="min-h-dvh flex items-center justify-center">
                <div className="text-center">
                    <p className="text-red-600">Failed to load event data</p>
                    <Button onClick={() => navigate({ to: '/' })} className="mt-4">Go Home</Button>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        navigate({ to: `/events/${eventId}/${eventName}/staff-portal` });
    };

    const closeSidebar = () => setIsSidebarOpen(false);

    const navItems = [
        { to: '', icon: LayoutDashboard, label: 'Dashboard', exact: true },
        { to: 'participants', icon: Users, label: 'Participants' },
        { to: 'scan', icon: ScanLine, label: 'Data entry' },
        { to: 'attendance', icon: UserCheck, label: 'Attendance' },
    ];

    // Check if current route matches
    const isActiveRoute = (to: string, exact?: boolean) => {
        const basePath = `/events/${eventId}/${eventName}/staff-portal`;
        const targetPath = to ? `${basePath}/${to}` : basePath;
        if (exact) {
            return location.pathname === targetPath || location.pathname === `${targetPath}/`;
        }
        return location.pathname.startsWith(targetPath);
    };

    return (
        <div className="min-h-dvh bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Top Navigation Bar */}
            <nav className="sticky top-0 z-30 safe-top">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-4">
                            {/* Mobile menu button */}
                            <button
                                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                                className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                                aria-label="Toggle menu"
                            >
                                {isSidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                            </button>

                            {/* Breadcrumb */}
                            <div className="hidden md:flex items-center gap-2 text-sm">
                                <span className="text-gray-900 font-medium">Staff Portal</span>
                            </div>
                        </div>

                        {/* User Menu */}
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
                                <div className="w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-xs font-medium">
                                        {staff?.staffFields?.firstName?.charAt(0).toUpperCase() || 'S'}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-700 font-medium">
                                    {staff?.staffFields?.firstName || staff?.username || 'Staff'}
                                </span>
                                <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                                    STAFF
                                </span>
                            </div>
                            <Button variant='danger' size="sm" onClick={handleLogout} title="Logout" leftIcon={<LogOut className="h-5 w-5 mr-2" />}>
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
                                                <span className="inline-flex items-center gap-1">
                                                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                                                    Staff Portal
                                                </span>
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
                                        const isActive = isActiveRoute(item.to, item.exact);
                                        const href = item.to
                                            ? `/events/${eventId}/${eventName}/staff-portal/${item.to}`
                                            : `/events/${eventId}/${eventName}/staff-portal`;
                                        return (
                                            <Link
                                                key={item.to || 'dashboard'}
                                                to={href}
                                                className={`
                          flex items-center gap-3 px-3 py-2.5 rounded-md mb-1 transition-all
                          ${isActive
                                                        ? 'bg-green-100 text-green-700 font-medium'
                                                        : 'text-gray-600 hover:bg-white hover:text-gray-900'
                                                    }
                        `}
                                                onClick={closeSidebar}
                                            >
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-600'}`} />
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

// Staff Login Form component
function StaffLoginForm({
    eventId,
    eventName,
    event
}: {
    eventId: string;
    eventName: string;
    event: { name: string }
}) {
    const navigate = useNavigate();
    const { login } = useStaffAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await apiClient.staffLogin({
                username,
                password,
                eventId,
            });

            login(response.staff);

            // Navigate will cause re-render and show the portal
            navigate({
                to: '/events/$eventId/$eventName/staff-portal',
                params: { eventId, eventName },
            });
        } catch (err: any) {
            setError(err.message || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
            <Card className="max-w-md w-full mx-4">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2 text-balance">Staff Portal</h1>
                    <p className="text-gray-600">{event.name}</p>
                </div>

                {error && (
                    <Alert type="error" className="mb-6">
                        {error}
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-5 flex flex-col items-center justify-center">
                    <Input
                        id="username"
                        type="text"
                        label="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your username"
                        required
                        fullWidth
                        leftIcon={<UserStar className="w-5 h-5 mr-2" />}
                    />

                    <Input
                        id="password"
                        type="password"
                        label="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        fullWidth
                        leftIcon={<Lock className="w-5 h-5 mr-2" />}
                    />

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        size="lg"
                        leftIcon={<LogIn className="w-5 h-5 mr-2" />}
                        className="!py-2 !px-6"
                    >
                        Sign In
                    </Button>
                </form>
            </Card>
        </div>
    );
}

