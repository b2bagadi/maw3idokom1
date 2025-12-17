'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Calendar, User, Clock } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useClientTranslation } from '@/i18n/client';
import { motion, AnimatePresence } from 'framer-motion';

interface BookingWidgetProps {
    businessId: string;
    services: any[];
    staff: any[];
}

export default function BookingWidget({ businessId, services, staff = [] }: BookingWidgetProps) {
    const { data: session } = useSession();
    const router = useRouter();
    const { t } = useClientTranslation();

    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedStaff, setSelectedStaff] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [slots, setSlots] = useState<string[]>([]);
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [isBooking, setIsBooking] = useState(false);

    // Auto-select first service
    useEffect(() => {
        if (services.length > 0 && !selectedService) {
            setSelectedService(services[0].id);
        }
    }, [services]);

    // Fetch slots
    useEffect(() => {
        if (!selectedService || !selectedDate) return;

        setIsLoading(true);
        const staffQuery = selectedStaff ? `&staffId=${selectedStaff}` : '';
        fetch(`/api/availability?businessId=${businessId}&date=${selectedDate}&serviceId=${selectedService}${staffQuery}`)
            .then(res => res.json())
            .then(data => {
                setSlots(Array.isArray(data) ? data : []);
                setIsLoading(false);
            })
            .catch(() => setIsLoading(false));
    }, [businessId, selectedDate, selectedService, selectedStaff]);

    const handleBook = async () => {
        if (!session) {
            toast.error(t('auth.loginRequired', { defaultValue: 'Please login to book' }));
            router.push('/login');
            return;
        }

        setIsBooking(true);
        try {
            const res = await fetch('/api/bookings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    businessId,
                    serviceId: selectedService,
                    date: selectedDate,
                    time: selectedSlot,
                    staffId: selectedStaff || null
                }),
            });

            if (!res.ok) throw new Error('Booking failed');

            toast.success(t('booking.success', { defaultValue: 'Appointment booked successfully!' }));
            router.push('/dashboard');
        } catch {
            toast.error(t('booking.error', { defaultValue: 'Failed to book appointment' }));
        } finally {
            setIsBooking(false);
        }
    };

    const currentService = services.find(s => s.id === selectedService);

    return (
        <div id="booking-widget" className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border dark:border-gray-700 p-6 sticky top-24 overflow-hidden">
            <h3 className="text-xl font-bold mb-6">{t('booking.title', { defaultValue: 'Book Appointment' })}</h3>

            <div className="space-y-6">

                {/* 1. Service Selection */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">1</div>
                        {t('booking.selectService', { defaultValue: 'Select Service' })}
                    </label>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {services.map(service => (
                            <motion.div
                                key={service.id}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => setSelectedService(service.id)}
                                className={`p-3 rounded-lg border cursor-pointer transition-all ${selectedService === service.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 ring-1 ring-primary-500'
                                    : 'hover:border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800'
                                    }`}
                            >
                                <div className="flex justify-between font-medium">
                                    <span>{service.name}</span>
                                    <span>{formatPrice(service.price)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                    <Clock size={12} /> {service.duration} {t('time.minutes', { defaultValue: 'mins' })}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* 2. Staff Selection (Optional) */}
                {staff.length > 0 && (
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">2</div>
                            {t('booking.selectStaff', { defaultValue: 'Select Staff (Optional)' })}
                        </label>
                        <div className="flex gap-3 overflow-x-auto pb-2">
                            <motion.div
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedStaff('')}
                                className={`flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg border ${!selectedStaff ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent'}`}
                            >
                                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User size={20} className="text-gray-500" />
                                </div>
                                <span className="text-xs text-center truncate w-full">{t('common.any', { defaultValue: 'Any' })}</span>
                            </motion.div>
                            {staff.map(member => (
                                <motion.div
                                    key={member.id}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setSelectedStaff(member.id)}
                                    className={`flex-shrink-0 w-20 flex flex-col items-center gap-2 cursor-pointer p-2 rounded-lg border ${selectedStaff === member.id ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-transparent'}`}
                                >
                                    <img
                                        src={member.avatarUrl || `https://ui-avatars.com/api/?name=${member.name}`}
                                        alt={member.name}
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                    <span className="text-xs text-center truncate w-full">{member.name}</span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 3. Date & Time */}
                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">{staff.length > 0 ? 3 : 2}</div>
                        {t('booking.selectDateTime', { defaultValue: 'Select Date & Time' })}
                    </label>

                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={18} />
                        <input
                            type="date"
                            min={new Date().toISOString().split('T')[0]}
                            value={selectedDate}
                            onChange={(e) => { setSelectedDate(e.target.value); setSelectedSlot(''); }}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary-500 outline-none"
                        />
                    </div>

                    <AnimatePresence>
                        {selectedDate && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="pt-2"
                            >
                                {isLoading ? (
                                    <div className="flex items-center justify-center p-4">
                                        <div className="animate-spin h-5 w-5 border-2 border-primary-500 rounded-full border-t-transparent" />
                                    </div>
                                ) : slots.length > 0 ? (
                                    <div className="grid grid-cols-3 gap-2">
                                        {slots.map(slot => (
                                            <button
                                                key={slot}
                                                onClick={() => setSelectedSlot(slot)}
                                                className={`py-2 px-1 text-sm rounded-md border transition-all ${selectedSlot === slot
                                                    ? 'bg-primary-600 text-white border-primary-600 shadow-md transform scale-105'
                                                    : 'hover:border-primary-500 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                                                    }`}
                                            >
                                                {slot}
                                            </button>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-sm text-center text-gray-500 py-2">{t('booking.noSlots', { defaultValue: 'No slots available' })}</p>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Summary & Action */}
                <div className="border-t dark:border-gray-700 pt-4 mt-6">
                    <div className="flex justify-between mb-4 text-sm">
                        <span>{t('booking.total', { defaultValue: 'Total' })}</span>
                        <span className="font-bold text-lg text-primary-600">{currentService ? formatPrice(currentService.price) : '-'}</span>
                    </div>

                    <Button
                        className="w-full relative overflow-hidden"
                        size="lg"
                        disabled={!selectedSlot || isBooking}
                        onClick={handleBook}
                        isLoading={isBooking}
                    >
                        {isBooking ? t('booking.processing', { defaultValue: 'Processing...' }) : t('booking.confirm', { defaultValue: 'Confirm Booking' })}
                    </Button>
                    {!session && (
                        <p className="text-xs text-center mt-2 text-gray-500">{t('auth.loginRequired', { defaultValue: 'You need to login to book' })}</p>
                    )}
                </div>
            </div>
        </div>
    );
}
