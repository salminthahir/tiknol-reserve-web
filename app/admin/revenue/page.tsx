'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
    BarChart, Bar, XAxis, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, CartesianGrid
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
    Activity
} from 'lucide-react';

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
                if (targetFilter === 'TODAY') {
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
    const formatMoney = (n: number) => "Rp " + n.toLocaleString('id-ID');
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

    // ORANGE THEME PALETTE
    const COLORS = ['#F97316', '#000000', '#EA580C', '#FED7AA'];

    return (
        // CLEAN VIBRANT SWISS
        <div className="min-h-screen bg-[#FFDE59] text-black font-sans p-4 lg:p-8 selection:bg-orange-300">

            {/* --- HEADER --- */}
            <header className="flex flex-col xl:flex-row justify-between items-center mb-6 border-b-4 border-black pb-6 gap-6">

                {/* Title Section - Mobile: Center, Desktop: Left */}
                <div className="flex flex-col items-center xl:items-start text-center xl:text-left">
                    <div className="bg-white border-4 border-black p-3 shadow-[4px_4px_0px_0px_#000]">
                        <h1 className="text-3xl md:text-5xl font-black uppercase leading-none flex items-center gap-3">
                            REVENUE
                        </h1>
                    </div>
                    <div className="font-mono text-xs font-bold text-black mt-2 flex items-center gap-1.5 bg-white px-2 py-1 border-2 border-black">
                        <Activity size={14} /> FINANCIAL DASHBOARD
                    </div>
                </div>

                {/* Controls Section - Compacting for Mobile */}
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">

                    {/* Filter Group - Segmented Control Style */}
                    <div className="flex bg-white border-4 border-black shadow-[4px_4px_0px_0px_#000] w-full md:w-auto overflow-hidden">
                        {['TODAY', '7DAYS', '30DAYS'].map((f, idx) => (
                            <button
                                key={f}
                                onClick={() => { setFilter(f); setSelectedDate(null); }}
                                className={`flex-1 md:flex-none px-4 py-3 font-black text-xs uppercase transition-colors border-r-2 border-black last:border-r-0 ${filter === f
                                        ? 'bg-black text-[#FFDE59]'
                                        : 'bg-white hover:bg-orange-200 text-black'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>

                    {/* Back Button */}
                    <Link href="/admin/dashboard" className="w-full md:w-auto text-center bg-black text-white px-6 py-3 font-bold text-xs uppercase border-4 border-transparent hover:border-black hover:bg-white hover:text-black transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,0.2)]">
                        &larr; Back to POS
                    </Link>
                </div>
            </header>

            {loading || !data ? (
                <div className="h-96 flex flex-col items-center justify-center gap-4">
                    <Activity size={64} />
                    <p className="font-black text-xl bg-white px-4 py-2 border-4 border-black shadow-[4px_4px_0px_0px_#000]">LOADING DATA...</p>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">

                    {/* 1. KEY METRICS (Cleaner Cards) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Revenue */}
                        <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all group">
                            <h3 className="text-sm font-black uppercase text-black mb-2 relative z-10 flex items-center gap-2">
                                <DollarSign size={16} /> Total Revenue
                            </h3>
                            <p className="text-3xl lg:text-4xl font-black relative z-10">{formatMoney(data.summary.totalRevenue)}</p>
                        </div>

                        {/* Orders */}
                        <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all group">
                            <h3 className="text-sm font-black uppercase text-black mb-2 relative z-10 flex items-center gap-2">
                                <ShoppingBag size={16} /> Transactions
                            </h3>
                            <p className="text-3xl lg:text-4xl font-black relative z-10">{data.summary.totalOrders}</p>
                        </div>

                        {/* Avg Basket */}
                        <div className="bg-white border-4 border-black p-5 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all group">
                            <h3 className="text-sm font-black uppercase text-black mb-2 relative z-10 flex items-center gap-2">
                                <CreditCard size={16} /> Avg Order
                            </h3>
                            <p className="text-3xl lg:text-4xl font-black relative z-10">{formatMoney(data.summary.avgOrderValue)}</p>
                        </div>

                        {/* Peak Insight (Orange Highlight) */}
                        <div className="bg-black text-[#FFDE59] border-4 border-black p-5 shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all relative">
                            <TrendingUp className="absolute right-4 top-4 text-white opacity-20" size={60} />
                            <h3 className="text-sm font-black uppercase mb-2 relative z-10 text-[#FFDE59] flex items-center gap-2">
                                <Clock size={16} /> {peakInfo?.label || "Peak Time"}
                            </h3>
                            <p className="text-3xl lg:text-4xl font-black relative z-10 text-[#FFDE59]">{peakInfo?.name || "-"}</p>
                            <p className="font-mono text-xs mt-2 relative z-10 bg-[#FFDE59] text-black px-2 py-1 w-fit font-bold">{peakInfo ? formatMoney(peakInfo.value) : ""}</p>
                        </div>
                    </div>

                    {/* 2. CHART SECTION */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Bar Chart */}
                        <div className="lg:col-span-2 bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000]">
                            <div className="flex justify-between items-center mb-6 border-b-4 border-black pb-4">
                                <h3 className="font-black text-2xl uppercase">
                                    Sales Trend
                                </h3>
                                <div className="text-xs font-black bg-orange-500 text-white px-3 py-1 border-2 border-black shadow-[2px_2px_0px_0px_#000] cursor-default flex items-center gap-2">
                                    <Search size={12} /> CLICK BAR TO SEE DETAILS
                                </div>
                            </div>
                            <div className="h-80 w-full">
                                <ResponsiveContainer>
                                    <BarChart data={data.chartData} className="cursor-pointer">
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#000" strokeOpacity={0.1} />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: '900', fill: 'black' }} dy={10} />
                                        <Tooltip
                                            cursor={{ fill: '#FED7AA', opacity: 0.4 }}
                                            contentStyle={{ backgroundColor: 'black', border: 'none', color: '#FFDE59', borderRadius: '0', boxShadow: '4px 4px 0px 0px #F97316' }}
                                            itemStyle={{ color: '#fff', fontWeight: 'bold', fontFamily: 'monospace' }}
                                        />
                                        {/* ORANGE BAR */}
                                        <Bar
                                            dataKey="value"
                                            fill="#F97316"
                                            stroke="#000"
                                            strokeWidth={2}
                                            activeBar={{ fill: '#000', stroke: 'black', strokeWidth: 0 }}
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
                        <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000] flex flex-col items-center">
                            <h3 className="font-black text-xl uppercase mb-6 underline decoration-4 decoration-orange-500">Payment Mix</h3>
                            <div className="h-64 w-full relative">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={data.paymentMethods}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%" cy="50%"
                                            innerRadius={50}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            stroke="black"
                                            strokeWidth={3}
                                        >
                                            {data.paymentMethods.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ border: '3px solid black', boxShadow: '4px 4px 0 0 black', fontWeight: 'bold' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {data.paymentMethods.map((e, i) => (
                                    <div key={i} className="flex items-center gap-1 text-[10px] font-black uppercase bg-gray-100 px-2 py-1 border-2 border-black">
                                        <span className="w-3 h-3 border-2 border-black" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                                        {e.name}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. LISTS SECTION */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Top Products */}
                        <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000]">
                            <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                                <span className="bg-orange-300 border-2 border-black px-1">Top</span> Items
                            </h3>
                            <ul className="space-y-3">
                                {data.topProducts.map((p, i) => (
                                    <li key={i} className="flex justify-between items-center bg-white border-b-4 border-black p-3 hover:bg-black hover:text-[#FFDE59] transition-colors group">
                                        <span className="font-bold flex gap-3 items-center">
                                            <span className="font-black text-xl italic text-gray-300 group-hover:text-white">#{i + 1}</span>
                                            {p.name}
                                        </span>
                                        <span className="font-mono font-bold bg-[#FFDE59] text-black px-2 border-2 border-black group-hover:bg-white">{p.qty}x</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Recent Tx Overview */}
                        <div className="bg-white border-4 border-black p-6 shadow-[10px_10px_0px_0px_#000]">
                            <h3 className="font-black text-xl uppercase mb-4 flex items-center gap-2">
                                <Receipt /> Recent Sales
                            </h3>
                            <div className="divide-y-2 divide-black">
                                {data.recentTransactions.slice(0, 5).map(tx => (
                                    <div
                                        key={tx.id}
                                        className="py-3 flex justify-between items-center cursor-pointer hover:bg-orange-100 px-2 group transition-colors"
                                        onClick={() => setSelectedReceipt(tx)}
                                    >
                                        <div>
                                            <p className="font-bold text-sm group-hover:underline">#{tx.id.slice(0, 6)}</p>
                                            <p className="text-[10px] uppercase font-mono text-gray-500 bg-white border border-black px-1 mt-1 inline-block">{formatTime(tx.createdAt)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-lg">{formatMoney(tx.totalAmount)}</p>
                                            <p className="text-[10px] font-bold uppercase text-gray-500">{tx.paymentType}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* --- DAILY DETAIL MODAL (FULL SCREEN OVERLAY) --- */}
            {selectedDate && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-10" onClick={() => setSelectedDate(null)}>
                    <div className="bg-[#FFDE59] w-full max-w-6xl h-full max-h-[90vh] border-4 border-black shadow-[15px_15px_0px_0px_#fff] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div className="bg-black text-white p-6 flex justify-between items-center shrink-0 border-b-4 border-white">
                            <div>
                                <h2 className="text-4xl font-black uppercase italic tracking-tighter">Daily Recap</h2>
                                <p className="font-mono text-[#FFDE59] text-xl">{new Date(selectedDate).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                            <button onClick={() => setSelectedDate(null)} className="h-12 w-12 bg-[#FFDE59] text-black border-4 border-white font-black text-xl hover:bg-red-500 hover:text-white hover:border-black transition-all">
                                <X size={24} className="mx-auto" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar">
                            {loadingDaily ? (
                                <div className="h-full flex items-center justify-center font-black animate-pulse text-2xl">OPENING FILES...</div>
                            ) : dailyData ? (
                                <>
                                    {/* Mini Stats + Peak Hour */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 border-b-4 border-black pb-8">
                                        <div className="bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000]">
                                            <span className="block font-black text-xs text-gray-500 uppercase">Omzet</span>
                                            <span className="text-xl md:text-2xl font-black">{formatMoney(dailyData.summary.totalRevenue)}</span>
                                        </div>
                                        <div className="bg-white border-4 border-black p-4 text-center shadow-[4px_4px_0px_0px_#000]">
                                            <span className="block font-black text-xs text-gray-500 uppercase">Trx</span>
                                            <span className="text-xl md:text-2xl font-black">{dailyData.summary.totalOrders}</span>
                                        </div>

                                        {/* NEW: PEAK HOUR CARD */}
                                        <div className="col-span-2 bg-black text-[#FFDE59] border-4 border-white p-4 flex items-center justify-between shadow-[4px_4px_0px_0px_#000]">
                                            <div className="text-left">
                                                <span className="block font-black text-xs text-white uppercase flex items-center gap-2"><Clock size={12} /> BUSIEST HOUR</span>
                                                <span className="text-3xl font-black italic">{dailyPeakInfo?.name || "-"}</span>
                                            </div>
                                            <div className="text-right">
                                                <span className="block font-mono text-xs text-gray-400">REVENUE</span>
                                                <span className="text-xl font-bold">{dailyPeakInfo ? formatMoney(dailyPeakInfo.value) : "-"}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Hourly Chart */}
                                    <div className="bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
                                        <h3 className="font-black text-2xl uppercase mb-4">Hourly Flow</h3>
                                        <div className="h-48 w-full">
                                            <ResponsiveContainer>
                                                <BarChart data={dailyData.chartData}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ccc" />
                                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} dy={10} />
                                                    <Tooltip
                                                        cursor={{ fill: '#f0f0f0' }}
                                                        contentStyle={{ backgroundColor: 'black', border: 'none', color: 'white' }}
                                                    />
                                                    {/* Highlight Peak Hour */}
                                                    <Bar dataKey="value" fill="black" stroke="#000" strokeWidth={2}>
                                                        {dailyData.chartData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.value === dailyPeakInfo?.value ? '#F472B6' : 'black'} stroke="black" />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* Full Table */}
                                    <div>
                                        <h3 className="font-black text-2xl uppercase mb-4 flex items-center gap-3">
                                            <Receipt size={28} /> Transaction Log
                                        </h3>
                                        <div className="bg-white border-4 border-black overflow-hidden shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm text-left">
                                                    <thead className="text-xs uppercase bg-black text-white font-mono">
                                                        <tr>
                                                            <th className="px-4 py-3">Time</th>
                                                            <th className="px-4 py-3">ID</th>
                                                            <th className="px-4 py-3">Items</th>
                                                            <th className="px-4 py-3 text-right">Total</th>
                                                            <th className="px-4 py-3 text-center">Action</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y-2 divide-black font-mono bg-white">
                                                        {dailyData.recentTransactions.map((tx) => (
                                                            <tr key={tx.id} className="hover:bg-pink-50 transition-colors">
                                                                <td className="px-4 py-3 font-bold">{formatTime(tx.createdAt)}</td>
                                                                <td className="px-4 py-3 text-gray-500">#{tx.id.slice(0, 4)}</td>
                                                                <td className="px-4 py-3 max-w-xs truncate">
                                                                    {tx.items?.length || 0} items
                                                                </td>
                                                                <td className="px-4 py-3 text-right font-black">{formatMoney(tx.totalAmount)}</td>
                                                                <td className="px-4 py-3 text-center">
                                                                    <button
                                                                        onClick={() => setSelectedReceipt(tx)}
                                                                        className="bg-cyan-300 text-black px-3 py-1 text-xs font-bold border-2 border-black hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000]"
                                                                    >
                                                                        STRUK
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <div className="text-center font-black text-red-500">FAILED TO LOAD DATA</div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* --- RECEIPT MODAL (POS STYLE) --- */}
            {selectedReceipt && (
                <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-4" onClick={() => setSelectedReceipt(null)}>
                    <div
                        className="bg-white w-full max-w-sm shadow-2xl overflow-hidden relative"
                        style={{ filter: 'drop-shadow(0 20px 13px rgb(0 0 0 / 0.03))' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Receipt zigzag top */}
                        <div className="w-full h-4 bg-gray-900" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>

                        <div className="p-8 font-mono text-sm leading-relaxed">
                            <div className="text-center mb-6">
                                <h2 className="text-2xl font-black uppercase tracking-widest mb-1">TIKNOL</h2>
                                <p className="text-gray-500 text-xs">Jl. Contoh No. 123, Jakarta</p>
                                <p className="text-gray-500 text-xs mt-1">{new Date(selectedReceipt.createdAt).toLocaleString()}</p>
                                <p className="text-xs mt-2 border-y border-dashed border-gray-300 py-1">#{selectedReceipt.id}</p>
                            </div>

                            <div className="space-y-4 mb-6">
                                {selectedReceipt.items && selectedReceipt.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-start">
                                        <div>
                                            <p className="font-bold uppercase">{item.name}</p>
                                            <p className="text-xs text-gray-500">{item.qty} x {formatMoney(item.price)}</p>
                                        </div>
                                        <p className="font-bold">{formatMoney(item.qty * item.price)}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t-2 border-dashed border-black pt-4 space-y-1">
                                <div className="flex justify-between font-bold text-lg">
                                    <span>TOTAL</span>
                                    <span>{formatMoney(selectedReceipt.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500 uppercase mt-2">
                                    <span>Payment</span>
                                    <span>{selectedReceipt.paymentType}</span>
                                </div>
                            </div>

                            <div className="mt-8 text-center text-xs font-bold uppercase text-gray-400">
                                *** Thank You ***
                            </div>
                        </div>

                        <div className="bg-gray-100 p-4 flex gap-2">
                            <button
                                onClick={() => setSelectedReceipt(null)}
                                className="flex-1 bg-white border border-black py-3 font-bold hover:bg-gray-200"
                            >
                                CLOSE
                            </button>
                            <button
                                className="flex-1 bg-black text-white py-3 font-bold hover:bg-cyan-400 hover:text-black hover:border-black border border-transparent"
                            >
                                PRINT
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
