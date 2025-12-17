'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn, formatDate, formatTime, getStatusColor } from '@/lib/utils';
import { toast } from 'sonner';
import { MessageSquare, Trash2, Search, RefreshCcw, ArrowUpCircle } from 'lucide-react';

interface Conversation {
    id: string;
    status: string;
    clientName: string;
    clientEmail: string;
    businessName: string;
    serviceName: string;
    lastMessage: { text: string; createdAt: string } | null;
    createdAt: string;
    updatedAt: string;
}

interface ChatMessage {
    id: string;
    text: string;
    senderId: string;
    createdAt: string;
    sender?: { id: string; role: string; name: string };
}

export default function AdminChat() {
    const { data: session } = useSession();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [search, setSearch] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchConversations = async () => {
        try {
            const res = await fetch('/api/admin/conversations');
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setConversations(data);
            if (!selectedId && data.length) setSelectedId(data[0].id);
        } catch {
            toast.error('Failed to load conversations');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchConversations();
    }, []);

    const fetchMessages = async (bookingId: string) => {
        try {
            const res = await fetch(`/api/messages?bookingId=${bookingId}`);
            if (!res.ok) throw new Error('Failed');
            const data = await res.json();
            setMessages(data);
        } catch {
            toast.error('Failed to load chat');
        }
    };

    useEffect(() => {
        if (selectedId) {
            fetchMessages(selectedId);
            const interval = setInterval(() => fetchMessages(selectedId), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedId]);

    const filteredConversations = useMemo(() => {
        if (!search.trim()) return conversations;
        const term = search.toLowerCase();
        return conversations.filter((c) =>
            c.clientName.toLowerCase().includes(term) ||
            c.businessName.toLowerCase().includes(term) ||
            c.clientEmail.toLowerCase().includes(term) ||
            c.serviceName.toLowerCase().includes(term)
        );
    }, [conversations, search]);

    const activeConversation = filteredConversations.find((c) => c.id === selectedId) || conversations.find((c) => c.id === selectedId) || null;

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedId || !newMessage.trim()) return;
        const temp = {
            id: Date.now().toString(),
            text: newMessage,
            senderId: session?.user?.id || 'admin',
            createdAt: new Date().toISOString(),
            sender: { id: session?.user?.id || 'admin', role: 'ADMIN', name: session?.user?.name || 'Admin' },
        } as ChatMessage;
        setMessages((prev) => [...prev, temp]);
        setNewMessage('');
        try {
            const res = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookingId: selectedId, text: temp.text }),
            });
            if (!res.ok) throw new Error('Failed');
            fetchMessages(selectedId);
        } catch {
            toast.error('Failed to send');
        }
    };

    const handleDelete = async () => {
        if (!selectedId) return;
        setIsDeleting(true);
        try {
            const res = await fetch(`/api/messages?bookingId=${selectedId}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Failed');
            setMessages([]);
            fetchConversations();
            toast.success('Conversation removed');
        } catch {
            toast.error('Delete allowed only after completion');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
            <div className="bg-white/80 dark:bg-gray-900/60 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm p-4 space-y-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-red-500 to-rose-600 text-white flex items-center justify-center shadow-lg">
                        <MessageSquare size={18} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500">Admin console</p>
                        <p className="text-lg font-semibold">Chats</p>
                    </div>
                    <Button variant="ghost" className="ml-auto h-9 w-9 p-0" onClick={fetchConversations} title="Refresh">
                        <RefreshCcw size={16} />
                    </Button>
                </div>
                <div className="relative">
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by client, business, service..."
                        className="pl-10 rounded-xl"
                    />
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
                <div className="space-y-3 max-h-[620px] overflow-y-auto pr-1">
                    {isLoading && <p className="text-sm text-gray-500">Loading...</p>}
                    {!isLoading && filteredConversations.length === 0 && (
                        <div className="text-sm text-gray-500">No conversations yet.</div>
                    )}
                    {filteredConversations.map((conv) => {
                        const active = conv.id === selectedId;
                        return (
                            <button
                                key={conv.id}
                                onClick={() => setSelectedId(conv.id)}
                                className={cn(
                                    'w-full text-left p-3 rounded-xl border flex flex-col gap-1 transition',
                                    active ? 'border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-700' : 'border-gray-200 dark:border-gray-800 hover:border-red-200'
                                )}
                            >
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-50">{conv.clientName}</span>
                                    <span className="text-xs text-gray-500">→</span>
                                    <span className="text-sm text-gray-700 dark:text-gray-200">{conv.businessName}</span>
                                    <span className={cn('ml-auto px-2 py-0.5 rounded-full text-[11px] font-semibold', getStatusColor(conv.status))}>{conv.status}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{conv.serviceName}</span>
                                    <span>•</span>
                                    <span>{formatDate(conv.createdAt)}</span>
                                </div>
                                {conv.lastMessage && (
                                    <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{conv.lastMessage.text}</p>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="bg-white/90 dark:bg-gray-900/70 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col min-h-[720px]">
                {activeConversation ? (
                    <>
                        <div className="border-b border-gray-200 dark:border-gray-800 p-5 flex items-center gap-3">
                            <div className="flex flex-col">
                                <span className="text-sm text-gray-500">{activeConversation.clientName} ↔ {activeConversation.businessName}</span>
                                <span className="text-lg font-semibold">{activeConversation.serviceName}</span>
                            </div>
                            <span className={cn('ml-auto px-3 py-1 rounded-full text-xs font-semibold', getStatusColor(activeConversation.status))}>{activeConversation.status}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting || activeConversation.status !== 'COMPLETED'}
                                className="ml-2"
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-br from-slate-50 via-white to-rose-50 dark:from-gray-900 dark:via-gray-950 dark:to-rose-950/20 rounded-b-2xl">
                            {messages.length === 0 && (
                                <div className="text-center text-sm text-gray-500 py-10">No messages yet.</div>
                            )}
                            {messages.map((msg) => {
                                const role = msg.sender?.role;
                                const isAdmin = role === 'ADMIN' || msg.senderId === session?.user?.id;
                                const isClient = role === 'CLIENT';
                                const isBusiness = role === 'BUSINESS';
                                const bubbleColor = isAdmin
                                    ? 'bg-red-500 text-white'
                                    : isClient
                                    ? 'bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-900/50 dark:border-sky-700 dark:text-sky-50'
                                    : 'bg-emerald-100 text-emerald-900 border border-emerald-200 dark:bg-emerald-900/50 dark:border-emerald-700 dark:text-emerald-50';
                                const metaColor = isAdmin ? 'text-red-100' : isClient ? 'text-sky-700 dark:text-sky-200' : 'text-emerald-700 dark:text-emerald-200';
                                const labelText = isAdmin ? 'Admin' : isClient ? 'Client' : 'Business';
                                return (
                                    <div key={msg.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                                        <div className={cn('max-w-[70%] rounded-2xl px-4 py-3 shadow-sm space-y-1', bubbleColor)}>
                                            <div className="text-[11px] font-semibold uppercase tracking-wide opacity-80">{labelText}</div>
                                            <p className="leading-snug">{msg.text}</p>
                                            <p className={cn('text-[11px]', metaColor)}>{formatTime(msg.createdAt)}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        <form onSubmit={handleSend} className="p-5 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 rounded-b-2xl">
                            <Input
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Send a red-label message as admin"
                                className="flex-1 rounded-xl"
                            />
                            <Button type="submit" size="sm" className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-red-500 hover:bg-red-600">
                                <ArrowUpCircle size={18} />
                            </Button>
                        </form>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-gray-500">Select a conversation</div>
                )}
            </div>
        </div>
    );
}