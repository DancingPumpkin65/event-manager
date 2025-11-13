import { useEffect, useState } from 'react';

type SortByOption = 'checkInTime' | 'createdAt';
type OrderOption = 'asc' | 'desc';

interface AttendanceFiltersProps {
    currentSearch?: string;
    currentSortBy?: SortByOption;
    currentOrder?: OrderOption;
    onSearchChange: (value: string) => void;
    onSortByChange: (value: SortByOption) => void;
    onOrderChange: (value: OrderOption) => void;
}

export default function AttendanceFilters({
    currentSearch = '',
    currentSortBy = 'checkInTime',
    currentOrder = 'desc',
    onSearchChange,
    onSortByChange,
    onOrderChange,
}: AttendanceFiltersProps) {
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

    return (
        <div className="bg-white mb-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Search Input */}
                <div className="md:col-span-2">
                    <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                    </label>
                    <input
                        id="search"
                        type="text"
                        value={localSearch}
                        onChange={(e) => setLocalSearch(e.target.value)}
                        placeholder="Search by participant name..."
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
                        <option value="checkInTime">Check-In Time</option>
                        <option value="createdAt">Date Created</option>
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
