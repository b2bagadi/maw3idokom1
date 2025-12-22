'use client';

import { useState, useEffect } from 'react';
import { Star, Trash2, Edit2, Search, X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Rating {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    rater: { name: string; email: string };
    ratee: { name: string; email: string };
    booking: { id: string; date: string };
}

export default function RatingsManager() {
    const [ratings, setRatings] = useState<Rating[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editComment, setEditComment] = useState('');

    useEffect(() => {
        fetchRatings();
    }, []);

    const fetchRatings = async () => {
        try {
            const res = await fetch('/api/admin/ratings');
            const data = await res.json();
            setRatings(data);
            setLoading(false);
        } catch (error) {
            toast.error('Failed to load ratings');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this rating?')) return;
        try {
            const res = await fetch(`/api/admin/ratings?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Rating deleted');
                setRatings(ratings.filter(r => r.id !== id));
            }
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleUpdate = async (id: string) => {
        try {
            const res = await fetch('/api/admin/ratings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, comment: editComment }),
            });
            if (res.ok) {
                toast.success('Comment updated');
                setRatings(ratings.map(r => r.id === id ? { ...r, comment: editComment } : r));
                setEditingId(null);
            }
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const filteredRatings = ratings.filter(r =>
        r.rater.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.ratee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (r.comment?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="p-8 text-center">Loading ratings...</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold dark:text-white text-gray-900">Ratings Management</h2>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search ratings..."
                        className="pl-10 pr-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 focus:ring-purple-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="overflow-x-auto rounded-lg border dark:border-gray-700">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Date</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Rater → Ratee</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Rating</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase">Comment</th>
                            <th className="p-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y dark:divide-gray-700">
                        {filteredRatings.map(r => (
                            <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                <td className="p-4 text-sm text-gray-600 dark:text-gray-400">
                                    {format(new Date(r.createdAt), 'dd MMM yyyy')}
                                </td>
                                <td className="p-4">
                                    <div className="text-sm font-medium dark:text-white">
                                        {r.rater.name} → {r.ratee.name}
                                    </div>
                                    <div className="text-xs text-gray-500">{r.rater.email}</div>
                                </td>
                                <td className="p-4">
                                    <div className="flex text-yellow-500">
                                        {[...Array(5)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={14}
                                                fill={i < r.rating ? 'currentColor' : 'none'}
                                                className={i < r.rating ? '' : 'text-gray-300 dark:text-gray-600'}
                                            />
                                        ))}
                                    </div>
                                </td>
                                <td className="p-4">
                                    {editingId === r.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                className="text-sm p-1 border rounded dark:bg-gray-700 dark:border-gray-600 w-full"
                                                value={editComment}
                                                onChange={(e) => setEditComment(e.target.value)}
                                            />
                                            <button onClick={() => handleUpdate(r.id)} className="text-green-500 hover:text-green-600"><Check size={18} /></button>
                                            <button onClick={() => setEditingId(null)} className="text-red-500 hover:text-red-600"><X size={18} /></button>
                                        </div>
                                    ) : (
                                        <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                                            {r.comment || 'No comment'}
                                        </div>
                                    )}
                                </td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button
                                            onClick={() => { setEditingId(r.id); setEditComment(r.comment || ''); }}
                                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(r.id)}
                                            className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {filteredRatings.length === 0 && (
                <div className="text-center py-12 text-gray-500">No ratings found matching criteria.</div>
            )}
        </div>
    );
}
