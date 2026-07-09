"use client";

import { useEffect, useRef, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';


interface AnalyticsProps {
    salesData: SalesDataPoint[];
    statusData: StatusDataPoint[];
}

interface SalesDataPoint extends Record<string, string | number> {
    date: string;
    revenue: number;
    orders: number;
}

interface StatusDataPoint extends Record<string, string | number> {
    name: string;
    value: number;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function AnalyticsCharts({ salesData, statusData }: AnalyticsProps) {
    const [salesRef, salesWidth] = useMeasuredWidth();
    const [statusRef, statusWidth] = useMeasuredWidth();

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sales Trend */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Revenue Trend (Last 7 Days)</h3>
                <div ref={salesRef} className="h-64 min-w-0">
                    {salesWidth > 0 && salesData && salesData.length > 0 ? (
                            <BarChart width={salesWidth} height={256} data={salesData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                                <Tooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Revenue (Rs)" />
                            </BarChart>
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-400 text-sm">No sales data available</div>
                    )}
                </div>
            </div>

            {/* Order Status */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-lg mb-4 text-gray-800">Order Status Distribution</h3>
                <div ref={statusRef} className="h-64 min-w-0">
                    {statusWidth > 0 && statusData && statusData.length > 0 ? (
                            <PieChart width={statusWidth} height={256}>
                                <Pie
                                    data={statusData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statusData.map((entry: StatusDataPoint, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                            </PieChart>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-400 text-sm">No orders yet</div>
                    )}
                </div>
                <div className="flex flex-wrap justify-center gap-4 mt-4">
                    {statusData && statusData.map((entry: StatusDataPoint, index: number) => (
                        <div key={entry.name} className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                            <span className="text-xs text-gray-600 font-medium">{entry.name} ({entry.value})</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

function useMeasuredWidth() {
    const ref = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);

    useEffect(() => {
        const element = ref.current;
        if (!element) return;

        const updateWidth = () => setWidth(Math.max(Math.floor(element.getBoundingClientRect().width), 0));
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return [ref, width] as const;
}
