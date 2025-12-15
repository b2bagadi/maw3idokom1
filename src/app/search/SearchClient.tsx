'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import SearchSidebar from '@/components/search/SearchSidebar';
import BusinessCard from '@/components/search/BusinessCard';
import { Button } from '@/components/ui/Button';
import { Map, List } from 'lucide-react';
import dynamic from 'next/dynamic';

const ResultsMap = dynamic(() => import('@/components/search/ResultsMap'), {
    ssr: false,
    loading: () => <div className="h-[600px] bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" />
});

function SearchContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    // Initial state from URL params
    const [filters, setFilters] = useState({
        q: searchParams.get('q') || '',
        category: searchParams.get('category') || '',
        minPrice: searchParams.get('minPrice') || '',
        maxPrice: searchParams.get('maxPrice') || '',
        rating: searchParams.get('rating') || '',
        sort: searchParams.get('sort') || '',
    });

    const [results, setResults] = useState<any[]>([]);
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');

    // Fetch Categories
    useEffect(() => {
        fetch('/api/categories?active=true')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setCategories(data);
                } else {
                    setCategories([]);
                }
            })
            .catch(() => setCategories([]));
    }, []);

    // Sync state with URL when Search sidebar changes
    useEffect(() => {
        const params = new URLSearchParams();
        if (filters.q) params.set('q', filters.q);
        if (filters.category) params.set('category', filters.category);
        if (filters.minPrice) params.set('minPrice', filters.minPrice);
        if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
        if (filters.rating) params.set('rating', filters.rating);
        if (filters.sort) params.set('sort', filters.sort);

        // Update URL without reload
        const newUrl = `/search?${params.toString()}`;
        window.history.replaceState(null, '', newUrl);

        // Fetch Results
        setIsLoading(true);
        fetch(`/api/search?${params.toString()}`)
            .then(res => res.json())
            .then(data => {
                setResults(data);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [filters]);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-8 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold">Search Results</h1>
                    <div className="flex gap-2">
                        <Button
                            variant={viewMode === 'list' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('list')}
                        >
                            <List size={18} className="mr-2" /> List
                        </Button>
                        <Button
                            variant={viewMode === 'map' ? 'primary' : 'ghost'}
                            size="sm"
                            onClick={() => setViewMode('map')}
                        >
                            <Map size={18} className="mr-2" /> Map
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row gap-8">
                    {/* Sidebar */}
                    <aside className="w-full lg:w-64 flex-shrink-0 bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm h-fit">
                        <SearchSidebar
                            filters={filters}
                            setFilters={setFilters}
                            categories={categories}
                        />
                    </aside>

                    {/* Results */}
                    <main className="flex-1">
                        {isLoading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                                ))}
                            </div>
                        ) : results.length > 0 ? (
                            viewMode === 'map' ? (
                                <ResultsMap businesses={results} />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {results.map((business: any) => (
                                        <BusinessCard key={business.id} business={business} />
                                    ))}
                                </div>
                            )
                        ) : (
                            <div className="text-center py-20 bg-white dark:bg-gray-800 rounded-xl">
                                <p className="text-gray-500 text-lg">No businesses found matching your criteria.</p>
                                <Button variant="ghost" className="mt-4" onClick={() => setFilters({ ...filters, q: '', category: '', minPrice: '', maxPrice: '', rating: '' })}>
                                    Clear All Filters
                                </Button>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}

export default function SearchClient() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading search...</div>} >
            <SearchContent />
        </Suspense>
    );
}