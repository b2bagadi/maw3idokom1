'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface Column<T> {
    header: ReactNode;
    accessor: keyof T | ((item: T) => ReactNode);
    className?: string;
}

interface TableProps<T> {
    data: T[];
    columns: Column<T>[];
    keyExtractor: (item: T) => string;
    isLoading?: boolean;
    emptyMessage?: string;
    onRowClick?: (item: T) => void;
    pagination?: {
        currentPage: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    };
}

export function Table<T>({
    data,
    columns,
    keyExtractor,
    isLoading,
    emptyMessage = 'No data available',
    onRowClick,
    pagination,
}: TableProps<T>) {
    if (isLoading) {
        return (
            <div className="w-full space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                {emptyMessage}
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="overflow-hidden md:overflow-x-auto md:rounded-lg md:border md:border-gray-200 md:dark:border-gray-700 md:bg-white md:dark:bg-gray-800">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 block md:table">
                    <thead className="bg-gray-50 dark:bg-gray-900 hidden md:table-header-group">
                        <tr>
                            {columns.map((col, idx) => (
                                <th
                                    key={idx}
                                    className={cn(
                                        'px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider',
                                        col.className
                                    )}
                                >
                                    {col.header}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="bg-transparent md:bg-white md:dark:bg-gray-800 divide-y-0 md:divide-y divide-gray-200 dark:divide-gray-700 block md:table-row-group space-y-4 md:space-y-0">
                        {data.map((item) => (
                            <tr
                                key={keyExtractor(item)}
                                onClick={() => onRowClick?.(item)}
                                className={cn(
                                    'transition-colors block md:table-row bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 md:border-0 shadow-sm md:shadow-none overflow-hidden',
                                    onRowClick
                                        ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700'
                                        : 'md:hover:bg-gray-50 md:dark:hover:bg-gray-900/50'
                                )}
                            >
                                {columns.map((col, idx) => (
                                    <td
                                        key={idx}
                                        className={cn(
                                            'px-4 py-3 md:px-6 md:py-4 whitespace-normal md:whitespace-nowrap text-sm text-gray-900 dark:text-gray-100 flex justify-between items-center md:table-cell md:items-start border-b border-gray-100 dark:border-gray-700/50 last:border-0 md:border-0',
                                            col.className
                                        )}
                                        data-label={col.header}
                                    >
                                        <span className="font-medium text-gray-500 dark:text-gray-400 md:hidden flex-shrink-0 mr-4">
                                            {col.header}
                                        </span>
                                        <div className="text-right md:text-left flex-grow">
                                            {typeof col.accessor === 'function'
                                                ? col.accessor(item)
                                                : (item[col.accessor] as ReactNode)}
                                        </div>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
                        disabled={pagination.currentPage === 1}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
                        disabled={pagination.currentPage === pagination.totalPages}
                        className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 dark:text-gray-400"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            )}
        </div>
    );
}
