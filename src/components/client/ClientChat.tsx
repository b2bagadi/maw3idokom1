'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'sonner';
import { Send } from 'lucide-react';
import { formatTime } from '@/lib/utils';
import { useSession } from 'next-auth/react';
import { Modal } from '@/components/ui/Modal';
import { cn } from '@/lib/utils';
import { useClientTranslation } from '@/i18n/client';

interface ClientChatProps {
    bookingId: string;
    isOpen: boolean;
    onClose: () => void;
    businessName: string;
}

export default function ClientChat({ bookingId, isOpen, onClose, businessName }: ClientChatProps) {
    const { data: session } = useSession();
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const { t } = useClientTranslation();

    const fetchMessages = async () => {
        try {
            const res = await fetch(`/api/messages?bookingId=${bookingId}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setMessages(data);
        } catch {
            // polling silent fail
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchMessages();
            const interval = setInterval(fetchMessages, 3000);
            return () => clearInterval(interval);
        }
    }, [isOpen, bookingId]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const tempMsg = {
            id: Date.now().toString(),
            text: newMessage,
            senderId: session?.user?.id,
            createdAt: new Date().toISOString(),
        };
        setMessages(prev => [...prev, tempMsg]);
        setNewMessage('');

        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId, text: tempMsg.text }),
            });
            if (!res.ok) throw new Error('Failed');
            fetchMessages();
        } catch {
            toast.error(t('chat.sendError', { defaultValue: 'Failed to send' }));
        }
    };

    const userId = session?.user?.id;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`${t('chat.title', { defaultValue: 'Chat' })} - ${businessName}`} size="lg">
            <div className="flex flex-col h-[500px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    {messages.length === 0 && (
                        <p className="text-center text-gray-500">{t('chat.noMessages', { defaultValue: 'No messages yet' })}</p>
                    )}
                    {messages.map((msg) => {
                        const role = msg.sender?.role;
                        const isAdmin = role === 'ADMIN';
                        const isClient = role === 'CLIENT';
                        const isBusiness = role === 'BUSINESS';
                        const bubbleColor = isAdmin
                            ? 'bg-red-500 text-white'
                            : isClient
                            ? 'bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-50'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-50';
                        const metaColor = isAdmin ? 'text-red-100' : isClient ? 'text-sky-700 dark:text-sky-200' : 'text-emerald-700 dark:text-emerald-200';
                        const labelText = isAdmin ? t('chat.admin', { defaultValue: 'Admin' }) : isClient ? t('chat.client', { defaultValue: 'Client' }) : t('chat.business', { defaultValue: 'Business' });
                        const isMe = msg.senderId === userId;
                        return (
                            <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                                <div className={cn("max-w-[70%] rounded-2xl px-4 py-3 shadow-sm space-y-1", bubbleColor)}>
                                    <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{labelText}</div>
                                    <p className="leading-snug">{msg.text}</p>
                                    <p className={cn("text-[11px]", metaColor)}>{formatTime(msg.createdAt)}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <form onSubmit={handleSend} className="mt-4 flex gap-2">
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder={t('chat.typeMessage', { defaultValue: 'Type a message...' })}
                        containerClassName="flex-1"
                        className="rounded-full"
                    />
                    <Button type="submit" size="sm" className="rounded-full h-10 w-10 p-0 flex items-center justify-center">
                        <Send size={18} />
                    </Button>
                </form>
            </div>
        </Modal>
    );
}