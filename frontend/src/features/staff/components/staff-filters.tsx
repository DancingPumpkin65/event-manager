import { useEffect, useState } from 'react';

type BadgeFilter = 'all' | 'printed' | 'not-printed';
type SortByOption = 'username' | 'createdAt';
type OrderOption = 'asc' | 'desc';

interface StaffFiltersProps {
  currentSearch?: string;
  currentStatus?: BadgeFilter;
  currentSortBy?: SortByOption;
  currentOrder?: OrderOption;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: BadgeFilter) => void;
  onSortByChange: (value: SortByOption) => void;
  onOrderChange: (value: OrderOption) => void;
}

export default function StaffFilters({
  currentSearch = '',
  currentStatus = 'all',
  currentSortBy = 'createdAt',
  currentOrder = 'desc',
  onSearchChange,
  onStatusChange,
  onSortByChange,
  onOrderChange,
}: StaffFiltersProps) {
  const [localSearch, setLocalSearch] = useState(currentSearch);

  useEffect(() => {
    setLocalSearch(currentSearch);
  }, [currentSearch]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== currentSearch) {
        onSearchChange(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, currentSearch, onSearchChange]);

  return (
    <div className="bg-white mb-6 space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, email, username..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Badge Status Filter */}
        <div>
          <label htmlFor="badge-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Badge Status
          </label>
          <select
            id="badge-filter"
            value={currentStatus}
            onChange={(e) => onStatusChange(e.target.value as BadgeFilter)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All</option>
            <option value="printed">Badges Printed</option>
            <option value="not-printed">Badges Not Printed</option>
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label htmlFor="sort-by" className="block text-sm font-medium text-gray-700 mb-1">
            Sort By
          </label>
          <select
            id="sort-by"
            value={currentSortBy}
            onChange={(e) => onSortByChange(e.target.value as SortByOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="createdAt">Creation Date</option>
            <option value="username">Username</option>
          </select>
        </div>

        {/* Order */}
        <div>
          <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-1">
            Order
          </label>
          <select
            id="order"
            value={currentOrder}
            onChange={(e) => onOrderChange(e.target.value as OrderOption)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>
    </div>
  );
}
