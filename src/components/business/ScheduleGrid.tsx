'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { toast } from 'sonner';
import { generateTimeSlots } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

const TIME_SLOTS = generateTimeSlots(30);

interface ScheduleItem {
    id: string;
    dayOfWeek: number;
    openTime: string;
    closeTime: string;
    isClosed: boolean;
}

export default function ScheduleGrid() {
    const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useClientTranslation();

    const DAYS = [
        t('schedule.sunday'),
        t('schedule.monday'),
        t('schedule.tuesday'),
        t('schedule.wednesday'),
        t('schedule.thursday'),
        t('schedule.friday'),
        t('schedule.saturday'),
    ];

    useEffect(() => {
        fetch('/api/schedule')
            .then(res => res.json())
            .then(data => {
                setSchedule(data);
                setIsLoading(false);
            })
            .catch(() => toast.error(t('schedule.failedLoad')));
    }, [t]);

    const handleSave = async () => {
        try {
            const res = await fetch('/api/schedule', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(schedule),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(t('schedule.scheduleUpdated'));
        } catch {
            toast.error(t('schedule.failedUpdate'));
        }
    };

    const updateDay = (index: number, field: keyof ScheduleItem, value: any) => {
        const newSchedule = [...schedule];
        newSchedule[index] = { ...newSchedule[index], [field]: value };
        setSchedule(newSchedule);
    };

    if (isLoading) return <div className="h-60 bg-gray-100 animate-pulse rounded-lg" />;

    const timeOptions = TIME_SLOTS.map(t => ({ value: t, label: t }));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">{t('schedule.weeklySchedule')}</h2>
                <Button onClick={handleSave}>{t('schedule.saveChanges')}</Button>
            </div>

            <div className="border rounded-lg divide-y bg-white dark:bg-gray-800 dark:divide-gray-700">
                {schedule.map((item, index) => (
                    <div key={item.id || index} className="p-4 flex items-center gap-4 flex-wrap sm:flex-nowrap">
                        <div className="w-32 font-medium">{DAYS[item.dayOfWeek]}</div>

                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{t('schedule.closed')}</span>
                            <Switch
                                checked={!item.isClosed}
                                onChange={(checked) => updateDay(index, 'isClosed', !checked)}
                            />
                            <span className="text-sm text-gray-500">{t('schedule.open')}</span>
                        </div>

                        {!item.isClosed && (
                            <div className="flex items-center gap-2 flex-1">
                                <Select
                                    value={item.openTime}
                                    onChange={(e) => updateDay(index, 'openTime', e.target.value)}
                                    options={timeOptions}
                                    className="w-32"
                                />
                                <span>{t('schedule.to')}</span>
                                <Select
                                    value={item.closeTime}
                                    onChange={(e) => updateDay(index, 'closeTime', e.target.value)}
                                    options={timeOptions}
                                    className="w-32"
                                />
                            </div>
                        )}

                        {item.isClosed && (
                            <div className="flex-1 text-gray-400 italic text-sm">
                                {t('schedule.unavailable')}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}