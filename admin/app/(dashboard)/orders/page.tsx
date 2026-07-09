"use client";

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/getErrorMessage';
import { ExternalLink, Eye, Loader2, MapPin, Printer, Save, Search, X } from 'lucide-react';

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
    discountAmount?: number;
    promoCode?: string;
    deliveryDate?: string;
    deliverySlot?: { label?: string; startTime?: string; endTime?: string };
    totalPrice: number;
    status: string;
    statusHistory?: {
        _id?: string;
        status: string;
        changedAt: string;
        note?: string;
        changedBy?: { name?: string; role?: string };
    }[];
    cancellationReason?: string;
    adminNote?: string;
    assignedRider?: {
        _id: string;
        name: string;
        phone: string;
        vehicleType?: string;
        vehicleNumber?: string;
        status?: string;
    } | null;
    createdAt: string;
    location?: {
        latitude: number;
        longitude: number;
    };
}

interface Rider {
    _id: string;
    name: string;
    phone: string;
    status: string;
    activeOrders?: number;
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
    const [statusNote, setStatusNote] = useState('');
    const [cancellationReason, setCancellationReason] = useState('');
    const [adminNote, setAdminNote] = useState('');
    const [updating, setUpdating] = useState(false);
    const [riders, setRiders] = useState<Rider[]>([]);

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

    useEffect(() => {
        api.get('/riders', { params: { active: true } })
            .then(({ data }) => setRiders(data))
            .catch(error => console.error(error));
    }, []);

    const applyFilters = () => {
        setLoading(true);
        setPage(1);
        fetchOrders(1);
    };

    const updateStatus = async (id: string, status: string) => {
        if (status === 'Cancelled' && !cancellationReason.trim()) {
            alert('Enter a cancellation reason first.');
            return;
        }
        setUpdating(true);
        try {
            const { data } = await api.put(`/orders/${id}/status`, {
                status,
                note: statusNote.trim(),
                cancellationReason: cancellationReason.trim(),
            });
            setOrders(orders.map(o => o._id === id ? data : o));
            if (selectedOrder?._id === id) {
                setSelectedOrder(data);
            }
            setStatusNote('');
            setCancellationReason('');
        } catch (error: unknown) {
            alert(getErrorMessage(error, 'Failed to update status'));
        } finally {
            setUpdating(false);
        }
    };

