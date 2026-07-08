"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { ExternalLink, Eye, Loader2, MapPin, Search, X } from 'lucide-react';

interface OrderItem {
    name: string;
    qty: number;
    price: number;
    product: string;
}

interface Order {
    _id: string;
    user: { name: string; email: string };
    orderItems: OrderItem[];
    shippingAddress: { street: string; area: string; city: string; phone: string };
    paymentMethod: string;
    itemsPrice?: number;
    deliveryFee?: number;
    totalPrice: number;
    status: string;
    createdAt: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [totalOrders, setTotalOrders] = useState(0);

    const fetchOrders = useCallback(async (targetPage = page) => {
        try {
            const { data } = await api.get('/orders', {
                params: {
                    page: targetPage,
                    search: search.trim() || undefined,
                    status: statusFilter || undefined,
                }
            });
            setOrders(data.orders ?? data);
            setTotalPages(data.pages ?? 1);
            setTotalOrders(data.total ?? 0);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
    }, [page, search, statusFilter]);

    useEffect(() => {
        fetchOrders(page);
    }, [fetchOrders, page]);

    const applyFilters = () => {
        setLoading(true);
        setPage(1);
        fetchOrders(1);
    };

    const updateStatus = async (id: string, status: string) => {
        try {
            await api.put(`/orders/${id}/status`, { status });
            setOrders(orders.map(o => o._id === id ? { ...o, status } : o));
            if (selectedOrder?._id === id) {
                setSelectedOrder({ ...selectedOrder, status });
            }
        } catch (error) {
            console.error(error);
            alert('Failed to update status');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'Placed': return 'bg-yellow-100 text-yellow-800';
            case 'Confirmed': return 'bg-blue-100 text-blue-800';
            case 'Packing': return 'bg-purple-100 text-purple-800';
            case 'Out for Delivery': return 'bg-orange-100 text-orange-800';
            case 'Delivered': return 'bg-green-100 text-green-800';
            case 'Cancelled': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const hasLocation = (order: Order) =>
        order.location?.latitude != null && order.location?.longitude != null;

    const getMapUrl = (order: Order) =>
        `https://maps.google.com/?q=${order.location!.latitude},${order.location!.longitude}`;

    const formatCoordinates = (order: Order) =>
        `${order.location!.latitude.toFixed(6)}, ${order.location!.longitude.toFixed(6)}`;

    return (
        <div>
            <div className="mb-6 flex flex-col gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Orders</h2>
                    <p className="mt-1 text-sm text-gray-500">Search and manage customer orders.</p>
                </div>
                <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <div className="grid gap-3 md:grid-cols-[1fr_220px_auto]">
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') applyFilters();
                                }}
                                placeholder="Search order ID, customer, email, or phone"
                                className="w-full rounded-lg border border-gray-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(event) => setStatusFilter(event.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        >
                            <option value="">All Statuses</option>
                            {['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'].map(status => (
                                <option key={status} value={status}>{status}</option>
                            ))}
                        </select>
                        <button
                            onClick={applyFilters}
                            className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                        >
                            Apply
                        </button>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm">
                            <tr>
                                <th className="p-4 font-medium">Order ID</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Date</th>
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Location</th>
                                <th className="p-4 font-medium text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-gray-700 text-sm">
                            {orders.map((order) => (
                                <tr key={order._id} className="hover:bg-gray-50/50">
                                    <td className="p-4 font-mono text-xs text-gray-500">#{order._id.slice(-6)}</td>
                                    <td className="p-4">{order.user?.name || 'Guest'}</td>
                                    <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 font-medium">Rs. {order.totalPrice}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {hasLocation(order) ? (
                                            <a
                                                href={getMapUrl(order)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                <MapPin size={14} />
                                                View on Map
                                            </a>
                                        ) : (
                                            <span className="text-xs text-gray-400">Not captured</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-right">
                                        <button
                                            onClick={() => setSelectedOrder(order)}
                                            className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition"
                                        >
                                            <Eye size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {orders.length === 0 && <div className="p-8 text-center text-gray-500">No orders found.</div>}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-4 py-3 text-sm">
                            <span className="text-gray-500">Page {page} of {totalPages} · {totalOrders} order(s)</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setPage((current) => Math.max(current - 1, 1))}
                                    disabled={page <= 1}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setPage((current) => Math.min(current + 1, totalPages))}
                                    disabled={page >= totalPages}
                                    className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 font-medium text-gray-600 disabled:opacity-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
                            <div>
                                <h3 className="text-lg font-bold">Order Details</h3>
                                <p className="text-sm text-gray-500">#{selectedOrder._id}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Status Update */}
                            <div className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Current Status</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {['Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'].map((status) => (
                                        <button
                                            key={status}
                                            onClick={() => updateStatus(selectedOrder._id, status)}
                                            disabled={selectedOrder.status === status}
                                            className={`px-3 py-1 text-xs font-medium rounded border transition ${selectedOrder.status === status
                                                ? 'bg-blue-600 text-white border-blue-600'
                                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                                                }`}
                                        >
                                            {status}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Items */}
                            <div>
                                <h4 className="font-semibold mb-3 text-sm uppercase tracking-wide text-gray-500">Items</h4>
                                <div className="border rounded-lg divide-y">
                                    {selectedOrder.orderItems.map((item, idx) => (
                                        <div key={idx} className="p-3 flex justify-between items-center bg-gray-50/50">
                                            <div>
                                                <p className="font-medium text-sm">{item.name}</p>
                                                <p className="text-xs text-gray-500">{item.qty} x Rs. {item.price}</p>
                                            </div>
                                            <p className="font-medium text-sm">Rs. {item.qty * item.price}</p>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-3 space-y-2 border-t pt-3">
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Items</span>
                                        <span>Rs. {selectedOrder.itemsPrice ?? selectedOrder.totalPrice}</span>
                                    </div>
                                    <div className="flex justify-between text-sm text-gray-600">
                                        <span>Delivery</span>
                                        <span>Rs. {selectedOrder.deliveryFee ?? 0}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-t pt-2">
                                        <span className="font-bold">Total</span>
                                        <span className="font-bold text-lg text-blue-600">Rs. {selectedOrder.totalPrice}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Customer Info */}
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-gray-500">Customer</h4>
                                    <p className="text-sm font-medium">{selectedOrder.user?.name}</p>
                                    <p className="text-sm text-gray-500">{selectedOrder.user?.email}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-2 text-sm uppercase tracking-wide text-gray-500">Shipping</h4>
                                    <p className="text-sm text-gray-600 leading-relaxed">
                                        {selectedOrder.shippingAddress.street}<br />
                                        {selectedOrder.shippingAddress.area}, {selectedOrder.shippingAddress.city}<br />
                                        {selectedOrder.shippingAddress.phone}
                                    </p>

                                    {hasLocation(selectedOrder) && (
                                        <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                                            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-900">
                                                <MapPin size={14} />
                                                GPS Location
                                            </p>
                                            <p className="font-mono text-xs text-gray-700">
                                                {formatCoordinates(selectedOrder)}
                                            </p>
                                            <a
                                                href={getMapUrl(selectedOrder)}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800"
                                            >
                                                View on Map
                                                <ExternalLink size={14} />
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
