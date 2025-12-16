'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { toast } from 'sonner';
import { useClientTranslation } from '@/i18n/client';

interface Setting {
    key: string;
    valueEn: string;
    valueFr: string;
    valueAr: string;
}

const KNOWN_KEYS = [
    'system_logo_url',
    'system_logo_delete_url',
    'hero_title',
    'hero_subtitle',
    'hero_background_url',
    'hero_background_delete_url',
    'contact_email',
    'facebook_url',
    'instagram_url'
];

export default function GlobalSettings() {
    const [settings, setSettings] = useState<Record<string, Setting>>({});
    const [isLoading, setIsLoading] = useState(true);
    const { t } = useClientTranslation();

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                const map: Record<string, Setting> = {};
                // Pre-fill known keys if missing
                KNOWN_KEYS.forEach(key => {
                    map[key] = { key, valueEn: '', valueFr: '', valueAr: '' };
                });

                // Merge fetched data
                if (Array.isArray(data)) {
                    data.forEach((s: Setting) => {
                        map[s.key] = s;
                    });
                }
                setSettings(map);
                setIsLoading(false);
            })
            .catch(() => toast.error(t('admin.failedUpdate')));
    }, [t]);

    const handleSave = async (key: string) => {
        try {
            const setting = settings[key];
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(setting),
            });
            if (!res.ok) throw new Error('Failed');
            toast.success(t('common.success'));
        } catch {
            toast.error(t('admin.failedUpdate'));
        }
    };

    const handleChange = (key: string, field: keyof Setting, val: string) => {
        setSettings(prev => ({
            ...prev,
            [key]: { ...prev[key], [field]: val }
        }));
    };

    if (isLoading) return <div>{t('admin.loadingSettings')}</div>;

    const UNIVERSAL_KEYS = [
        'system_logo_url',
        'system_logo_delete_url',
        'hero_background_url',
        'hero_background_delete_url',
        'contact_email',
        'facebook_url',
        'instagram_url'
    ];

    const isUniversal = (key: string) => UNIVERSAL_KEYS.includes(key);
    const isImageField = (key: string) => {
        // Only system_logo_url and hero_background_url are image fields
        return (key === 'system_logo_url' || key === 'hero_background_url');
    };
    const shouldHideField = (key: string) => key.includes('_delete_url');

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">{t('admin.globalSettings')}</h2>
            <div className="grid grid-cols-1 gap-6">
                {KNOWN_KEYS.filter(key => !shouldHideField(key)).map(key => (
                    <div key={key} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-700 dark:text-gray-300 mb-3 capitalize">
                            {key.replace(/_/g, ' ')}
                        </h3>

                        {isImageField(key) ? (
                            <div className="mb-3">
                                <ImageUpload
                                    currentImageUrl={settings[key]?.valueEn || ''}
                                    currentDeleteUrl={settings[`${key.replace('_url', '_delete_url')}`]?.valueEn || ''}
                                    onUploadComplete={(url, deleteUrl) => {
                                        // Update URL field
                                        handleChange(key, 'valueEn', url);
                                        handleChange(key, 'valueFr', url);
                                        handleChange(key, 'valueAr', url);
                                        // Update delete URL field
                                        const deleteKey = key.replace('_url', '_delete_url');
                                        handleChange(deleteKey, 'valueEn', deleteUrl);
                                        handleChange(deleteKey, 'valueFr', deleteUrl);
                                        handleChange(deleteKey, 'valueAr', deleteUrl);
                                    }}
                                    buttonText={`Upload ${key.replace('_url', '').replace(/_/g, ' ')}`}
                                />
                            </div>
                        ) : isUniversal(key) ? (
                            <div className="mb-3">
                                <Input
                                    label="Value"
                                    value={settings[key]?.valueEn || ''}
                                    onChange={e => {
                                        const val = e.target.value;
                                        // Update all fields with same value for universal settings
                                        handleChange(key, 'valueEn', val);
                                        handleChange(key, 'valueFr', val);
                                        handleChange(key, 'valueAr', val);
                                    }}
                                    dir="ltr"
                                />
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                                <Input
                                    label="English"
                                    value={settings[key]?.valueEn || ''}
                                    onChange={e => handleChange(key, 'valueEn', e.target.value)}
                                />
                                <Input
                                    label="Français"
                                    value={settings[key]?.valueFr || ''}
                                    onChange={e => handleChange(key, 'valueFr', e.target.value)}
                                />
                                <Input
                                    label="العربية"
                                    value={settings[key]?.valueAr || ''}
                                    onChange={e => handleChange(key, 'valueAr', e.target.value)}
                                    dir="rtl"
                                />
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button size="sm" onClick={() => handleSave(key)}>{t('common.save')}</Button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}