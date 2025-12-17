'use client';

import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

export default function ReviewsList() {
    const [reviews, setReviews] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useClientTranslation();

    useEffect(() => {
        fetch('/api/businesses')
            .then(res => res.json())
            .then(business => {
                if (business.id) {
                    return fetch(`/api/reviews?businessId=${business.id}`);
                }
                throw new Error('No business found');
            })
            .then(res => res.json())
            .then(data => {
                setReviews(data);
                setIsLoading(false);
            })
            .catch((e) => {
                console.error(e);
                setIsLoading(false);
            });
    }, []);

    if (isLoading) return <div>{t('reviews.loadingReviews')}</div>;

    if (reviews.length === 0) return <div className="text-gray-500">{t('reviews.noReviewsYet')}</div>;

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-bold mb-4">{t('reviews.reviews')}</h2>
            <div className="grid gap-4">
                {reviews.map((review) => (
                    <div key={review.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <p className="font-semibold">{review.client.name}</p>
                                <p className="text-xs text-gray-500">{formatDate(review.createdAt)}</p>
                            </div>
                            <div className="flex text-yellow-500">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={16} fill={i < review.rating ? "currentColor" : "none"} strokeWidth={1.5} />
                                ))}
                            </div>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}