    const saveAdminNote = async () => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            const { data } = await api.put(`/orders/${selectedOrder._id}/admin-note`, { adminNote });
            setSelectedOrder(current => current ? { ...current, adminNote: data.adminNote } : current);
            setOrders(current => current.map(order => order._id === data._id ? { ...order, adminNote: data.adminNote } : order));
        } catch (error: unknown) {
            alert(getErrorMessage(error, 'Failed to save note'));
        } finally {
            setUpdating(false);
        }
    };

    const assignRider = async (riderId: string) => {
        if (!selectedOrder) return;
        setUpdating(true);
        try {
            const { data } = await api.put(`/riders/assign/${selectedOrder._id}`, {
                riderId: riderId || null,
            });
            setSelectedOrder(current => current ? { ...current, assignedRider: data.assignedRider || null } : current);
            setOrders(current => current.map(order => order._id === selectedOrder._id ? { ...order, assignedRider: data.assignedRider || null } : order));
            const { data: refreshedRiders } = await api.get('/riders', { params: { active: true } });
            setRiders(refreshedRiders);
        } catch (error: unknown) {
            alert(getErrorMessage(error, 'Failed to assign rider'));
        } finally {
            setUpdating(false);
        }
    };

    const nextStatus: Record<string, string | null> = {
        Placed: 'Confirmed',
        Confirmed: 'Packing',
        Packing: 'Out for Delivery',
        'Out for Delivery': 'Delivered',
        Delivered: null,
        Cancelled: null,
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

    const formatDeliverySlot = (order: Order) => {
        if (!order.deliverySlot?.label) return 'ASAP';
        return `${order.deliverySlot.label} (${order.deliverySlot.startTime} - ${order.deliverySlot.endTime})`;
    };

    const formatDeliverySchedule = (order: Order) => {
        if (!order.deliveryDate) return formatDeliverySlot(order);
        const date = new Date(`${order.deliveryDate}T00:00:00`);
        return `${date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })} · ${formatDeliverySlot(order)}`;
    };

    const printOrder = (order: Order) => {
        const rows = order.orderItems.map(item => `
            <tr>
                <td>${item.name}</td>
                <td style="text-align:center">${item.qty}</td>
                <td style="text-align:right">Rs. ${item.price}</td>
                <td style="text-align:right">Rs. ${item.qty * item.price}</td>
            </tr>
        `).join('');
        const popup = window.open('', '_blank', 'width=800,height=900');
        if (!popup) return;
        popup.document.write(`
            <html>
                <head>
                    <title>Invoice ${order._id.slice(-6).toUpperCase()}</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 24px; color: #111827; }
                        h1 { margin: 0; font-size: 24px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 18px; }
                        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px; font-size: 13px; }
                        th { text-align: left; background: #f9fafb; }
                        .meta { color: #6b7280; font-size: 13px; margin-top: 4px; }
                        .summary { margin-left: auto; width: 280px; margin-top: 18px; }
                        .summary div { display: flex; justify-content: space-between; padding: 6px 0; }
                        .total { font-weight: 700; font-size: 18px; border-top: 1px solid #e5e7eb; margin-top: 8px; padding-top: 10px; }
                    </style>
                </head>
                <body>
                    <h1>Gojra E-Mart</h1>
                    <p class="meta">Invoice #${order._id.slice(-6).toUpperCase()} • ${new Date(order.createdAt).toLocaleString()}</p>
                    <p><strong>Customer:</strong> ${order.user?.name || 'Guest'}<br/>
                    <strong>Phone:</strong> ${order.shippingAddress.phone}<br/>
                    <strong>Address:</strong> ${order.shippingAddress.street}, ${order.shippingAddress.area}, ${order.shippingAddress.city}<br/>
                    <strong>Scheduled Delivery:</strong> ${formatDeliverySchedule(order)}</p>
                    <table>
                        <thead><tr><th>Item</th><th>Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="summary">
                        <div><span>Items</span><span>Rs. ${order.itemsPrice ?? order.totalPrice}</span></div>
                        <div><span>Delivery</span><span>Rs. ${order.deliveryFee ?? 0}</span></div>
                        ${(order.discountAmount ?? 0) > 0 ? `<div><span>Discount (${order.promoCode || ''})</span><span>- Rs. ${order.discountAmount}</span></div>` : ''}
                        <div class="total"><span>Total</span><span>Rs. ${order.totalPrice}</span></div>
                    </div>
                </body>
            </html>
        `);
        popup.document.close();
        popup.focus();
        popup.print();
    };

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
                                <th className="p-4 font-medium">Scheduled Delivery</th>
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
                                    <td className="p-4 text-xs text-gray-600">{formatDeliverySchedule(order)}</td>
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
                                            onClick={() => {
                                                setSelectedOrder(order);
                                                setAdminNote(order.adminNote || '');
                                                setStatusNote('');
                                                setCancellationReason('');
                                            }}
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
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => printOrder(selectedOrder)}
                                    className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                                >
                                    <Printer size={16} />
                                    Print
                                </button>
                                <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 space-y-6">
                            {/* Status Update */}
                            <div className="rounded-lg bg-blue-50 p-4">
                                <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-blue-900">Current Status</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${getStatusColor(selectedOrder.status)}`}>
                                        {selectedOrder.status}
                                    </span>
                                </div>
                                <div className="flex gap-2">
                                    {nextStatus[selectedOrder.status] && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder._id, nextStatus[selectedOrder.status]!)}
                                            disabled={updating || (nextStatus[selectedOrder.status] === 'Out for Delivery' && !selectedOrder.assignedRider)}
                                            className="rounded bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50"
                                        >
                                            Mark as {nextStatus[selectedOrder.status]}
                                        </button>
                                    )}
                                    {!['Delivered', 'Cancelled'].includes(selectedOrder.status) && (
                                        <button
                                            onClick={() => updateStatus(selectedOrder._id, 'Cancelled')}
                                            disabled={updating}
                                            className="rounded border border-red-200 bg-white px-3 py-2 text-xs font-semibold text-red-600 disabled:opacity-50"
                                        >
                                            Cancel Order
                                        </button>
                                    )}
                                </div>
                                </div>
                                {!['Delivered', 'Cancelled'].includes(selectedOrder.status) && (
                                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                                        <input
                                            value={statusNote}
                                            onChange={event => setStatusNote(event.target.value)}
                                            maxLength={300}
                                            placeholder="Optional update note"
                                            className="rounded-md border border-blue-100 bg-white px-3 py-2 text-sm outline-none"
                                        />
                                        <input
                                            value={cancellationReason}
                                            onChange={event => setCancellationReason(event.target.value)}
                                            maxLength={300}
                                            placeholder="Cancellation reason (required to cancel)"
                                            className="rounded-md border border-red-100 bg-white px-3 py-2 text-sm outline-none"
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="rounded-lg border border-gray-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <h4 className="text-sm font-semibold text-gray-800">Delivery Rider</h4>
                                        <p className="mt-1 text-xs text-gray-500">Required before marking the order out for delivery.</p>
                                    </div>
                                    <select
                                        value={selectedOrder.assignedRider?._id || ''}
                                        onChange={event => assignRider(event.target.value)}
                                        disabled={updating || ['Delivered', 'Cancelled', 'Out for Delivery'].includes(selectedOrder.status)}
                                        className="min-w-64 rounded-md border border-gray-200 px-3 py-2 text-sm outline-none focus:border-blue-500 disabled:bg-gray-100"
                                    >
                                        <option value="">Not assigned</option>
                                        {riders.filter(rider => rider.status !== 'Offline' || rider._id === selectedOrder.assignedRider?._id).map(rider => (
                                            <option key={rider._id} value={rider._id}>
                                                {rider.name} · {rider.status} · {rider.activeOrders || 0} active
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                {selectedOrder.assignedRider && (
                                    <div className="mt-3 flex gap-4 rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
                                        <span className="font-semibold">{selectedOrder.assignedRider.name}</span>
                                        <span>{selectedOrder.assignedRider.phone}</span>
                                        <span>{selectedOrder.assignedRider.vehicleType} {selectedOrder.assignedRider.vehicleNumber || ''}</span>
                                    </div>
                                )}
                            </div>

                            <div>
                                <h4 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Status History</h4>
                                <div className="space-y-0">
                                    {(selectedOrder.statusHistory?.length
                                        ? selectedOrder.statusHistory
                                        : [{ status: 'Placed', changedAt: selectedOrder.createdAt, note: 'Order placed' }]
                                    ).map((event, index, history) => (
                                        <div key={event._id || `${event.status}-${index}`} className="flex gap-3">
                                            <div className="flex flex-col items-center">
                                                <span className="mt-1 h-3 w-3 rounded-full bg-blue-600" />
                                                {index < history.length - 1 && <span className="h-12 w-px bg-gray-200" />}
                                            </div>
                                            <div className="pb-4">
                                                <p className="text-sm font-semibold text-gray-800">{event.status}</p>
                                                <p className="text-xs text-gray-500">
                                                    {new Date(event.changedAt).toLocaleString()}
                                                    {event.changedBy?.name ? ` · ${event.changedBy.name}` : ''}
                                                </p>
                                                {event.note && <p className="mt-1 text-xs text-gray-600">{event.note}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-gray-500">Internal Admin Note</h4>
                                <textarea
                                    value={adminNote}
                                    onChange={event => setAdminNote(event.target.value)}
                                    rows={3}
                                    maxLength={1000}
                                    placeholder="Private fulfilment instructions. Customers cannot see this."
                                    className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm outline-none focus:border-blue-500"
                                />
                                <button onClick={saveAdminNote} disabled={updating} className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
                                    <Save size={14} /> Save Note
                                </button>
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
                                    {(selectedOrder.discountAmount ?? 0) > 0 && (
                                        <div className="flex justify-between text-sm text-green-700">
                                            <span>Discount {selectedOrder.promoCode ? `(${selectedOrder.promoCode})` : ''}</span>
                                            <span>- Rs. {selectedOrder.discountAmount}</span>
                                        </div>
                                    )}
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

                                    <div className="mt-4 rounded-lg border border-orange-100 bg-orange-50/70 p-3">
                                        <p className="text-xs font-semibold uppercase tracking-wide text-orange-900">Scheduled Delivery</p>
                                        <p className="mt-1 text-sm font-medium text-gray-800">{formatDeliverySchedule(selectedOrder)}</p>
                                    </div>

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
