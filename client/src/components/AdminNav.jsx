import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import API from '../api/axios';
import { toast } from 'react-hot-toast';
import {
    ShoppingBag,
    LayoutGrid,
    Bell,
    Shuffle,
    Plus,
    ChevronRight
} from 'lucide-react';

const AdminNav = ({ activePage, onActionClick, actionLabel, actionIcon: ActionIcon }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sortMode, setSortMode] = useState('recent');
    const [sortToggling, setSortToggling] = useState(false);

    useEffect(() => {
        // Load current global sort mode
        API.get('/settings/sort').then(({ data }) => setSortMode(data.sortMode)).catch(() => { });
    }, []);

    const toggleSortMode = async () => {
        const next = sortMode === 'recent' ? 'random' : 'recent';
        setSortToggling(true);
        try {
            const { data } = await API.put('/settings/sort', { sortMode: next });
            setSortMode(data.sortMode);
            toast.success(
                data.sortMode === 'random'
                    ? '🔀 Shuffle Suggestions ON'
                    : '📅 Showing newest products first'
            );
        } catch {
            toast.error('Failed to update sort mode');
        } finally {
            setSortToggling(false);
        }
    };

    const navItems = [
        { id: 'products', label: 'Products', path: '/admin/products', icon: LayoutGrid },
        { id: 'orders', label: 'Orders', path: '/admin/orders', icon: ShoppingBag },
        { id: 'broadcast', label: 'Broadcast', path: '/admin/broadcast', icon: Bell },
    ];

    return (
        <div className="space-y-6 mb-8">
            {/* Top Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight capitalize">
                        {activePage} Management
                    </h2>
                    <p className="text-gray-500 dark:text-gray-400 font-medium text-sm mt-1">
                        {activePage === 'products' && 'Manage your catalog, stock, and media.'}
                        {activePage === 'orders' && 'Track and manage all customer orders.'}
                        {activePage === 'broadcast' && 'Send custom push notifications to all users.'}
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={toggleSortMode}
                        disabled={sortToggling}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-bold text-sm border transition-all active:scale-95 disabled:opacity-50 ${sortMode === 'random'
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/5 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-white/20'
                            }`}
                    >
                        <Shuffle size={16} className={sortToggling ? 'animate-spin' : ''} />
                        <span className="hidden sm:inline">Shuffle:</span> {sortMode === 'random' ? 'ON' : 'OFF'}
                    </button>

                    {onActionClick && (
                        <button
                            onClick={onActionClick}
                            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-2xl font-black shadow-lg shadow-blue-500/25 hover:bg-blue-700 active:scale-95 transition-all text-sm"
                        >
                            {ActionIcon ? <ActionIcon size={18} strokeWidth={3} /> : <Plus size={18} strokeWidth={3} />}
                            {actionLabel}
                        </button>
                    )}
                </div>
            </div>

            {/* Sub Navigation Tabs */}
            <div className="flex items-center gap-2 p-1.5 bg-gray-100/50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-white/5 w-fit max-w-full overflow-x-auto no-scrollbar">
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path;
                    const Icon = item.icon;
                    return (
                        <button
                            key={item.id}
                            onClick={() => navigate(item.path)}
                            className={`flex items-center gap-2.5 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all whitespace-nowrap ${isActive
                                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-100 dark:border-white/5'
                                    : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                        >
                            <Icon size={14} className={isActive ? 'text-blue-600' : ''} />
                            {item.label}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default AdminNav;
