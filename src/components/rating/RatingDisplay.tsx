'use client';

import { Star, StarHalf } from 'lucide-react';

interface RatingDisplayProps {
    rating: number;
    totalRatings?: number; // Optional count
    size?: number;
    showCount?: boolean;
    className?: string;
}

export function RatingDisplay({ rating, totalRatings, size = 16, showCount = true, className = '' }: RatingDisplayProps) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div className="flex text-yellow-500">
                {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} size={size} fill="currentColor" />
                ))}
                {hasHalfStar && <StarHalf size={size} fill="currentColor" />}
                {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} size={size} className="text-gray-300 dark:text-gray-600" />
                ))}
            </div>
            {showCount && totalRatings !== undefined && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                    ({totalRatings})
                </span>
            )}
        </div>
    );
}
