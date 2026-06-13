"use client";
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import { Loader2, TrendingUp, ShoppingCart, Package, Users, ArrowUpRight, type LucideIcon } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
    const [data, setData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function loadData() {
            try {
                const res = await api.get('/analytics/dashboard');
                setData(res.data);
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            } finally {
                setLoading(false);
            }
        }
        loadData();
    }, []);

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-600" /></div>;
    if (!data) return <div className="p-10 text-center text-red-500">Failed to load data</div>;

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Dashboard Overview</h2>
                    <p className="text-gray-500 text-sm mt-1">Welcome back to your admin panel</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-4 py-2 rounded-lg shadow-sm border border-gray-100">
                    {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard
                    title="Total Revenue"
                    value={`Rs. ${data.totalSales.toLocaleString()}`}
                    icon={TrendingUp}
                    color="blue"
                />
                <StatCard
                    title="Total Orders"
                    value={data.totalOrders}
                    icon={ShoppingCart}
                    color="purple"
                />
                <StatCard
                    title="Active Products"
                    value={data.productCount}
                    icon={Package}
                    color="orange"
                />
                <StatCard
                    title="Total Customers"
                    value={data.userCount}
                    icon={Users}
                    color="green"
                />
            </div>

            {/* Charts Section */}
            <AnalyticsCharts salesData={data.salesOverTime} statusData={data.orderStatusDist} />

            {/* Recent Orders Table */}
            <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                    <h3 className="font-bold text-lg text-gray-800">Recent Orders</h3>
                    <Link href="/orders" className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium">
                        View All <ArrowUpRight size={16} />
                    </Link>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500">
                            <tr>
                                <th className="p-4 font-medium">Order ID</th>
                                <th className="p-4 font-medium">Customer</th>
                                <th className="p-4 font-medium">Items</th>
                                <th className="p-4 font-medium">Total</th>
                                <th className="p-4 font-medium">Status</th>
                                <th className="p-4 font-medium">Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {data.recentOrders.map((order: RecentOrder) => (
                                <tr key={order._id} className="hover:bg-gray-50/50 transition">
                                    <td className="p-4 font-medium text-gray-900">#{order._id.slice(-6).toUpperCase()}</td>
                                    <td className="p-4">{order.user?.name || 'Guest'}</td>
                                    <td className="p-4">{order.orderItems.length} items</td>
                                    <td className="p-4 font-medium">Rs. {order.totalPrice}</td>
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium 
                                            ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                                    'bg-yellow-100 text-yellow-800'}`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                            {data.recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">No active orders found</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }: StatCardProps) {
    const colors: Record<StatCardProps['color'], string> = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        orange: 'bg-orange-50 text-orange-600',
        green: 'bg-green-50 text-green-600',
    };

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-gray-500 text-sm font-medium">{title}</p>
                    <h3 className="text-2xl font-bold mt-2 text-gray-900">{value}</h3>
                </div>
                <div className={`p-3 rounded-xl ${colors[color]}`}>
                    <Icon size={22} />
                </div>
            </div>
        </div>
    );
}

interface DashboardData {
    totalSales: number;
    totalOrders: number;
    productCount: number;
    userCount: number;
    salesOverTime: { date: string; revenue: number; orders: number }[];
    orderStatusDist: { name: string; value: number }[];
    recentOrders: RecentOrder[];
}

interface RecentOrder {
    _id: string;
    user?: { name?: string };
    orderItems: unknown[];
    totalPrice: number;
    status: string;
    createdAt: string;
}

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    color: 'blue' | 'purple' | 'orange' | 'green';
}
