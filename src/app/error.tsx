'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/Button';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="text-center max-w-md">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold mb-2">Something went wrong!</h2>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                    An unexpected error occurred. Please try again.
                </p>
                <div className="flex gap-4 justify-center">
                    <Button onClick={reset}>Try Again</Button>
                    <Button variant="ghost" onClick={() => window.location.href = '/'}>
                        Go Home
                    </Button>
                </div>
            </div>
        </div>
    );
}
