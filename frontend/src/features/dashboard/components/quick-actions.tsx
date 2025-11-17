import { Link } from '@tanstack/react-router';
import { Card } from '@/components/ui';

export function QuickActions() {
  const actions = [
    {
      title: 'Manage Events',
      description: 'Create and manage your events',
      icon: (
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      href: '/admin/events',
      color: 'bg-blue-500',
    },
  ];

  return (
    <Card>
      <Card.Header>
        <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
      </Card.Header>
      <Card.Body>
        <div className="space-y-3">
          {actions.map((action) => (
            <Link key={action.href} to={action.href} className="block">
              <div className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition group">
                <div className={`${action.color} p-3 rounded-lg text-white`}>
                  {action.icon}
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-gray-900 group-hover:text-blue-600">
                    {action.title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {action.description}
                  </p>
                </div>
                <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}
