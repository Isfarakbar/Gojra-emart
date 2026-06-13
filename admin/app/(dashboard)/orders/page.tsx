"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Loader2, Eye, X } from 'lucide-react';

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
    totalPrice: number;
    status: string;
    createdAt: string;
    location?: {
        type: string;
        coordinates: number[];
    };
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const { data } = await api.get('/orders');
            setOrders(data.orders ?? data);
        } catch (error) {
            console.error(error);
            alert('Failed to fetch orders');
        } finally {
            setLoading(false);
        }
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

    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Orders</h2>

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
                                <div className="flex justify-between items-center mt-3 pt-3 border-t">
                                    <span className="font-bold">Total</span>
                                    <span className="font-bold text-lg text-blue-600">Rs. {selectedOrder.totalPrice}</span>
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

                                    {selectedOrder.location && selectedOrder.location.coordinates && (
                                        <div className="mt-4">
                                            <a
                                                href={`https://www.google.com/maps?q=${selectedOrder.location.coordinates[1]},${selectedOrder.location.coordinates[0]}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-9 13-9 13s-9-7-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>
                                                View Live Location
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
