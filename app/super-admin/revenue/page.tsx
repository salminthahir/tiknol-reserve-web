'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid, AreaChart, Area
} from 'recharts';
import {
    LayoutDashboard,
    Calendar,
    TrendingUp,
    CreditCard,
    ShoppingBag,
    ArrowUpRight,
    Search,
    X,
    Receipt,
    Download,
    ChevronRight,
    Printer,
    Clock,
    DollarSign,
    Activity,
    Filter
} from 'lucide-react';
import DashboardSkeleton from '@/app/components/skeletons/DashboardSkeleton';

// --- TIPE DATA ---
type TransactionItem = {
    name: string;
    qty: number;
    price: number;
};

type Transaction = {
    id: string;
    totalAmount: number;
    paymentType: string;
    createdAt: string;
    items: TransactionItem[];
};

type RevenueData = {
    summary: {
        totalRevenue: number;
        totalOrders: number;
        avgOrderValue: number;
    };
    chartData: { name: string; value: number; date?: string }[];
    paymentMethods: { name: string; value: number }[];
    topProducts: { name: string; qty: number; revenue: number }[];
    recentTransactions: Transaction[];
};

export default function RevenuePage() {
    const [data, setData] = useState<RevenueData | null>(null);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('TODAY'); // TODAY, 7DAYS, 30DAYS
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [dailyData, setDailyData] = useState<RevenueData | null>(null);
    const [loadingDaily, setLoadingDaily] = useState(false);

    // Receipt Viewer State
    const [selectedReceipt, setSelectedReceipt] = useState<Transaction | null>(null);

    // --- FETCH MAIN DATA ---
    const fetchData = async (targetFilter: string, targetDate?: string) => {
        try {
            const now = new Date();
            let startDate = new Date();
            let endDate = new Date();

            if (targetDate) {
                // Drill Down Mode
                const s = new Date(targetDate); s.setHours(0, 0, 0, 0);
                const e = new Date(targetDate); e.setHours(23, 59, 59, 999);
                startDate = s;
                endDate = e;
            } else {
                // Overview Mode
                if (filter === 'TODAY') {
                    // Default start is today 00:00
                    startDate.setHours(0, 0, 0, 0);
                } else if (targetFilter === '7DAYS') {
                    startDate.setDate(now.getDate() - 7);
                } else if (targetFilter === '30DAYS') {
                    startDate.setDate(now.getDate() - 30);
                }
            }

            const query = new URLSearchParams({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString()
            });

            const res = await fetch(`/api/admin/revenue?${query}`);
            if (res.ok) return await res.json();
            return null;
        } catch (err) {
            console.error(err);
            return null;
        }
    };

    useEffect(() => {
        setLoading(true);
        fetchData(filter).then(d => {
            setData(d);
            setLoading(false);
        });
    }, [filter]);

    useEffect(() => {
        if (!selectedDate) {
            setDailyData(null);
            return;
        }
        setLoadingDaily(true);
        fetchData('', selectedDate).then(d => {
            setDailyData(d);
            setLoadingDaily(false);
        });
    }, [selectedDate]);

    // --- HELPERS ---
    const formatMoney = (n: number) => "IDR " + (n / 1000).toLocaleString('id-ID') + "K";
    const formatFullMoney = (n: number) => "Rp " + n.toLocaleString('id-ID');
    const formatDate = (d: string) => new Date(d).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
    const formatTime = (d: string) => new Date(d).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    // Peak Info Main
    const peakInfo = useMemo(() => {
        if (!data?.chartData || data.chartData.length === 0) return null;
        const maxEntry = data.chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        return { label: filter === 'TODAY' ? 'Peak Hour' : 'Peak Day', name: maxEntry.name, value: maxEntry.value };
    }, [data, filter]);

    // Peak Info Daily
    const dailyPeakInfo = useMemo(() => {
        if (!dailyData?.chartData || dailyData.chartData.length === 0) return null;
        const maxEntry = dailyData.chartData.reduce((prev, current) => (prev.value > current.value) ? prev : current);
        return { name: maxEntry.name, value: maxEntry.value };
    }, [dailyData]);

    // SWISS/GOLD THEME PALETTE
    const COLORS = ['#FFBF00', '#111111', '#555555', '#E5E5E5'];

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10 transition-colors">

            {/* --- HEADER --- */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Revenue Analytics</h1>
                    <p className="text-gray-500 dark:text-gray-400">Financial performance overview</p>
                </div>

                <div className="flex bg-gray-100 dark:bg-[#1A1A1A] p-1 rounded-lg">
                    {['TODAY', '7DAYS', '30DAYS'].map((f) => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setSelectedDate(null); }}
                            className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${filter === f
                                ? 'bg-white dark:bg-[#333] text-black dark:text-white shadow-sm'
                                : 'text-gray-500 hover:text-black dark:hover:text-white'
                                }`}
                        >
                            {f === 'TODAY' ? 'Today' : f === '7DAYS' ? '7 Days' : '30 Days'}
                        </button>
                    ))}
                </div>
            </header>

            {/* ... */}

            {loading || !data ? (
                <DashboardSkeleton />
            ) : (
                <div className="space-y-8 animate-in fade-in duration-500">

                    {/* 1. KEY METRICS */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                        {/* Revenue */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm hover:border-[#FFBF00]/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="p-2 rounded-lg bg-[#FFBF00]/10 text-[#FFBF00]">
                                    <DollarSign size={20} />
                                </span>
                                <span className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[10px] font-bold px-2 py-1 rounded-full">+12.5%</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Total Revenue</p>
                                <h3 className="text-3xl font-black tracking-tight">{formatMoney(data.summary.totalRevenue)}</h3>
                            </div>
                        </div>

                        {/* Orders */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm hover:border-[#FFBF00]/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="p-2 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-500">
                                    <ShoppingBag size={20} />
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Transactions</p>
                                <h3 className="text-3xl font-black tracking-tight">{data.summary.totalOrders}</h3>
                            </div>
                        </div>

                        {/* Avg Order */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm hover:border-[#FFBF00]/30 transition-all group">
                            <div className="flex justify-between items-start mb-4">
                                <span className="p-2 rounded-lg bg-gray-100 dark:bg-[#222] text-gray-500">
                                    <CreditCard size={20} />
                                </span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Avg. Order Value</p>
                                <h3 className="text-3xl font-black tracking-tight">{formatMoney(data.summary.avgOrderValue)}</h3>
                            </div>
                        </div>

                        {/* Peak Time */}
                        <div className="bg-[#111] dark:bg-[#000] p-6 rounded-2xl border border-[#222] shadow-sm hover:border-[#FFBF00]/50 transition-all relative overflow-hidden">
                            <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#FFBF00]/20 rounded-full blur-2xl"></div>
                            <div className="flex justify-between items-start mb-4 relative z-10">
                                <span className="p-2 rounded-lg bg-[#FFBF00]/20 text-[#FFBF00]">
                                    <TrendingUp size={20} />
                                </span>
                            </div>
                            <div className="relative z-10">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{peakInfo?.label || "Peak Time"}</p>
                                <h3 className="text-3xl font-black tracking-tight text-white">{peakInfo?.name || "-"}</h3>
                                <p className="text-[#FFBF00] font-mono text-xs font-bold mt-1">{peakInfo ? formatFullMoney(peakInfo.value) : ""}</p>
                            </div>
                        </div>
                    </div>

                    {/* 2. MAIN CHARTS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                        {/* Traffic Chart */}
                        <div className="lg:col-span-2 bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg dark:text-white">Sales Trend</h3>
                                <button className="text-xs font-bold text-gray-400 hover:text-black dark:hover:text-white flex items-center gap-1">
                                    <Download size={12} /> Export CSV
                                </button>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={data.chartData} className="cursor-pointer">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: '600', fill: '#888' }} dy={10} />
                                        <Tooltip
                                            cursor={{ fill: '#FFBF00', opacity: 0.1 }}
                                            contentStyle={{ backgroundColor: '#111', border: 'none', color: '#fff', borderRadius: '8px', fontSize: '12px' }}
                                            itemStyle={{ color: '#FFBF00', fontWeight: 'bold' }}
                                        />
                                        <Bar
                                            dataKey="value"
                                            fill="#FFBF00"
                                            radius={[4, 4, 0, 0]}
                                            onClick={(d: any) => {
                                                const dt = d?.date || d?.payload?.date;
                                                if (dt) setSelectedDate(dt);
                                            }}
                                        />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Payment Mix */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm flex flex-col justify-between">
                            <h3 className="font-bold text-lg dark:text-white mb-4">Payment Methods</h3>
                            <div className="h-48 w-full relative">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={data.paymentMethods}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%" cy="50%"
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            stroke="none"
                                        >
                                            {data.paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} cornerRadius={4} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ backgroundColor: '#111', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Center Text */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="text-center">
                                        <p className="text-xs text-gray-400 font-bold uppercase">Total</p>
                                        <p className="text-xl font-black">{data.summary.totalOrders}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-4">
                                {data.paymentMethods.map((e, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-xs font-bold text-gray-500">{e.name}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                    {/* 3. DETAILS GRID */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                        {/* Top Products */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm">
                            <h3 className="font-bold text-lg dark:text-white mb-6">Top Selling Items</h3>
                            <div className="space-y-4">
                                {data.topProducts.map((p, i) => (
                                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-bold text-gray-300 font-mono w-4">0{i + 1}</span>
                                            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-[#222] flex items-center justify-center text-xs font-black text-gray-400">
                                                IMG
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold dark:text-white">{p.name}</h4>
                                                <p className="text-[10px] text-gray-500 uppercase font-bold">{p.qty} Sold</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold dark:text-white text-sm">{formatMoney(p.revenue)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recent Transactions */}
                        <div className="bg-white dark:bg-[#111] p-6 rounded-2xl border border-gray-100 dark:border-[#222] shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-bold text-lg dark:text-white">Recent Sales</h3>
                                <Link href="#" className="text-xs font-bold text-[#FFBF00] hover:underline">VIEW ALL</Link>
                            </div>
                            <div className="space-y-2">
                                {data.recentTransactions.slice(0, 5).map(tx => (
                                    <div
                                        key={tx.id}
                                        onClick={() => setSelectedReceipt(tx)}
                                        className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-gray-100 dark:hover:border-[#222] hover:bg-gray-50 dark:hover:bg-[#1A1A1A] cursor-pointer transition-all group"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-green-50 dark:bg-green-900/20 text-green-600 flex items-center justify-center">
                                                <Receipt size={16} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold dark:text-white group-hover:text-[#FFBF00] transition-colors">#{tx.id.slice(0, 6)}</p>
                                                <p className="text-[10px] text-gray-400 font-mono">{formatTime(tx.createdAt)}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold dark:text-white">{formatFullMoney(tx.totalAmount)}</p>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase">{tx.paymentType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>

                </div>
            )}

            {/* --- DAILY DETAIL MODAL --- */}
            {selectedDate && dailyData && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 lg:p-8" onClick={() => setSelectedDate(null)}>
                    <div className="bg-white dark:bg-[#111] w-full max-w-5xl max-h-[90vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-6 border-b border-gray-100 dark:border-[#222] flex justify-between items-center bg-white dark:bg-[#111]">
                            <div>
                                <h2 className="text-2xl font-black dark:text-white">Daily Recap</h2>
                                <p className="text-sm text-gray-500 font-medium">{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#222] transition-colors">
                                <X size={24} className="text-gray-500" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar bg-[#FAFAFA] dark:bg-[#0A0A0A]">

                            {/* Summary Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-[#333]">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Revenue</p>
                                    <h3 className="text-2xl font-black dark:text-white">{formatFullMoney(dailyData.summary.totalRevenue)}</h3>
                                </div>
                                <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-xl border border-gray-100 dark:border-[#333]">
                                    <p className="text-xs font-bold text-gray-400 uppercase">Transactions</p>
                                    <h3 className="text-2xl font-black dark:text-white">{dailyData.summary.totalOrders}</h3>
                                </div>
                                <div className="bg-[#FFBF00] text-black p-4 rounded-xl">
                                    <p className="text-xs font-bold uppercase opacity-80">Peak Hour</p>
                                    <div className="flex justify-between items-end">
                                        <h3 className="text-2xl font-black">{dailyPeakInfo?.name}</h3>
                                        <p className="font-mono font-bold text-sm">{dailyPeakInfo ? formatMoney(dailyPeakInfo.value) : '-'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Chart */}
                            <div className="bg-white dark:bg-[#1A1A1A] p-6 rounded-2xl border border-gray-100 dark:border-[#333] mb-8">
                                <h3 className="font-bold mb-4 dark:text-white">Hourly Traffic</h3>
                                <div className="h-48 w-full">
                                    <ResponsiveContainer>
                                        <BarChart data={dailyData.chartData}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" strokeOpacity={0.1} />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} dy={10} />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                contentStyle={{ backgroundColor: '#000', borderRadius: '8px', border: 'none', color: 'white' }}
                                            />
                                            <Bar dataKey="value" fill="#E5E7EB" radius={[4, 4, 0, 0]}>
                                                {dailyData.chartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.value === dailyPeakInfo?.value ? '#FFBF00' : '#E5E7EB'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            {/* Transaction Table */}
                            <div className="bg-white dark:bg-[#1A1A1A] rounded-2xl border border-gray-100 dark:border-[#333] overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-gray-50 dark:bg-[#222] text-xs uppercase font-bold text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">Time</th>
                                            <th className="px-6 py-4">Order ID</th>
                                            <th className="px-6 py-4">Items</th>
                                            <th className="px-6 py-4 text-right">Total</th>
                                            <th className="px-6 py-4 text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-[#333]">
                                        {dailyData.recentTransactions.map(tx => (
                                            <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-[#222] transition-colors">
                                                <td className="px-6 py-4 font-mono text-gray-500">{formatTime(tx.createdAt)}</td>
                                                <td className="px-6 py-4 font-bold dark:text-white">#{tx.id.slice(0, 6)}</td>
                                                <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{tx.items.length} items</td>
                                                <td className="px-6 py-4 text-right font-bold dark:text-white">{formatFullMoney(tx.totalAmount)}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <button
                                                        onClick={() => setSelectedReceipt(tx)}
                                                        className="text-xs font-bold text-[#FFBF00] hover:underline"
                                                    >
                                                        VIEW RECEIPT
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                        </div>
                    </div>
                </div>
            )}

            {/* --- RECEIPT MODAL --- */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedReceipt(null)}>
                    <div
                        className="bg-white w-full max-w-[360px] shadow-2xl relative animate-in zoom-in-95 duration-200"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Zigzag Top */}
                        <div className="absolute -top-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 100%, 5% 0%, 10% 100%, 15% 0%, 20% 100%, 25% 0%, 30% 100%, 35% 0%, 40% 100%, 45% 0%, 50% 100%, 55% 0%, 60% 100%, 65% 0%, 70% 100%, 75% 0%, 80% 100%, 85% 0%, 90% 100%, 95% 0%, 100% 100%)' }}></div>

                        <div className="p-8 pt-10 text-center">
                            <h2 className="font-black text-2xl tracking-tight mb-2">TIKNOL RESERVE</h2>
                            <p className="text-xs text-gray-400 uppercase tracking-widest mb-6">Receipt #{selectedReceipt.id.slice(0, 8)}</p>

                            <div className="border-y-2 border-dashed border-gray-200 py-6 space-y-4 mb-6">
                                {selectedReceipt.items.map((item, i) => (
                                    <div key={i} className="flex justify-between items-start text-sm text-left">
                                        <div>
                                            <p className="font-bold text-gray-900">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.qty} x {item.price.toLocaleString()}</p>
                                        </div>
                                        <p className="font-mono font-bold">{(item.qty * item.price).toLocaleString()}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-between items-center text-lg font-black mb-2">
                                <span>TOTAL</span>
                                <span>{formatFullMoney(selectedReceipt.totalAmount)}</span>
                            </div>
                            <p className="text-xs text-gray-400 uppercase font-bold mb-8">Paid via {selectedReceipt.paymentType}</p>

                            <button onClick={() => setSelectedReceipt(null)} className="w-full py-3 bg-black text-white font-bold text-sm hover:bg-gray-800 transition-colors uppercase tracking-widest">
                                Close Receipt
                            </button>
                        </div>

                        {/* Zigzag Bottom */}
                        <div className="absolute -bottom-2 left-0 right-0 h-4 bg-white" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                    </div>
                </div>
            )}

        </div>
    );
}
