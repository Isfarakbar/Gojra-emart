"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Users, Search, Mail, Phone, Shield, User as UserIcon, Calendar } from 'lucide-react';

interface User {
    _id: string;
    name: string;
    email: string;
    phone?: string;
    role: 'user' | 'admin';
    address?: string;
    createdAt: string;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'user' | 'admin'>('all');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);

    const fetchUsers = useCallback(async (targetPage = page) => {
        try {
            const { data } = await api.get('/users', { params: { page: targetPage } });
            setUsers(data.users ?? data);
            setTotalPages(data.pages ?? 1);
            setTotalUsers(data.total ?? (data.users ?? data).length);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchUsers(page);
    }, [fetchUsers, page]);

    const filteredUsers = users.filter(user => {
        const matchSearch =
            user.name.toLowerCase().includes(search.toLowerCase()) ||
            (user.email ?? '').toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === 'all' || user.role === filter;
        return matchSearch && matchFilter;
    });

    const adminCount = users.filter(u => u.role === 'admin').length;
    const userCount = users.filter(u => u.role === 'user').length;

    return (
        <div>
            {/* Page Header */}
            <div className="flex justify-between items-start mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Users</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage registered users and admins</p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-gray-800">{users.length}</p>
                        <p className="text-xs text-gray-500 mt-0.5">This Page</p>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-purple-600">{adminCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Admins</p>
                    </div>
                    <div className="bg-white px-4 py-3 rounded-xl border border-gray-100 shadow-sm text-center">
                        <p className="text-2xl font-bold text-blue-600">{userCount}</p>
                        <p className="text-xs text-gray-500 mt-0.5">Customers</p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="flex-1 relative">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                </div>
                {/* Role Filter */}
                <div className="flex gap-2">
                    {(['all', 'user', 'admin'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${filter === f
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {f === 'all' ? 'All Roles' : f === 'admin' ? '🔑 Admins' : '👤 Customers'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex justify-center p-10">
                    <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
                </div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-xs uppercase tracking-wider">
                            <tr>
                                <th className="p-4 font-semibold">User</th>
                                <th className="p-4 font-semibold">Contact</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Address</th>
                                <th className="p-4 font-semibold">Joined</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map(user => (
                                <tr key={user._id} className="hover:bg-gray-50/50 transition">
                                    {/* Avatar + Name */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700'
                                                : 'bg-blue-100 text-blue-700'
                                                }`}>
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
                                                <p className="text-xs text-gray-400 font-mono">{user._id.slice(-8)}</p>
                                            </div>
                                        </div>
                                    </td>

                                    {/* Contact */}
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Mail size={13} className="text-gray-400" />
                                                {user.email || 'No email'}
                                            </div>
                                            {user.phone && (
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                                    <Phone size={12} />
                                                    {user.phone}
                                                </div>
                                            )}
                                        </div>
                                    </td>

                                    {/* Role Badge */}
                                    <td className="p-4">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${user.role === 'admin'
                                            ? 'bg-purple-100 text-purple-700'
                                            : 'bg-gray-100 text-gray-600'
                                            }`}>
                                            {user.role === 'admin' ? <Shield size={11} /> : <UserIcon size={11} />}
                                            {user.role === 'admin' ? 'Admin' : 'Customer'}
                                        </span>
                                    </td>

                                    {/* Address */}
                                    <td className="p-4">
                                        <span className="text-sm text-gray-500 max-w-[150px] truncate block">
                                            {user.address || <span className="text-gray-300 italic">Not set</span>}
                                        </span>
                                    </td>

                                    {/* Join Date */}
                                    <td className="p-4">
                                        <div className="flex items-center gap-1.5 text-xs text-gray-400">
                                            <Calendar size={13} />
                                            {new Date(user.createdAt).toLocaleDateString(undefined, {
                                                year: 'numeric', month: 'short', day: 'numeric'
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredUsers.length === 0 && (
                        <div className="p-12 text-center">
                            <Users className="mx-auto mb-3 text-gray-300" size={40} />
                            <p className="text-gray-500 font-medium">
                                {search ? 'No users match your search' : 'No users found'}
                            </p>
                            <p className="text-gray-400 text-sm mt-1">
                                {search ? 'Try a different name or email' : 'Users will appear here after they register'}
                            </p>
                        </div>
                    )}

                    {/* Table Footer */}
                    {filteredUsers.length > 0 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 p-4 text-xs text-gray-400">
                            <span>Showing {filteredUsers.length} of {users.length} users on this page. Total users: {totalUsers}</span>
                            {totalPages > 1 && (
                                <div className="flex items-center gap-2 text-sm">
                                    <button
                                        onClick={() => setPage((current) => Math.max(current - 1, 1))}
                                        disabled={page <= 1}
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                    >
                                        Previous
                                    </button>
                                    <span className="text-gray-500">Page {page} of {totalPages}</span>
                                    <button
                                        onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                                        disabled={page >= totalPages}
                                        className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                    >
                                        Next
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
