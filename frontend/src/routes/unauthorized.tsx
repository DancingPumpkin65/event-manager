import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui';

export const Route = createFileRoute('/unauthorized')({
  component: UnauthorizedPage,
});

import puneBg from '@/assets/Pune.webp';

function UnauthorizedPage() {
  return (
    <div
      className="min-h-dvh flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative bg-slate-100"
      style={{
        backgroundImage: `url(${puneBg})`,
        backgroundPosition: 'bottom center',
        backgroundRepeat: 'no-repeat',
        backgroundSize: '100% auto',
      }}
    >
      <div className="mb-8 max-w-md w-full space-y-8 text-center relative z-10">
        <div>
          <h2 className="text-3xl font-extrabold text-gray-900 text-balance">
            Access Denied
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            You do not have permission to access this page.
          </p>
        </div>
        <div className="mt-8 sm:mt-8 flex justify-center gap-4">
          <Link to="/login">
            <Button variant="primary">Go to Login</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
