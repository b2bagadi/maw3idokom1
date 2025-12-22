'use client';

import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useClientTranslation } from '@/i18n/client';

interface RatingModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: string;
    rateeId: string;
    rateeName: string;
    onSuccess?: () => void;
}

export function RatingModal({ isOpen, onClose, bookingId, rateeId, rateeName, onSuccess }: RatingModalProps) {
    const { t } = useClientTranslation();
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/ratings/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookingId,
                    rating,
                    comment,
                    rateeId,
                }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || data.details || 'Failed to submit rating');
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error submitting rating:', error);
            alert(error.message || t('rating.submissionError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
                    >
                        <div className="p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {t('rating.rateExperience') || 'Rate Your Experience'}
                                </h3>
                                <button
                                    onClick={onClose}
                                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            <div className="text-center mb-8">
                                <p className="text-gray-600 dark:text-gray-300 mb-4">
                                    {t('rating.howWas') || 'How was your experience with'} <span className="font-semibold">{rateeName}</span>?
                                </p>

                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setRating(star)}
                                            onMouseEnter={() => setHoverRating(star)}
                                            onMouseLeave={() => setHoverRating(0)}
                                            className="focus:outline-none transition-transform hover:scale-110"
                                        >
                                            <Star
                                                size={32}
                                                fill={(hoverRating || rating) >= star ? '#eab308' : 'none'}
                                                className={(hoverRating || rating) >= star ? 'text-yellow-500' : 'text-gray-300 dark:text-gray-600'}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSubmit}>
                                <div className="mb-6">
                                    <label htmlFor="comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        {t('rating.commentLabel') || 'Share your feedback (optional)'}
                                    </label>
                                    <textarea
                                        id="comment"
                                        rows={4}
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        className="w-full rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3 text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none"
                                        placeholder={t('rating.commentPlaceholder') || 'Tell us what you liked or how we can improve...'}
                                        maxLength={500}
                                    />
                                    <div className="text-right text-xs text-gray-500 mt-1">
                                        {comment.length}/500
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={rating === 0 || isSubmitting}
                                    className="w-full py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-bold shadow-lg shadow-purple-500/30 hover:shadow-xl hover:scale-[1.01] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    {isSubmitting ? (t('common.submitting') || 'Submitting...') : (t('rating.submitBtn') || 'Submit Review')}
                                </button>
                            </form>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
