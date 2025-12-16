'use client';

import { useClientTranslation } from '@/i18n/client';
import { Star, MapPin, Clock } from 'lucide-react'; // Added icons for better UI
import { formatDate, formatPrice } from '@/lib/utils';
import BookingWidget from '@/components/business/BookingWidget';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Reusing types roughly or defining interface
interface BusinessDetailsProps {
    business: any; // Using any for speed, ideally proper type
}

export default function BusinessDetails({ business }: BusinessDetailsProps) {
    const { t } = useClientTranslation();
    const [selectedImage, setSelectedImage] = useState<string | null>(null);

    return (
        <>
            {/* Gallery Section */}
            {business.gallery && business.gallery.length > 0 && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                        <h2 className="text-xl font-bold mb-4">{t('business.gallery', { defaultValue: 'Gallery' })}</h2>

                        {/* Featured Layout / Slider Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                            {business.gallery.map((img: any, index: number) => (
                                <motion.div
                                    key={img.id}
                                    className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => setSelectedImage(img.url)}
                                >
                                    <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Lightbox Overlay */}
            <AnimatePresence>
                {selectedImage && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
                        onClick={() => setSelectedImage(null)}
                    >
                        <motion.img
                            src={selectedImage}
                            className="max-w-full max-h-screen rounded"
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                        />
                        <button className="absolute top-4 right-4 text-white text-4xl">&times;</button>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 mb-20 relative z-10">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* Left Column: Info, Services, Reviews */}
                    <div className="flex-1 space-y-8">

                        {/* About Section */}
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-4">{t('business.description', { defaultValue: 'About' })}</h2>
                            <p className="text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {business.description || t('business.noDescription', { defaultValue: 'No description available.' })}
                            </p>
                            <div className="mt-4 flex flex-wrap items-center gap-4 text-gray-500">
                                <div className="flex items-center gap-2">
                                    <MapPin size={18} />
                                    <span>{business.address}</span>
                                </div>
                                <a
                                    href={`https://www.google.com/maps/dir/?api=1&destination=${
                                        business.lat && business.lng
                                            ? `${business.lat},${business.lng}`
                                            : encodeURIComponent(business.address)
                                    }`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium hover:underline flex items-center gap-1"
                                >
                                    Get Directions
                                </a>
                            </div>
                        </section>

                        {/* Services List */}
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
                            <h2 className="text-2xl font-bold mb-6">{t('business.services', { defaultValue: 'Services' })}</h2>
                            <div className="divide-y dark:divide-gray-700">
                                {business.services.length > 0 ? business.services.map((service: any) => (
                                    <div key={service.id} className="py-4 flex justify-between items-center group">
                                        <div>
                                            <h3 className="font-semibold text-lg">{service.name}</h3>
                                            <p className="text-gray-500 text-sm">
                                                {service.duration} {t('time.minutes', { defaultValue: 'mins' })} • {service.description}
                                            </p>
                                        </div>
                                        <div className="font-bold text-primary-600">
                                            {formatPrice(service.price)}
                                        </div>
                                    </div>
                                )) : (
                                    <p className="text-gray-500">{t('business.noServices', { defaultValue: 'No services available' })}</p>
                                )}
                            </div>
                        </section>

                        {/* Reviews Section */}
                        <section className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-sm">
                            <div className="flex items-center gap-3 mb-8">
                                <h2 className="text-2xl font-bold">{t('business.reviews', { defaultValue: 'Reviews' })}</h2>
                                <div className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-500 px-3 py-1 rounded-full font-bold flex items-center">
                                    <Star size={16} fill="currentColor" strokeWidth={0} className="mr-1" />
                                    {business.averageRating.toFixed(1)}
                                </div>
                                <span className="text-gray-500">({business._count.reviews} {t('business.reviews', { defaultValue: 'reviews' }).toLowerCase()})</span>
                            </div>

                            <div className="space-y-6">
                                {business.reviews.map((review: any) => (
                                    <div key={review.id} className="border-b dark:border-gray-700 pb-6 last:border-0 last:pb-0">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="font-semibold">{review.client.name}</span>
                                            <span className="text-sm text-gray-400">{formatDate(review.createdAt)}</span>
                                        </div>
                                        <div className="flex text-yellow-400 mb-2">
                                            {[...Array(5)].map((_, i) => (
                                                <Star key={i} size={14} fill={i < review.rating ? "currentColor" : "none"} />
                                            ))}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-300">{review.comment}</p>
                                    </div>
                                ))}
                                {business.reviews.length === 0 && (
                                    <p className="text-gray-500 italic">{t('business.noReviews', { defaultValue: 'No reviews yet.' })}</p>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Right Column: Sticky Booking Widget */}
                    <aside className="w-full lg:w-96 flex-shrink-0">
                        <BookingWidget businessId={business.id} services={business.services} staff={business.staff} />
                    </aside>

                </div>
            </main>
        </>
    );
}
