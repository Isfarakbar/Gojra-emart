"use client";

import { useCallback, useEffect, useState } from 'react';
import { Ban, Calendar, CheckCircle2, Loader2, Mail, Phone, Search, Shield, ShoppingBag, User as UserIcon, Users, X } from 'lucide-react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';

interface User {
    _id: string;
    name: string;
    email?: string;
    phone?: string;
    role: 'user' | 'admin';
    accountStatus?: 'Active' | 'Suspended';
    suspendedReason?: string;
    address?: string;
    createdAt: string;
    orderStats: {
        totalOrders: number;
        deliveredOrders: number;
        totalSpent: number;
        lastOrderAt?: string;
    };
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchInput, setSearchInput] = useState('');
    const [search, setSearch] = useState('');
    const [role, setRole] = useState('');
    const [status, setStatus] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const { data } = await api.get('/users', {
                params: {
                    page,
                    search: search || undefined,
                    role: role || undefined,
                    status: status || undefined,
                },
            });
            setUsers(data.users || []);
            setTotalPages(data.pages || 1);
            setTotalUsers(data.total || 0);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Could not load customers.'));
        } finally {
            setLoading(false);
        }
    }, [page, role, search, status]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const applySearch = () => {
        setPage(1);
        setSearch(searchInput.trim());
    };

    const changeStatus = async () => {
        if (!selectedUser) return;
        const nextStatus = selectedUser.accountStatus === 'Suspended' ? 'Active' : 'Suspended';
        if (nextStatus === 'Suspended' && !reason.trim()) {
            setError('Enter a reason before suspending this customer.');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await api.put(`/users/${selectedUser._id}/status`, {
                status: nextStatus,
                reason: reason.trim(),
            });
            setSelectedUser(null);
            setReason('');
            await fetchUsers();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Could not update this customer.'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Customers</h2>
                    <p className="mt-1 text-sm text-gray-500">Customer activity, spending, and account access.</p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white px-5 py-3 text-right">
                    <p className="text-2xl font-bold text-gray-900">{totalUsers}</p>
                    <p className="text-xs text-gray-500">Matching accounts</p>
                </div>
            </div>

            <div className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4 md:grid-cols-[1fr_180px_180px_auto]">
                <div className="relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        value={searchInput}
                        onChange={event => setSearchInput(event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && applySearch()}
                        placeholder="Search name, email, or phone"
                        className="w-full rounded-md border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500"
                    />
                </div>
                <select value={role} onChange={event => { setRole(event.target.value); setPage(1); }} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <option value="">All roles</option>
                    <option value="user">Customers</option>
                    <option value="admin">Admins</option>
                </select>
                <select value={status} onChange={event => { setStatus(event.target.value); setPage(1); }} className="rounded-md border border-gray-200 px-3 py-2 text-sm">
                    <option value="">All statuses</option>
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                </select>
                <button onClick={applySearch} className="rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700">Search</button>
            </div>

            {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                {loading ? (
                    <div className="flex justify-center p-14"><Loader2 className="animate-spin text-blue-600" /></div>
                ) : users.length === 0 ? (
                    <div className="p-14 text-center text-gray-500"><Users className="mx-auto mb-3 text-gray-300" />No accounts found.</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="border-b border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                                <tr>
                                    <th className="p-4 font-semibold">Customer</th>
                                    <th className="p-4 font-semibold">Contact</th>
                                    <th className="p-4 font-semibold">Orders</th>
                                    <th className="p-4 font-semibold">Spent</th>
                                    <th className="p-4 font-semibold">Status</th>
                                    <th className="p-4 font-semibold">Joined</th>
                                    <th className="p-4 text-right font-semibold">Access</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {users.map(user => {
                                    const suspended = user.accountStatus === 'Suspended';
                                    return (
                                        <tr key={user._id} className="hover:bg-gray-50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`flex h-9 w-9 items-center justify-center rounded-full font-bold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                        {(user.name || 'U').charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900">{user.name}</p>
                                                        <p className="flex items-center gap-1 text-xs text-gray-400">
                                                            {user.role === 'admin' ? <Shield size={11} /> : <UserIcon size={11} />}
                                                            {user.role === 'admin' ? 'Admin' : 'Customer'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-4 text-gray-600">
                                                <p className="flex items-center gap-1.5"><Mail size={13} />{user.email || 'No email'}</p>
                                                <p className="mt-1 flex items-center gap-1.5 text-xs"><Phone size={12} />{user.phone || 'No phone'}</p>
                                            </td>
                                            <td className="p-4">
                                                <p className="flex items-center gap-1.5 font-semibold text-gray-800"><ShoppingBag size={14} />{user.orderStats?.totalOrders || 0}</p>
                                                <p className="mt-1 text-xs text-gray-500">{user.orderStats?.deliveredOrders || 0} delivered</p>
                                            </td>
                                            <td className="p-4 font-semibold text-gray-800">Rs. {(user.orderStats?.totalSpent || 0).toLocaleString()}</td>
                                            <td className="p-4">
                                                <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${suspended ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                                                    {suspended ? <Ban size={12} /> : <CheckCircle2 size={12} />}
                                                    {suspended ? 'Suspended' : 'Active'}
                                                </span>
                                                {suspended && user.suspendedReason && <p className="mt-1 max-w-48 truncate text-xs text-red-600" title={user.suspendedReason}>{user.suspendedReason}</p>}
                                            </td>
                                            <td className="p-4 text-xs text-gray-500">
                                                <span className="flex items-center gap-1.5"><Calendar size={13} />{new Date(user.createdAt).toLocaleDateString()}</span>
                                            </td>
                                            <td className="p-4 text-right">
                                                {user.role === 'user' && (
                                                    <button
                                                        onClick={() => { setSelectedUser(user); setReason(user.suspendedReason || ''); setError(''); }}
                                                        className={`rounded-md px-3 py-2 text-xs font-semibold ${suspended ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
                                                    >
                                                        {suspended ? 'Reactivate' : 'Suspend'}
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                        <span className="text-gray-500">Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(value => value - 1)} className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40">Previous</button>
                            <button disabled={page === totalPages} onClick={() => setPage(value => value + 1)} className="rounded-md border bg-white px-3 py-1.5 disabled:opacity-40">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {selectedUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
                        <div className="flex items-center justify-between border-b px-5 py-4">
                            <div>
                                <h3 className="font-bold text-gray-900">{selectedUser.accountStatus === 'Suspended' ? 'Reactivate customer' : 'Suspend customer'}</h3>
                                <p className="text-sm text-gray-500">{selectedUser.name}</p>
                            </div>
                            <button onClick={() => setSelectedUser(null)} className="p-1 text-gray-400 hover:text-gray-700"><X size={20} /></button>
                        </div>
                        <div className="p-5">
                            {selectedUser.accountStatus === 'Suspended' ? (
                                <p className="text-sm text-gray-600">This customer will regain access immediately and can sign in and place orders again.</p>
                            ) : (
                                <label className="block">
                                    <span className="text-sm font-semibold text-gray-700">Reason</span>
                                    <textarea
                                        value={reason}
                                        onChange={event => setReason(event.target.value)}
                                        rows={4}
                                        maxLength={300}
                                        placeholder="Explain why this account is being suspended"
                                        className="mt-2 w-full resize-none rounded-md border border-gray-200 p-3 text-sm outline-none focus:border-red-500"
                                    />
                                </label>
                            )}
                        </div>
                        <div className="flex justify-end gap-2 border-t bg-gray-50 px-5 py-4">
                            <button onClick={() => setSelectedUser(null)} className="rounded-md border bg-white px-4 py-2 text-sm font-semibold text-gray-600">Cancel</button>
                            <button
                                disabled={saving}
                                onClick={changeStatus}
                                className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 ${selectedUser.accountStatus === 'Suspended' ? 'bg-green-600' : 'bg-red-600'}`}
                            >
                                {saving && <Loader2 size={15} className="animate-spin" />}
                                {selectedUser.accountStatus === 'Suspended' ? 'Reactivate' : 'Suspend'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
