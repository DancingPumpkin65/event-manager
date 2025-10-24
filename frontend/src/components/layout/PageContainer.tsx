import { type ReactNode } from 'react';
import Breadcrumbs, { type BreadcrumbItem } from '@/components/layout/Breadcrumbs';

export interface PageContainerProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  actions?: ReactNode;
  children: ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
  className?: string;
}

const PageContainer = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  maxWidth = '7xl',
  className = '',
}: PageContainerProps) => {
  const maxWidthClass = maxWidth === 'full' ? 'max-w-full' : `max-w-${maxWidth}`;

  return (
    <div className="min-h-dvh bg-gray-50">
      {/* Page Header */}
      <div className="bg-white border-b">
        <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-6`}>
          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumbs items={breadcrumbs} className="mb-4" />
          )}
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex-1 min-w-0 pt-4">
              <h1 className="text-3xl font-bold text-gray-900 truncate text-balance">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">
                  {subtitle}
                </p>
              )}
            </div>
            
            {actions && (
              <div className="flex items-center gap-2 flex-shrink-0">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Page Content */}
      <div className={`${maxWidthClass} mx-auto px-4 sm:px-6 lg:px-8 py-8 ${className}`}>
        {children}
      </div>
    </div>
  );
};

export default PageContainer;
