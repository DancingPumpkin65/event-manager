import Button from './Button';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

export function Pagination({ page, totalPages, onPageChange, className = '' }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className={`flex items-center justify-center space-x-2 mt-4 ${className}`}>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
                className="!px-2"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <span className="text-sm text-gray-600 tabular-nums">
                Page {page} of {totalPages}
            </span>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
                className="!px-2"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
