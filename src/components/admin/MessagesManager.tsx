'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import { Trash2, Mail, Phone } from 'lucide-react';

interface ContactMessage {
    id: string;
    name: string;
    email: string;
    phone?: string | null;
    message: string;
    createdAt: string;
}

export default function MessagesManager() {
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchMessages = () => {
        fetch('/api/contact')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) setMessages(data);
                setIsLoading(false);
            })
            .catch(() => toast.error('Failed to load messages'));
    };

    useEffect(() => {
        fetchMessages();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this message?')) return;

        try {
            const res = await fetch(`/api/contact?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                toast.success('Message deleted');
                setMessages(prev => prev.filter(m => m.id !== id));
            } else {
                throw new Error('Failed');
            }
        } catch {
            toast.error('Failed to delete message');
        }
    };

    if (isLoading) return <div>Loading messages...</div>;

    return (
        <div className="space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Submissions
            </h2>

            {messages.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    No messages found.
                </div>
            ) : (
                <div className="space-y-4">
                        {messages.map((msg) => (
                            <div key={msg.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm border dark:border-gray-700 relative">
                                <div className="flex justify-between items-start mb-2 gap-3">
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-lg">{msg.name}</h3>
                                        <div className="flex flex-wrap gap-3 text-sm text-primary-600 dark:text-primary-300">
                                            <a href={`mailto:${msg.email}`} className="inline-flex items-center gap-1 hover:underline">
                                                <Mail size={14} />
                                                {msg.email}
                                            </a>
                                            {msg.phone && (
                                                <a href={`tel:${msg.phone}`} className="inline-flex items-center gap-1 hover:underline">
                                                    <Phone size={14} />
                                                    {msg.phone}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(msg.createdAt)}</span>
                                </div>
                                <p className="text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-md mt-2">
                                    {msg.message}
                                </p>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    className="absolute top-4 right-4"
                                    onClick={() => handleDelete(msg.id)}
                                >
                                    <Trash2 size={16} />
                                </Button>
                            </div>
                        ))}

                </div>
            )}
        </div>
    );
}