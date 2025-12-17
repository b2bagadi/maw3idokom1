'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewModalProps {
    bookingId: string;
    isOpen: boolean;
    onClose: () => void;
    onReviewSubmitted: () => void;
}

export default function ReviewModal({ bookingId, isOpen, onClose, onReviewSubmitted }: ReviewModalProps) {
    const { register, handleSubmit, reset, setValue, watch } = useForm({
        defaultValues: { rating: 5, comment: '' }
    });
    const rating = watch('rating');

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, ...data }),
            });
            if (!res.ok) throw new Error('Failed');

            toast.success('Review submitted');
            onReviewSubmitted();
            onClose();
            reset();
        } catch {
            toast.error('Failed to submit review');
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Write a Review">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">Rating</label>
                    <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onClick={() => setValue('rating', star)}
                                className="focus:outline-none"
                            >
                                <Star
                                    size={24}
                                    fill={star <= rating ? "gold" : "none"}
                                    stroke={star <= rating ? "gold" : "gray"}
                                    className="transition-colors"
                                />
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">Comment</label>
                    <textarea
                        {...register('comment')}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                        placeholder="Share your experience..."
                    />
                </div>

                <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Submit Review</Button>
                </div>
            </form>
        </Modal>
    );
}
