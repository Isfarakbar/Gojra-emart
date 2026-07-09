"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { CheckCircle2, Clock, Loader2, MessageSquare, Save } from 'lucide-react';

interface SupportTicket {
    _id: string;
    subject: string;
    message: string;
    category: string;
    status: 'Open' | 'In Progress' | 'Resolved' | 'Closed';
    priority: 'Low' | 'Normal' | 'High' | 'Urgent';
    adminReply?: string;
    createdAt: string;
    user?: {
        name?: string;
        email?: string;
        phone?: string;
    };
    order?: {
        _id: string;
        status: string;
        totalPrice: number;
        createdAt: string;
    };
}

const statuses = ['All', 'Open', 'In Progress', 'Resolved', 'Closed'];
const priorities = ['Low', 'Normal', 'High', 'Urgent'];

export default function SupportPage() {
    const [tickets, setTickets] = useState<SupportTicket[]>([]);
    const [selected, setSelected] = useState<SupportTicket | null>(null);
    const [statusFilter, setStatusFilter] = useState('All');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reply, setReply] = useState('');
    const [selectedStatus, setSelectedStatus] = useState<SupportTicket['status']>('Open');
    const [selectedPriority, setSelectedPriority] = useState<SupportTicket['priority']>('Normal');

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const query = statusFilter === 'All' ? '' : `?status=${encodeURIComponent(statusFilter)}`;
            const { data } = await api.get(`/support${query}`);
            setTickets(data.tickets ?? []);
        } catch (error) {
            console.error(error);
            alert('Failed to load support tickets');
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    const openTicket = (ticket: SupportTicket) => {
        setSelected(ticket);
        setReply(ticket.adminReply ?? '');
        setSelectedStatus(ticket.status);
        setSelectedPriority(ticket.priority);
    };

    const saveTicket = async () => {
        if (!selected) return;
        setSaving(true);
        try {
            const { data } = await api.put(`/support/${selected._id}`, {
                status: selectedStatus,
                priority: selectedPriority,
                adminReply: reply,
            });
            setSelected(data);
            setTickets(items => items.map(item => item._id === data._id ? data : item));
        } catch (error) {
            console.error(error);
            alert('Failed to update support ticket');
        } finally {
            setSaving(false);
        }
    };

    const openCount = tickets.filter(ticket => ticket.status === 'Open').length;
    const urgentCount = tickets.filter(ticket => ticket.priority === 'Urgent' || ticket.priority === 'High').length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold text-gray-900">Support Inbox</h2>
                <p className="text-sm text-gray-500 mt-1">Review customer issues, reply, and keep delivery problems organized.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <StatCard icon={<MessageSquare size={20} />} label="Loaded Tickets" value={tickets.length} tone="blue" />
                <StatCard icon={<Clock size={20} />} label="Open" value={openCount} tone="orange" />
                <StatCard icon={<CheckCircle2 size={20} />} label="High Priority" value={urgentCount} tone="red" />
            </div>

            <div className="flex flex-wrap gap-2">
                {statuses.map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold border ${statusFilter === status ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-200'}`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
                    ) : tickets.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No support tickets found.</div>
                    ) : (
                        <div className="divide-y">
                            {tickets.map(ticket => (
                                <button
                                    key={ticket._id}
                                    onClick={() => openTicket(ticket)}
                                    className={`w-full text-left p-5 hover:bg-gray-50 transition ${selected?._id === ticket._id ? 'bg-blue-50' : 'bg-white'}`}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div>
                                            <p className="font-semibold text-gray-900">{ticket.subject}</p>
                                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{ticket.message}</p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${priorityClass(ticket.priority)}`}>{ticket.priority}</span>
                                    </div>
                                    <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                                        <span>{ticket.user?.name || 'Customer'}</span>
                                        <span>{formatCategory(ticket.category)}</span>
                                        <span className={`px-2 py-1 rounded-full font-semibold ${statusClass(ticket.status)}`}>{ticket.status}</span>
                                        <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 min-h-[420px]">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-gray-500">
                            <MessageSquare size={36} className="mb-3 text-gray-300" />
                            <p className="font-medium">Select a ticket to reply</p>
                            <p className="text-sm mt-1">Customer details and order context will appear here.</p>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{selected.subject}</h3>
                                <p className="text-sm text-gray-500 mt-1">Created {new Date(selected.createdAt).toLocaleString()}</p>
                            </div>

                            <InfoBlock title="Customer" lines={[
                                selected.user?.name || 'Customer',
                                selected.user?.email || selected.user?.phone || 'No contact available',
                            ]} />

                            {selected.order && (
                                <InfoBlock title="Related Order" lines={[
                                    `#${selected.order._id.slice(-6).toUpperCase()} / ${selected.order.status}`,
                                    `Rs. ${Number(selected.order.totalPrice || 0).toLocaleString()}`,
                                ]} />
                            )}

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Customer Message</p>
                                <div className="rounded-lg bg-gray-50 border border-gray-100 p-4 text-sm text-gray-700 leading-relaxed">{selected.message}</div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <SelectField label="Status" value={selectedStatus} options={statuses.slice(1)} onChange={value => setSelectedStatus(value as SupportTicket['status'])} />
                                <SelectField label="Priority" value={selectedPriority} options={priorities} onChange={value => setSelectedPriority(value as SupportTicket['priority'])} />
                            </div>

                            <label className="block">
                                <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">Admin Reply</span>
                                <textarea
                                    value={reply}
                                    onChange={event => setReply(event.target.value)}
                                    rows={5}
                                    maxLength={1000}
                                    placeholder="Write a helpful response for the customer..."
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 resize-none"
                                />
                                <span className="mt-1 block text-xs text-gray-400">{reply.length}/1000 characters</span>
                            </label>

                            <button
                                onClick={saveTicket}
                                disabled={saving}
                                className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold disabled:opacity-60"
                            >
                                {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                Save Reply
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: 'blue' | 'orange' | 'red' }) {
    const tones = {
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        red: 'bg-red-50 text-red-600',
    };
    return (
        <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${tones[tone]}`}>{icon}</div>
            <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}

function InfoBlock({ title, lines }: { title: string; lines: string[] }) {
    return (
        <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">{title}</p>
            <div className="rounded-lg border border-gray-100 p-3">
                {lines.map((line, index) => <p key={index} className={index === 0 ? 'font-semibold text-gray-900' : 'text-sm text-gray-500'}>{line}</p>)}
            </div>
        </div>
    );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (value: string) => void }) {
    return (
        <label className="block">
            <span className="block text-xs font-semibold text-gray-500 uppercase mb-1">{label}</span>
            <select value={value} onChange={event => onChange(event.target.value)} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 bg-white">
                {options.map(option => <option key={option} value={option}>{option}</option>)}
            </select>
        </label>
    );
}

function formatCategory(category: string) {
    return category.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
}

function statusClass(status: string) {
    if (status === 'Resolved') return 'bg-green-50 text-green-700';
    if (status === 'Closed') return 'bg-gray-100 text-gray-600';
    if (status === 'In Progress') return 'bg-blue-50 text-blue-700';
    return 'bg-orange-50 text-orange-700';
}

function priorityClass(priority: string) {
    if (priority === 'Urgent') return 'bg-red-100 text-red-700';
    if (priority === 'High') return 'bg-orange-100 text-orange-700';
    if (priority === 'Low') return 'bg-gray-100 text-gray-600';
    return 'bg-blue-50 text-blue-700';
}
