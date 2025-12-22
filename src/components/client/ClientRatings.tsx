'use client';

import { useState, useEffect } from 'react';
import { Table } from '@/components/ui/Table';
import { RatingDisplay } from '@/components/rating/RatingDisplay';
import { formatDate } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

export default function ClientRatings() {
    const [ratings, setRatings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useClientTranslation();

    useEffect(() => {
        fetch('/api/ratings')
            .then(res => res.json())
            .then(data => {
                setRatings(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error('Failed to fetch ratings:', err);
                setIsLoading(false);
            });
    }, []);

    const columns = [
        {
            header: t('rating.sender', { defaultValue: 'From' }),
            accessor: (r: any) => r.rater.name
        },
        {
            header: t('common.rating'),
            accessor: (r: any) => (
                <RatingDisplay rating={r.rating} totalRatings={0} size={14} hideText />
            )
        },
        {
            header: t('rating.comment', { defaultValue: 'Comment' }),
            accessor: (r: any) => <span className="text-gray-600 dark:text-gray-400 italic">"{r.comment || 'No comment'}"</span>
        },
        {
            header: t('common.date'),
            accessor: (r: any) => formatDate(r.createdAt)
        }
    ];

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold">{t('rating.receivedRatings', { defaultValue: 'Ratings Received' })}</h2>
            <Table
                data={ratings}
                columns={columns}
                keyExtractor={r => r.id}
                isLoading={isLoading}
                emptyMessage={t('common.noReviews', { defaultValue: 'No ratings received yet' })}
            />
        </div>
    );
}
