import { type HTMLAttributes } from 'react';

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Width of the skeleton. Can be a Tailwind class or CSS value */
  width?: string;
  /** Height of the skeleton. Can be a Tailwind class or CSS value */
  height?: string;
  /** Make the skeleton circular (for avatars) */
  circle?: boolean;
  /** Animation style */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton loading placeholder component
 * Shows a pulsing placeholder while content is loading
 */
export function Skeleton({
  width,
  height,
  circle = false,
  animation = 'pulse',
  className = '',
  style,
  ...props
}: SkeletonProps) {
  const animationClass = {
    pulse: 'animate-pulse',
    shimmer: 'animate-shimmer bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_100%]',
    none: '',
  }[animation];

  const baseClasses = `bg-gray-200 ${animationClass} ${circle ? 'rounded-full' : 'rounded'}`;
  
  // Handle Tailwind classes vs CSS values
  const widthClass = width?.startsWith('w-') ? width : '';
  const heightClass = height?.startsWith('h-') ? height : '';
  
  const inlineStyle = {
    ...style,
    ...(width && !width.startsWith('w-') ? { width } : {}),
    ...(height && !height.startsWith('h-') ? { height } : {}),
  };

  return (
    <div
      className={`${baseClasses} ${widthClass} ${heightClass} ${className}`}
      style={Object.keys(inlineStyle).length > 0 ? inlineStyle : undefined}
      aria-hidden="true"
      {...props}
    />
  );
}

/**
 * Skeleton text line - matches typical text line height
 */
export function SkeletonText({ 
  lines = 1, 
  className = '',
  lastLineWidth = '75%' 
}: { 
  lines?: number; 
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="h-4"
          width={i === lines - 1 && lines > 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton for stat cards on dashboards
 */
export function SkeletonStatCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 space-y-3">
          <Skeleton height="h-4" width="w-24" />
          <Skeleton height="h-8" width="w-16" />
        </div>
        <Skeleton height="h-12" width="w-12" circle />
      </div>
    </div>
  );
}

/**
 * Skeleton for table rows
 */
export function SkeletonTableRow({ 
  columns = 4,
  className = '' 
}: { 
  columns?: number;
  className?: string;
}) {
  return (
    <tr className={className}>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton height="h-4" width={i === 0 ? 'w-20' : 'w-full'} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Skeleton for a full table with header and rows
 */
export function SkeletonTable({ 
  columns = 4, 
  rows = 5,
  className = '' 
}: { 
  columns?: number; 
  rows?: number;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {Array.from({ length: columns }).map((_, i) => (
              <th key={i} className="px-4 py-3 text-left">
                <Skeleton height="h-3" width="w-20" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {Array.from({ length: rows }).map((_, i) => (
            <SkeletonTableRow key={i} columns={columns} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Skeleton for card list items (like event cards)
 */
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-2 flex-1">
          <Skeleton height="h-5" width="w-3/4" />
          <Skeleton height="h-4" width="w-1/2" />
        </div>
        <Skeleton height="h-6" width="w-16" className="rounded-full" />
      </div>
      <SkeletonText lines={2} className="mb-4" />
      <div className="flex gap-2">
        <Skeleton height="h-8" width="w-20" />
        <Skeleton height="h-8" width="w-20" />
      </div>
    </div>
  );
}

/**
 * Full page loading skeleton with optional title
 */
export function SkeletonPage({ 
  title = true,
  stats = 0,
  table = false,
  tableColumns = 4,
  tableRows = 5,
  cards = 0,
}: { 
  title?: boolean;
  stats?: number;
  table?: boolean;
  tableColumns?: number;
  tableRows?: number;
  cards?: number;
}) {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Page header */}
      {title && (
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-48" />
          <Skeleton height="h-4" width="w-64" />
        </div>
      )}

      {/* Stat cards */}
      {stats > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: stats }).map((_, i) => (
            <SkeletonStatCard key={i} />
          ))}
        </div>
      )}

      {/* Table */}
      {table && <SkeletonTable columns={tableColumns} rows={tableRows} />}

      {/* Cards grid */}
      {cards > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: cards }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Centered loading skeleton (replaces spinner)
 */
export function SkeletonLoader({ 
  text = 'Loading...',
  showText = true,
}: { 
  text?: string;
  showText?: boolean;
}) {
  return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="text-center space-y-4">
        {/* Animated loading indicator */}
        <div className="flex items-center justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
        {showText && (
          <p className="text-gray-600 text-sm">{text}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Dashboard-specific skeleton
 */
export function SkeletonDashboard() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton height="h-8" width="w-48" />
          <Skeleton height="h-4" width="w-32" />
        </div>
        <div className="flex gap-2">
          <Skeleton height="h-10" width="w-32" />
          <Skeleton height="h-10" width="w-24" />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Content area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content - recent items */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <Skeleton height="h-6" width="w-40" className="mb-4" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-gray-100 rounded-lg">
                <Skeleton height="h-12" width="w-12" circle />
                <div className="flex-1 space-y-2">
                  <Skeleton height="h-4" width="w-3/4" />
                  <Skeleton height="h-3" width="w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar - quick actions */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <Skeleton height="h-6" width="w-32" className="mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} height="h-10" width="100%" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Staff portal specific skeleton
 */
export function SkeletonStaffPortal() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md mx-4">
        <div className="text-center space-y-4">
          {/* Logo placeholder */}
          <Skeleton height="h-16" width="w-16" circle className="mx-auto" />
          
          {/* Title */}
          <Skeleton height="h-8" width="w-40" className="mx-auto" />
          <Skeleton height="h-4" width="w-48" className="mx-auto" />
          
          {/* Form fields */}
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Skeleton height="h-4" width="w-20" />
              <Skeleton height="h-10" width="100%" />
            </div>
            <div className="space-y-2">
              <Skeleton height="h-4" width="w-20" />
              <Skeleton height="h-10" width="100%" />
            </div>
            <Skeleton height="h-10" width="100%" className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}
