import { useEffect, useState } from 'react';

type SortByOption = 'createdAt' | 'status';
type OrderOption = 'asc' | 'desc';

interface ParticipantFiltersProps {
  currentSearch?: string;
  currentStatus?: string;
  currentBadgePrinted?: boolean;
  currentSortBy?: SortByOption;
  currentOrder?: OrderOption;
  onSearchChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onSortByChange: (value: SortByOption) => void;
  onOrderChange: (value: OrderOption) => void;
}

export default function ParticipantFilters({
  currentSearch = '',
  currentStatus,
  currentBadgePrinted,
  currentSortBy = 'createdAt',
  currentOrder = 'desc',
  onSearchChange,
  onStatusChange,
  onSortByChange,
  onOrderChange,
}: ParticipantFiltersProps) {
  // Local state for debounce
  const [localSearch, setLocalSearch] = useState(currentSearch);

  // Sync local search with prop
  useEffect(() => {
    setLocalSearch(currentSearch);
  }, [currentSearch]);

  // Debounce search change
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== currentSearch) {
        onSearchChange(localSearch);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange, currentSearch]);

  // Helper to determine current select value
  const getFilterValue = () => {
    if (currentBadgePrinted === true) return 'printed';
    if (currentBadgePrinted === false) return 'not-printed';
    if (currentStatus) return currentStatus;
    return 'all';
  };

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
            placeholder="Search participants..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status/Badge Filter */}
        <div>
          <label htmlFor="badge-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status & Badge
          </label>
          <select
            id="badge-filter"
            value={getFilterValue()}
            onChange={(e) => onStatusChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Participants</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
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
            <option value="status">Status</option>
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
