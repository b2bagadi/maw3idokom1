export default function Loading() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
            <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4" />
                <p className="text-lg text-gray-600 dark:text-gray-400">Loading...</p>
            </div>
        </div>
    );
}
