'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Loader2, Trash2, Star, StarOff, CheckCircle, XCircle } from 'lucide-react';
import { useClientTranslation } from '@/i18n/client';

export default function CategoriesManager() {
    const [categories, setCategories] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [newCategory, setNewCategory] = useState({ nameEn: '', nameFr: '', nameAr: '', emoji: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { t } = useClientTranslation();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/categories');
            const data = await res.json();
            setCategories(data);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await fetch('/api/categories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCategory),
            });
            setNewCategory({ nameEn: '', nameFr: '', nameAr: '', emoji: '' });
            fetchCategories();
        } catch (error) {
            console.error('Failed to create category', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const toggleFeatured = async (category: any) => {
        try {
            const response = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: category.id, isFeatured: !category.isFeatured }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update');
            }
            
            await fetchCategories();
        } catch (error) {
            console.error('Failed to update category', error);
        }
    };

    const toggleActive = async (category: any) => {
        try {
            const response = await fetch('/api/categories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: category.id, isActive: !category.isActive }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to update');
            }
            
            await fetchCategories();
        } catch (error) {
            console.error('Failed to update category', error);
        }
    };

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold">{t('admin.categoriesManagement')}</h2>

            {/* Create Form */}
            <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                <div>
                    <label className="block text-sm font-medium mb-1">{t('admin.emoji')}</label>
                    <Input
                        value={newCategory.emoji}
                        onChange={e => setNewCategory({ ...newCategory, emoji: e.target.value })}
                        placeholder="💅"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('admin.nameEN')}</label>
                    <Input
                        value={newCategory.nameEn}
                        onChange={e => setNewCategory({ ...newCategory, nameEn: e.target.value })}
                        placeholder="Beauty"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('admin.nameFR')}</label>
                    <Input
                        value={newCategory.nameFr}
                        onChange={e => setNewCategory({ ...newCategory, nameFr: e.target.value })}
                        placeholder="Beauté"
                        required
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium mb-1">{t('admin.nameAR')}</label>
                    <Input
                        value={newCategory.nameAr}
                        onChange={e => setNewCategory({ ...newCategory, nameAr: e.target.value })}
                        placeholder="جمال"
                        className="text-right"
                        required
                    />
                </div>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin" /> : t('admin.addCategory')}
                </Button>
            </form>

            {/* List */}
            <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.emoji')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.nameEN')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('admin.featured')}</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('common.status')}</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">{t('services.actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {isLoading ? (
                            <tr><td colSpan={5} className="text-center py-4">{t('common.loading')}</td></tr>
                        ) : categories.map((cat) => (
                            <tr key={cat.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-2xl">{cat.emoji}</td>
                                <td className="px-6 py-4 whitespace-nowrap font-medium">{cat.nameEn}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleFeatured(cat)}
                                        className={`p-1.5 rounded-full transition-colors ${cat.isFeatured ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                        title={cat.isFeatured ? "Featured on homepage" : "Not featured"}
                                    >
                                        {cat.isFeatured ? <Star size={18} fill="currentColor" /> : <StarOff size={18} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button
                                        onClick={() => toggleActive(cat)}
                                        className={`p-1.5 rounded-full transition-colors ${cat.isActive ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-100 text-red-600 hover:bg-red-200'}`}
                                        title={cat.isActive ? "Active" : "Inactive"}
                                    >
                                        {cat.isActive ? <CheckCircle size={18} fill="currentColor" /> : <XCircle size={18} />}
                                    </button>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button className="text-red-600 hover:text-red-900 ml-4"><Trash2 size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}