import { useEffect, useState } from 'react';

type SortByOption = 'startDate' | 'createdAt';
type OrderOption = 'asc' | 'desc';

interface CourseFiltersProps {
  currentSearch?: string;
  currentSortBy?: SortByOption;
  currentOrder?: OrderOption;
  onSearchChange: (value: string) => void;
  onSortByChange: (value: SortByOption) => void;
  onOrderChange: (value: OrderOption) => void;
}

export function CourseFilters({
  currentSearch = '',
  currentSortBy = 'startDate',
  currentOrder = 'asc',
  onSearchChange,
  onSortByChange,
  onOrderChange
}: CourseFiltersProps) {
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
    <div className="mb-6">
      <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="">
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            Search
          </label>
          <input
            id="search"
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            <option value="startDate">Start Date</option>
            <option value="createdAt">Creation Date</option>
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
            <option value="asc">Ascending</option>
            <option value="desc">Descending</option>
          </select>
        </div>
      </div>
    </div>
  );
}
