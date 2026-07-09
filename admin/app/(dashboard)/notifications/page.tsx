"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { Bell, Loader2, Send } from 'lucide-react';

interface NotificationItem {
    _id: string;
    title: string;
    message: string;
    type: 'order_update' | 'promo' | 'system' | 'broadcast';
    read: boolean;
    createdAt: string;
    user?: {
        name?: string;
        email?: string;
        phone?: string;
    };
}

interface BroadcastResult {
    recipients: number;
    pushTargets: number;
    failedPushes: number;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [result, setResult] = useState<BroadcastResult | null>(null);
    const [form, setForm] = useState({
        title: '',
        message: '',
        type: 'broadcast',
    });

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data } = await api.get('/notifications/admin?limit=50');
            setNotifications(data.notifications ?? []);
        } catch (err) {
            console.error(err);
            setError('Failed to load notification history');
        } finally {
            setLoading(false);
        }
    };

    const sendBroadcast = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');
        setResult(null);

        if (!form.title.trim() || !form.message.trim()) {
            setError('Title and message are required');
            return;
        }

        setSending(true);
        try {
            const { data } = await api.post('/notifications/broadcast', {
                title: form.title.trim(),
                message: form.message.trim(),
                type: form.type,
            });
            setSuccess('Notification sent to customer inboxes');
            setResult({
                recipients: data.recipients ?? 0,
                pushTargets: data.pushTargets ?? 0,
                failedPushes: data.failedPushes ?? 0,
            });
            setForm({ title: '', message: '', type: 'broadcast' });
            await fetchNotifications();
        } catch (err: unknown) {
            console.error(err);
            setError(getErrorMessage(err, 'Failed to send notification'));
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Notifications</h2>
                <p className="text-sm text-gray-500 mt-1">Send offer, service, and store updates to customer inboxes and devices.</p>
            </div>

            <form onSubmit={sendBroadcast} className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 space-y-4">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Broadcast Message</h3>
                        <p className="text-xs text-gray-500">This creates an inbox notification for every customer.</p>
                    </div>
                </div>

                {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
                {success && (
                    <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                        {success}
                        {result && (
                            <span className="block mt-1 text-xs text-green-700">
                                Customers: {result.recipients} <span className="mx-1">/</span> Push targets: {result.pushTargets} <span className="mx-1">/</span> Push failures: {result.failedPushes}
                            </span>
                        )}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <TextInput label="Title" value={form.title} onChange={value => setForm({ ...form, title: value })} placeholder="Fresh deals today" />
                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</span>
                        <select
                            value={form.type}
                            onChange={event => setForm({ ...form, type: event.target.value })}
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white"
                        >
                            <option value="broadcast">General</option>
                            <option value="promo">Offer</option>
                            <option value="system">Service Update</option>
                        </select>
                    </label>
                    <div className="hidden md:block" />
                    <label className="block md:col-span-3">
                        <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Message</span>
                        <textarea
                            value={form.message}
                            onChange={event => setForm({ ...form, message: event.target.value })}
                            rows={4}
                            maxLength={240}
                            placeholder="Write a clear customer-facing message..."
                            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none"
                        />
                        <span className="mt-1 block text-xs text-gray-400">{form.message.length}/240 characters</span>
                    </label>
                </div>

                <button
                    disabled={sending}
                    className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                >
                    {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Send Notification
                </button>
            </form>

            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Recent Notifications</h3>
                    <p className="text-xs text-gray-500 mt-1">Latest customer inbox entries created by order updates and admin broadcasts.</p>
                </div>
                {loading ? (
                    <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">No notifications yet.</div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 border-b">
                            <tr>
                                <th className="p-4">Message</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Read</th>
                                <th className="p-4">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {notifications.map(notification => (
                                <tr key={notification._id}>
                                    <td className="p-4 max-w-xl">
                                        <p className="font-semibold text-gray-900">{notification.title}</p>
                                        <p className="text-gray-500 line-clamp-2">{notification.message}</p>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        <p className="font-medium text-gray-800">{notification.user?.name || 'Customer'}</p>
                                        <p className="text-xs text-gray-500">{notification.user?.email || notification.user?.phone || 'No contact'}</p>
                                    </td>
                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 capitalize">
                                            {notification.type.replace('_', ' ')}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${notification.read ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'}`}>
                                            {notification.read ? 'Read' : 'Unread'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{new Date(notification.createdAt).toLocaleString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function TextInput({ label, value, onChange, placeholder = '' }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</span>
            <input
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800"
            />
        </label>
    );
}
