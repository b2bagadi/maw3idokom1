'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface ImageUploadProps {
    onUploadComplete: (url: string, deleteUrl: string) => void;
    currentImageUrl?: string;
    currentDeleteUrl?: string;
    buttonText?: string;
    accept?: string;
    className?: string;
}

export function ImageUpload({
    onUploadComplete,
    currentImageUrl,
    currentDeleteUrl,
    buttonText = 'Upload Image',
    accept = 'image/*',
    className = '',
}: ImageUploadProps) {
    const [isUploading, setIsUploading] = useState(false);
    const [previewUrl, setPreviewUrl] = useState(currentImageUrl);
    const [isDragging, setIsDragging] = useState(false);

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB');
            return;
        }

        setIsUploading(true);

        try {
            // Delete old image if exists
            if (currentDeleteUrl) {
                await fetch('/api/delete/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleteUrl: currentDeleteUrl }),
                }).catch(err => console.warn('Failed to delete old image:', err));
            }

            // Upload new image
            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch('/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Upload failed');
            }

            setPreviewUrl(data.url);
            onUploadComplete(data.url, data.deleteUrl);
            toast.success('Image uploaded successfully');
        } catch (error: any) {
            toast.error(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleRemove = async () => {
        if (!currentDeleteUrl) return;

        try {
            await fetch('/api/delete/image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ deleteUrl: currentDeleteUrl }),
            });

            setPreviewUrl(undefined);
            onUploadComplete('', '');
            toast.success('Image removed');
        } catch (error) {
            toast.error('Failed to remove image');
        }
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {previewUrl && (
                <div className="relative w-32 h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 group">
                    <img
                        src={previewUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleRemove}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                        : 'border-gray-300 dark:border-gray-700'
                }`}
            >
                <Upload
                    className={`mx-auto mb-3 ${
                        isDragging ? 'text-blue-500' : 'text-gray-400'
                    }`}
                    size={32}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Drag and drop an image here, or
                </p>
                <label>
                    <input
                        type="file"
                        accept={accept}
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleFileSelect(file);
                        }}
                        disabled={isUploading}
                        className="hidden"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isUploading}
                        onClick={(e) => {
                            e.preventDefault();
                            (e.target as HTMLButtonElement).previousElementSibling?.dispatchEvent(
                                new MouseEvent('click')
                            );
                        }}
                    >
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 animate-spin" size={16} />
                                Uploading...
                            </>
                        ) : (
                            buttonText
                        )}
                    </Button>
                </label>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    Max file size: 5MB
                </p>
            </div>
        </div>
    );
}
