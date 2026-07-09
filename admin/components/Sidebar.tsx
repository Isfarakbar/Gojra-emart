"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, ShoppingBag, LogOut, User, Layers, Users, Settings, BarChart3, BadgePercent, Bell, MessageSquare, Star, Warehouse, Bike, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function Sidebar({
    isOpen = false,
    onClose,
}: {
    isOpen?: boolean;
    onClose?: () => void;
}) {
    const pathname = usePathname();
    const { logout, user } = useAuth();

    const links = [
        { href: '/', label: 'Dashboard', icon: LayoutDashboard },
        { href: '/products', label: 'Products', icon: Package },
        { href: '/inventory', label: 'Inventory', icon: Warehouse },
        { href: '/categories', label: 'Categories', icon: Layers },
        { href: '/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/whatsapp', label: 'WhatsApp Inbox', icon: MessageCircle },
        { href: '/riders', label: 'Riders', icon: Bike },
        { href: '/promos', label: 'Promo Codes', icon: BadgePercent },
        { href: '/notifications', label: 'Notifications', icon: Bell },
        { href: '/support', label: 'Support', icon: MessageSquare },
        { href: '/reviews', label: 'Reviews', icon: Star },
        { href: '/reports', label: 'Reports', icon: BarChart3 },
        { href: '/users', label: 'Users', icon: Users },
        { href: '/settings/store', label: 'Store Settings', icon: Settings },
        { href: '/settings/home', label: 'Home Layout', icon: LayoutDashboard },
    ];

    return (
        <aside className={`z-50 flex min-h-screen w-64 flex-col overflow-y-auto bg-slate-900 text-white fixed left-0 top-0 transition-transform duration-200 md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="p-6 border-b border-slate-800">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                    Gojra E-Mart
                </h1>
                <p className="text-xs text-slate-400 mt-1">Admin Panel</p>
            </div>

            <nav className="flex-1 p-4 space-y-2">
                {links.map((link) => {
                    const Icon = link.icon;
                    const isActive = pathname === link.href;
                    return (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={onClose}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' // Active state
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                }`}
                        >
                            <Icon size={20} />
                            <span className="font-medium">{link.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-4 border-t border-slate-800">
                <div className="flex items-center gap-3 px-4 py-3 mb-2">
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                        <User size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user?.name || 'Admin'}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                    </div>
                </div>
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors text-sm"
                >
                    <LogOut size={16} />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
}
