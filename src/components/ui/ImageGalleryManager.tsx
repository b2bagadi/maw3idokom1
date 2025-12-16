'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Upload, X, Loader2 } from 'lucide-react';
import { Button } from './Button';

interface GalleryImage {
    url: string;
    deleteUrl: string;
}

interface ImageGalleryManagerProps {
    images: GalleryImage[];
    onImagesUpdate: (images: GalleryImage[]) => void;
    maxImages?: number;
    businessId?: string;
    autoSave?: boolean;
}

export function ImageGalleryManager({
    images,
    onImagesUpdate,
    maxImages = 12,
    autoSave = true,
}: ImageGalleryManagerProps) {
    const [isUploading, setIsUploading] = useState(false);

    const handleFileSelect = async (file: File) => {
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast.error('File size must be under 5MB');
            return;
        }

        if (images.length >= maxImages) {
            toast.error(`Maximum ${maxImages} images allowed`);
            return;
        }

        setIsUploading(true);

        try {
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

            const newImage = { url: data.url, deleteUrl: data.deleteUrl };
            const newImages = [...images, newImage];
            
            if (autoSave) {
                await saveGalleryToDatabase(newImages);
                toast.success('Image uploaded and saved');
            } else {
                toast.success('Image uploaded');
            }
            
            onImagesUpdate(newImages);
        } catch (error: any) {
            console.error('=== UPLOAD ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            toast.error(error.message || 'Upload failed');
        } finally {
            setIsUploading(false);
        }
    };

    const saveGalleryToDatabase = async (galleryImages: GalleryImage[]) => {
        console.log('=== SAVING GALLERY ===');
        console.log('Gallery images:', galleryImages);

        try {
            const res = await fetch('/api/businesses/gallery', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ gallery: galleryImages }),
            });

            console.log('Response status:', res.status);
            console.log('Response ok:', res.ok);

            const data = await res.json();
            console.log('Response data:', data);
            
            if (!res.ok) {
                const errorMsg = data.message || data.error || JSON.stringify(data);
                console.error('Save failed with error:', errorMsg);
                throw new Error(errorMsg);
            }

            console.log('Gallery saved successfully');
        } catch (error: any) {
            console.error('=== SAVE GALLERY ERROR ===');
            console.error('Error:', error);
            console.error('Error message:', error.message);
            throw new Error(`Failed to save gallery: ${error.message}`);
        }
    };

    const handleRemove = async (index: number) => {
        const image = images[index];

        try {
            if (image.deleteUrl) {
                await fetch('/api/delete/image', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ deleteUrl: image.deleteUrl }),
                }).catch(err => console.warn('Failed to delete image:', err));
            }

            const newImages = images.filter((_, i) => i !== index);
            
            if (autoSave) {
                await saveGalleryToDatabase(newImages);
                toast.success('Image removed and saved');
            } else {
                toast.success('Image removed');
            }
            
            onImagesUpdate(newImages);
        } catch (error: any) {
            console.error('Remove error:', error);
            toast.error(error.message || 'Failed to remove image');
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((image, index) => (
                    <div
                        key={index}
                        className="relative aspect-video rounded-lg overflow-hidden group border border-gray-200 dark:border-gray-700"
                    >
                        <img
                            src={image.url}
                            alt={`Gallery ${index + 1}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={() => handleRemove(index)}
                            className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}

                {images.length < maxImages && (
                    <div className="aspect-video bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center p-4">
                        {isUploading ? (
                            <Loader2 className="animate-spin text-gray-400" size={32} />
                        ) : (
                            <>
                                <Upload className="text-gray-400 mb-2" size={24} />
                                <label className="cursor-pointer">
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0];
                                            if (file) handleFileSelect(file);
                                        }}
                                        disabled={isUploading}
                                        className="hidden"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        disabled={isUploading}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            const input = (e.target as HTMLButtonElement)
                                                .closest('label')
                                                ?.querySelector('input[type="file"]');
                                            input?.click();
                                        }}
                                    >
                                        Add Image
                                    </Button>
                                </label>
                            </>
                        )}
                    </div>
                )}
            </div>

            {images.length > 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {images.length} / {maxImages} images
                </p>
            )}
        </div>
    );
}