'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    ShoppingBag,
    CloudLightning,
    Activity,
    Loader2
} from 'lucide-react';

import DashboardSkeleton from '@/app/components/skeletons/DashboardSkeleton';

export default function SuperAdminDashboard() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/super-admin/dashboard');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error("Failed to fetch dashboard stats", error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    const formatMoney = (n: number) => "IDR " + (n / 1000).toLocaleString('id-ID') + "K";

    if (loading) {
        return <DashboardSkeleton />;
    }

    // Use a simple fade-in for the whole content to seamlessly replace skeleton
    const fadeIn = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { duration: 0.3 } }
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="p-6 md:p-8 pb-32 max-w-[1600px] mx-auto flex flex-col gap-6 md:gap-8"
        >

            {/* 1. Header */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-black dark:text-white tracking-tight mb-1">
                        Dashboard Overview
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-neutral-400">
                        Welcome back, Chief. Main Branch is <span className="text-green-500 font-bold">OPEN</span>.
                    </p>
                </div>
                <div className="flex gap-3">
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => window.location.reload()}
                        className="flex-1 md:flex-none justify-center px-4 py-3 md:py-2 bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        <CloudLightning size={16} />
                        Refresh
                    </motion.button>
                    <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="flex-1 md:flex-none justify-center px-4 py-3 md:py-2 bg-[#FFBF00] text-black rounded-xl text-sm font-black shadow-[0_4px_15px_rgba(255,191,0,0.3)] hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <Activity size={16} />
                        Live Monitor
                    </motion.button>
                </div>
            </header>

            {/* 2. Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">

                {/* Card 1: Revenue (Today) */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] flex flex-col justify-between h-44 group active:border-[#FFBF00] transition-colors shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <p className="text-gray-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest">Today's Revenue</p>
                            <h3 className="text-3xl font-black dark:text-white tracking-tight">{stats ? formatMoney(stats.revenue) : 'IDR 0'}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-1">
                            <TrendingUp size={16} />
                            <span className="text-xs font-bold">Today</span>
                        </div>
                    </div>
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                            <span>Avg Order Value</span>
                            <span>{stats ? formatMoney(stats.avgOrderValue) : '0'}</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-[#222] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-[#FFBF00] h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </motion.div>

                {/* Card 2: Active Staff */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] flex flex-col justify-between h-44 group active:border-[#FFBF00] transition-colors shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <p className="text-gray-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest">Active Staff</p>
                            <h3 className="text-3xl font-black dark:text-white tracking-tight">{stats?.activeStaff || 0}<span className="text-neutral-500 text-xl font-medium">/{stats?.totalStaff || 12}</span></h3>
                        </div>
                        <div className="p-2 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-600 dark:text-gray-400">
                            <span className="text-xs font-bold">Shift Today</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                            {[...Array(Math.min(5, stats?.activeStaff || 0))].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white dark:border-[#111] dark:bg-[#333]"></div>
                            ))}
                            {(stats?.activeStaff || 0) > 5 && (
                                <div className="w-8 h-8 rounded-full bg-[#111] text-white border-2 border-white dark:border-[#111] flex items-center justify-center text-[10px] font-bold">+{stats.activeStaff - 5}</div>
                            )}
                        </div>
                        <span className="text-xs text-green-500 font-bold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                            Online
                        </span>
                    </div>
                </motion.div>

                {/* Card 3: Orders */}
                <motion.div
                    whileTap={{ scale: 0.98 }}
                    className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] flex flex-col justify-between h-44 group active:border-[#FFBF00] transition-colors shadow-sm"
                >
                    <div className="flex justify-between items-start">
                        <div className="flex flex-col gap-1">
                            <p className="text-gray-500 dark:text-neutral-400 text-[10px] font-black uppercase tracking-widest">Orders Today</p>
                            <h3 className="text-3xl font-black dark:text-white tracking-tight">{stats?.orders || 0}</h3>
                        </div>
                        <div className="p-2 rounded-lg bg-green-500/10 text-green-500 flex items-center gap-1">
                            <ShoppingBag size={16} />
                            <span className="text-xs font-bold">New</span>
                        </div>
                    </div>
                    <div className="flex flex-col w-full gap-2">
                        <div className="flex justify-between text-xs text-gray-400 font-mono">
                            <span>Avg Prep Time</span>
                            <span className="text-black dark:text-white font-bold">-- min</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-[#222] h-1.5 rounded-full overflow-hidden">
                            <div className="bg-black dark:bg-white h-full rounded-full" style={{ width: '100%' }}></div>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* 3. Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Main Chart: Traffic (Bar representation) */}
                <div className="lg:col-span-2 bg-white dark:bg-[#111] p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-black dark:text-white">Hourly Traffic</h3>
                            <p className="text-sm text-gray-500">Estimated order density (2h blocks)</p>
                        </div>
                    </div>

                    <div className="flex-1 flex items-end gap-2 sm:gap-6 h-[200px] md:h-[250px] w-full border-b border-gray-100 dark:border-[#222] pb-2 relative overflow-x-auto">
                        {/* Bars */}
                        {stats?.traffic?.map((bar: any, idx: number) => {
                            // Normalize height: find max value first
                            const maxVal = Math.max(...stats.traffic.map((b: any) => b.val)) || 1;
                            const heightPct = Math.max(10, (bar.val / maxVal) * 100) + '%';

                            return (
                                <motion.div
                                    key={idx}
                                    whileTap={{ scale: 0.9 }}
                                    className="flex-1 flex flex-col justify-end items-center gap-3 h-full group cursor-pointer z-10 min-w-[30px]"
                                >
                                    <div
                                        className={`w-full max-w-[40px] rounded-t-sm transition-all group-hover:opacity-80 relative ${bar.val === maxVal && bar.val > 0 ? 'bg-[#FFBF00]' : 'bg-gray-200 dark:bg-[#333]'}`}
                                        style={{ height: heightPct }}
                                    >
                                        <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                            {bar.val} Orders
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-mono font-bold text-gray-400">{bar.time}</span>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                {/* Top Selling */}
                <div className="bg-white dark:bg-[#111] p-6 md:p-8 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-black dark:text-white">Top Selling (Today)</h3>
                    </div>

                    <div className="flex flex-col gap-4">
                        {stats?.topSelling?.length > 0 ? stats.topSelling.map((item: any, idx: number) => (
                            <motion.div
                                key={idx}
                                whileTap={{ scale: 0.96 }}
                                className="flex items-center justify-between group cursor-pointer p-2 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] rounded-xl transition-all"
                            >
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-bold text-gray-300 font-mono">0{idx + 1}</span>
                                    <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-500">
                                        IMG
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold dark:text-white leading-tight">{item.name}</h4>
                                        <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">Item</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black dark:text-white">{item.qty}</p>
                                    <p className="text-[8px] text-gray-400 uppercase tracking-widest">Sold</p>
                                </div>
                            </motion.div>
                        )) : (
                            <p className="text-sm text-gray-500">No sales yet today.</p>
                        )}
                    </div>
                </div>

            </div>

            {/* 4. System Status */}
            <div className="bg-black text-white p-8 rounded-2xl border border-gray-800 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-[#FFBF00]/20 rounded-full blur-3xl pointer-events-none"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
                        <div>
                            <h3 className="text-xl font-black">All Systems Operational</h3>
                            <p className="text-gray-400 text-sm">POS, Kitchen Display, and Inventory are syncing normally.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex flex-col items-center px-6 border-r border-gray-800">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">POS Latency</span>
                            <span className="font-mono font-bold text-green-400">{stats?.systemStatus?.posLatency || '--'}</span>
                        </div>
                        <div className="flex flex-col items-center px-6">
                            <span className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Last Sync</span>
                            <span className="font-mono font-bold text-white">Now</span>
                        </div>
                    </div>
                </div>
            </div>

        </motion.div>
    );
}
