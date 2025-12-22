'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ImageGalleryManager } from '@/components/ui/ImageGalleryManager';
import { Controller, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import MapPicker from '@/components/ui/MapPicker';
import { useClientTranslation } from '@/i18n/client';
import { RatingDisplay } from '@/components/rating/RatingDisplay';

interface Category {
    id: string;
    nameEn: string;
    nameAr: string;
}

export default function ProfileEditor() {
    const [isLoading, setIsLoading] = useState(true);
    const [galleryImages, setGalleryImages] = useState<Array<{ url: string, deleteUrl: string }>>([]);
    const [categoryId, setCategoryId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const { register, handleSubmit, control, setValue, watch, reset } = useForm();
    const { t } = useClientTranslation();

    const lat = watch('lat');
    const lng = watch('lng');

    useEffect(() => {
        Promise.all([
            fetch('/api/businesses').then(res => res.json()),
            fetch('/api/categories').then(res => res.json())
        ])
            .then(([businessData, categoriesData]) => {
                const galleryData = businessData.gallery?.map((img: any) => ({
                    url: img.url,
                    deleteUrl: img.deleteUrl || ''
                })) || [];
                setGalleryImages(galleryData);
                setCategoryId(businessData.categoryId || '');
                setCategories(categoriesData);
                setCategoryId(businessData.categoryId || '');
                setCategories(categoriesData);
                reset(businessData);
                // Set rating state if needed, or just use values from form/data
                setRatingInfo({ rating: businessData.averageRating || 0, count: businessData.totalReviews || 0 });
                setIsLoading(false);
            })
            .catch(() => toast.error(t('profile.failedLoad')));
    }, [reset, t]);

    const [ratingInfo, setRatingInfo] = useState({ rating: 0, count: 0 });

    const onSubmit = async (data: any) => {
        try {
            const res = await fetch('/api/businesses', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...data,
                    categoryId,
                }),
            });

            const responseData = await res.json();

            if (!res.ok) {
                throw new Error(responseData.message || responseData.error || 'Update failed');
            }

            toast.success(t('profile.profileUpdated'));
        } catch (error: any) {
            console.error('Update error:', error);
            toast.error(error.message || t('profile.failedUpdate'));
        }
    };

    if (isLoading) return <div className="h-40 bg-gray-100 animate-pulse rounded-lg" />;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-4xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <span className="font-semibold text-gray-700 dark:text-gray-200">{t('profile.yourRating', { defaultValue: 'Your Rating' })}</span>
                    <RatingDisplay rating={ratingInfo.rating} totalRatings={ratingInfo.count} size={20} />
                </div>

                <Input label={t('profile.businessName')} {...register('name')} required />
                <Input label={t('profile.phone')} {...register('phone')} required />

                <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">
                        Category
                    </label>
                    <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                        required
                    >
                        <option value="">Select a category</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>
                                {cat.nameEn}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('admin.logoUrl')}</label>
                    <ImageUpload
                        currentImageUrl={watch('logoUrl')}
                        currentDeleteUrl={watch('logoDeleteUrl')}
                        onUploadComplete={(url, deleteUrl) => {
                            setValue('logoUrl', url);
                            setValue('logoDeleteUrl', deleteUrl);
                        }}
                        buttonText={t('profile.uploadLogo')}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-2 dark:text-gray-300">{t('admin.heroImage')}</label>
                    <ImageUpload
                        currentImageUrl={watch('heroUrl')}
                        currentDeleteUrl={watch('heroDeleteUrl')}
                        onUploadComplete={(url, deleteUrl) => {
                            setValue('heroUrl', url);
                            setValue('heroDeleteUrl', deleteUrl);
                        }}
                        buttonText={t('profile.uploadHero')}
                    />
                </div>

                <div className="md:col-span-2">
                    <Input label={t('profile.address')} {...register('address')} required />
                </div>

                <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1 dark:text-gray-300">{t('profile.description')}</label>
                    <textarea
                        {...register('description')}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                    />
                </div>

                <div className="md:col-span-2 space-y-2">
                    <label className="block text-sm font-medium dark:text-gray-300">{t('profile.pickLocation')}</label>
                    <Controller
                        name="lat"
                        control={control}
                        render={() => (
                            <MapPicker
                                lat={lat}
                                lng={lng}
                                onLocationSelect={(newLat, newLng) => {
                                    setValue('lat', newLat);
                                    setValue('lng', newLng);
                                }}
                            />
                        )}
                    />
                </div>
            </div>

            <div className="space-y-4">
                <label className="block text-sm font-medium dark:text-gray-300">{t('profile.gallery')}</label>
                <ImageGalleryManager
                    images={galleryImages}
                    onImagesUpdate={setGalleryImages}
                />
            </div>

            <div className="flex justify-end">
                <Button type="submit">{t('schedule.saveChanges')}</Button>
            </div>
        </form>
    );
}