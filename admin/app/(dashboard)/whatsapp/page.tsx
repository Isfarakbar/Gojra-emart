"use client";

import { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Clock, Loader2, MessageCircle, Save, Search, X } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';

type WhatsAppStatus = 'New' | 'Reviewed' | 'Converted' | 'Ignored';

interface WhatsAppOrder {
    _id: string;
    from: string;
    messageBody: string;
    messageType: string;
    status: WhatsAppStatus;
    conversionNotes?: string;
    receivedAt: string;
}

const statuses: Array<'All' | WhatsAppStatus> = ['All', 'New', 'Reviewed', 'Converted', 'Ignored'];

export default function WhatsAppInboxPage() {
    const [orders, setOrders] = useState<WhatsAppOrder[]>([]);
    const [selected, setSelected] = useState<WhatsAppOrder | null>(null);
    const [status, setStatus] = useState<(typeof statuses)[number]>('All');
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [editStatus, setEditStatus] = useState<WhatsAppStatus>('New');
    const [notes, setNotes] = useState('');

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/webhook/orders', {
                params: {
                    page,
                    status: status === 'All' ? undefined : status,
                    search: search || undefined,
                },
            });
            setOrders(data.orders || []);
            setPages(data.pages || 1);
            setTotal(data.total || 0);
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, 'Could not load WhatsApp messages.'));
        } finally {
            setLoading(false);
        }
    }, [page, search, status]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const openOrder = (order: WhatsAppOrder) => {
        setSelected(order);
        setEditStatus(order.status);
        setNotes(order.conversionNotes || '');
        setError('');
    };

    const saveOrder = async () => {
        if (!selected) return;
        setSaving(true);
        setError('');
        try {
            const { data } = await api.put(`/webhook/orders/${selected._id}`, {
                status: editStatus,
                conversionNotes: notes.trim(),
            });
            setOrders(current => current.map(order => order._id === data._id ? data : order));
            setSelected(data);
        } catch (requestError: unknown) {
            setError(getErrorMessage(requestError, 'Could not update WhatsApp message.'));
        } finally {
            setSaving(false);
        }
    };

    const statusClass: Record<WhatsAppStatus, string> = {
        New: 'bg-blue-100 text-blue-700',
        Reviewed: 'bg-amber-100 text-amber-700',
        Converted: 'bg-green-100 text-green-700',
        Ignored: 'bg-gray-100 text-gray-600',
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">WhatsApp Inbox</h1>
                    <p className="mt-1 text-sm text-gray-500">Review incoming WhatsApp order requests and record their outcome.</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-right">
                    <p className="text-2xl font-bold text-gray-900">{total}</p>
                    <p className="text-xs text-gray-500">Messages</p>
                </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[1fr_190px_auto]">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchInput}
                        onChange={event => setSearchInput(event.target.value)}
                        onKeyDown={event => {
                            if (event.key === 'Enter') {
                                setPage(1);
                                setSearch(searchInput.trim());
                            }
                        }}
                        placeholder="Search phone or message"
                        className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-green-600"
                    />
                </div>
                <select
                    value={status}
                    onChange={event => {
                        setPage(1);
                        setStatus(event.target.value as (typeof statuses)[number]);
                    }}
                    className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                >
                    {statuses.map(item => <option key={item}>{item}</option>)}
                </select>
                <button
                    onClick={() => {
                        setPage(1);
                        setSearch(searchInput.trim());
                    }}
                    className="rounded-md bg-green-600 px-5 py-2 text-sm font-semibold text-white hover:bg-green-700"
                >
                    Search
                </button>
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="max-w-full overflow-x-auto rounded-lg border border-gray-200 bg-white">
                {loading ? (
                    <div className="flex justify-center p-16"><Loader2 className="animate-spin text-green-600" /></div>
                ) : orders.length === 0 ? (
                    <div className="p-16 text-center text-gray-500">
                        <MessageCircle className="mx-auto mb-3 text-gray-300" size={38} />
                        No WhatsApp messages found.
                    </div>
                ) : (
                    <table className="min-w-[760px] text-left text-sm">
                        <thead className="border-b bg-gray-50 text-xs uppercase text-gray-500">
                            <tr>
                                <th className="p-4">Received</th>
                                <th className="p-4">Customer</th>
                                <th className="p-4">Message</th>
                                <th className="p-4">Type</th>
                                <th className="p-4">Status</th>
                                <th className="p-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {orders.map(order => (
                                <tr key={order._id} className="hover:bg-gray-50">
                                    <td className="p-4 text-xs text-gray-500">{new Date(order.receivedAt).toLocaleString()}</td>
                                    <td className="p-4 font-semibold text-gray-900">{order.from}</td>
                                    <td className="max-w-sm p-4 text-gray-700"><p className="line-clamp-2">{order.messageBody}</p></td>
                                    <td className="p-4 capitalize text-gray-500">{order.messageType}</td>
                                    <td className="p-4"><span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[order.status]}`}>{order.status}</span></td>
                                    <td className="p-4 text-right"><button onClick={() => openOrder(order)} className="rounded-md bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 hover:bg-green-100">Review</button></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                {pages > 1 && (
                    <div className="flex items-center justify-between border-t bg-gray-50 px-4 py-3 text-sm">
                        <span className="text-gray-500">Page {page} of {pages}</span>
                        <div className="flex gap-2">
                            <button disabled={page <= 1} onClick={() => setPage(current => current - 1)} className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40">Previous</button>
                            <button disabled={page >= pages} onClick={() => setPage(current => current + 1)} className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {selected && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div><h2 className="font-bold text-gray-900">WhatsApp Request</h2><p className="text-sm text-gray-500">{selected.from}</p></div>
                            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="space-y-4 p-5">
                            <div className="rounded-md bg-gray-50 p-4 text-sm text-gray-800">{selected.messageBody}</div>
                            <label className="block text-sm font-semibold text-gray-700">Status
                                <select value={editStatus} onChange={event => setEditStatus(event.target.value as WhatsAppStatus)} className="mt-1 w-full rounded-md border p-2 font-normal">
                                    {statuses.filter(item => item !== 'All').map(item => <option key={item}>{item}</option>)}
                                </select>
                            </label>
                            <label className="block text-sm font-semibold text-gray-700">Conversion notes
                                <textarea value={notes} onChange={event => setNotes(event.target.value)} maxLength={1000} rows={4} className="mt-1 w-full resize-none rounded-md border p-3 font-normal" placeholder="Order number, follow-up details, or reason ignored" />
                            </label>
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1"><Clock size={13} />{new Date(selected.receivedAt).toLocaleString()}</span>
                                {editStatus === 'Converted' && <span className="flex items-center gap-1 text-green-700"><CheckCircle2 size={13} />Converted</span>}
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-5 py-4">
                            <button onClick={() => setSelected(null)} className="rounded-md border bg-white px-4 py-2 text-sm">Close</button>
                            <button disabled={saving} onClick={saveOrder} className="inline-flex items-center gap-2 rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                                {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}Save
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
