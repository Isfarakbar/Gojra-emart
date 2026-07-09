"use client";

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { BadgePercent, Banknote, Loader2, PackageCheck, ReceiptText, Truck, type LucideIcon } from 'lucide-react';

interface ReportSummary {
    grossSales: number;
    discounts: number;
    deliveryFees: number;
    totalCash: number;
    orderCount: number;
}

interface StatusBreakdown {
    _id: string;
    count: number;
    total: number;
}

interface ReportOrder {
    _id: string;
    user?: { name?: string; phone?: string; email?: string };
    status: string;
    totalPrice: number;
    deliveryFee?: number;
    itemsPrice?: number;
    createdAt: string;
}

const todayInput = () => new Date().toISOString().slice(0, 10);

export default function ReportsPage() {
    const [startDate, setStartDate] = useState(todayInput());
    const [endDate, setEndDate] = useState(todayInput());
    const [summary, setSummary] = useState<ReportSummary | null>(null);
    const [statusBreakdown, setStatusBreakdown] = useState<StatusBreakdown[]>([]);
    const [orders, setOrders] = useState<ReportOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchReport = async () => {
        setLoading(true);
        try {
            const { data } = await api.get('/reports/cash', {
                params: { startDate, endDate },
            });
            setSummary(data.summary);
            setStatusBreakdown(data.statusBreakdown ?? []);
            setOrders(data.recentOrders ?? []);
        } catch (error) {
            console.error(error);
            alert('Failed to load report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const money = (amount: number | undefined) => `Rs. ${(amount ?? 0).toLocaleString()}`;

    return (
        <div className="space-y-6 pb-20">
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Reports</h2>
                    <p className="mt-1 text-sm text-gray-500">Cash collection, delivery fees, and order activity.</p>
                </div>
                <div className="flex flex-wrap gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                    <label className="space-y-1">
                        <span className="block text-xs font-semibold uppercase text-gray-500">Start</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(event) => setStartDate(event.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </label>
                    <label className="space-y-1">
                        <span className="block text-xs font-semibold uppercase text-gray-500">End</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(event) => setEndDate(event.target.value)}
                            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
                        />
                    </label>
                    <button
                        onClick={fetchReport}
                        className="self-end rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                        Apply
                    </button>
                </div>
            </div>

            {loading || !summary ? (
                <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>
            ) : (
                <>
                    <div className="grid gap-5 md:grid-cols-5">
                        <ReportCard title="Total Cash" value={money(summary.totalCash)} icon={Banknote} color="green" />
                        <ReportCard title="Product Sales" value={money(summary.grossSales)} icon={ReceiptText} color="blue" />
                        <ReportCard title="Discounts" value={money(summary.discounts)} icon={BadgePercent} color="red" />
                        <ReportCard title="Delivery Fees" value={money(summary.deliveryFees)} icon={Truck} color="orange" />
                        <ReportCard title="Orders" value={summary.orderCount.toString()} icon={PackageCheck} color="purple" />
                    </div>

                    <div className="grid gap-6 lg:grid-cols-3">
                        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
                            <h3 className="mb-4 font-bold text-gray-800">Status Breakdown</h3>
                            <div className="space-y-3">
                                {statusBreakdown.length === 0 ? (
                                    <p className="text-sm text-gray-400">No orders in this date range.</p>
                                ) : statusBreakdown.map(item => (
                                    <div key={item._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                                        <span className="font-semibold text-gray-700">{item._id}</span>
                                        <span className="text-gray-500">{item.count} · {money(item.total)}</span>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
                            <div className="border-b border-gray-100 p-5">
                                <h3 className="font-bold text-gray-800">Recent Orders</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="p-3">Order</th>
                                            <th className="p-3">Customer</th>
                                            <th className="p-3">Status</th>
                                            <th className="p-3">Total</th>
                                            <th className="p-3">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map(order => (
                                            <tr key={order._id}>
                                                <td className="p-3 font-mono text-xs text-gray-500">#{order._id.slice(-6).toUpperCase()}</td>
                                                <td className="p-3">{order.user?.name || order.user?.phone || 'Guest'}</td>
                                                <td className="p-3">{order.status}</td>
                                                <td className="p-3 font-semibold">{money(order.totalPrice)}</td>
                                                <td className="p-3 text-gray-500">{new Date(order.createdAt).toLocaleString()}</td>
                                            </tr>
                                        ))}
                                        {orders.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-400">No orders found.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </div>
                </>
            )}
        </div>
    );
}

function ReportCard({ title, value, icon: Icon, color }: {
    title: string;
    value: string;
    icon: LucideIcon;
    color: 'green' | 'blue' | 'orange' | 'purple' | 'red';
}) {
    const colors = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        orange: 'bg-orange-50 text-orange-600',
        purple: 'bg-purple-50 text-purple-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
                </div>
                <div className={`rounded-xl p-3 ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}
