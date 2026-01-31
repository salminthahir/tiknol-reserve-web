'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, DollarSign, Tag, Users, Award } from 'lucide-react';

interface AnalyticsData {
    summary: {
        totalDiscountAmount: number;
        totalVoucherRevenue: number;
        totalVoucherOrders: number;
        conversionRate: number;
    };
    popularVouchers: Array<{
        voucherId: string;
        code: string;
        name: string;
        _count: { id: number };
        _sum: { discountAmount: number };
    }>;
}

export default function VoucherAnalytics() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await fetch('/api/admin/vouchers/analytics');
                if (res.ok) {
                    const json = await res.ok ? await res.json() : null;
                    if (json) setData(json);
                }
            } catch (error) {
                console.error("Error fetching analytics:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-white rounded-2xl border-2 border-gray-100 animate-pulse" />
            ))}
        </div>
    );

    if (!data) return null;

    const stats = [
        {
            label: 'Total Diskon',
            value: `Rp ${data.summary.totalDiscountAmount.toLocaleString()}`,
            icon: <Tag className="text-purple-600" />,
            color: 'bg-purple-50 border-purple-200'
        },
        {
            label: 'Revenue Terkait',
            value: `Rp ${data.summary.totalVoucherRevenue.toLocaleString()}`,
            icon: <DollarSign className="text-green-600" />,
            color: 'bg-green-50 border-green-200'
        },
        {
            label: 'Total Penggunaan',
            value: `${data.summary.totalVoucherOrders.toLocaleString()} Pesanan`,
            icon: <Users className="text-blue-600" />,
            color: 'bg-blue-50 border-blue-200'
        },
        {
            label: 'Conversion Rate',
            value: `${data.summary.conversionRate.toFixed(1)}%`,
            icon: <TrendingUp className="text-orange-600" />,
            color: 'bg-orange-50 border-orange-200'
        }
    ];

    return (
        <div className="space-y-6 mb-8">
            {/* Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={`p-4 rounded-2xl border-2 ${stat.color} shadow-sm transition-all hover:scale-[1.02]`}>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white rounded-lg border border-black/5 shadow-sm">
                                {stat.icon}
                            </div>
                            <span className="text-xs font-black text-black/40 uppercase tracking-tighter">{stat.label}</span>
                        </div>
                        <div className="text-xl font-black text-black tracking-tight">{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Popular Vouchers Sidebar/Bottom section could be added later */}
            {data.popularVouchers.length > 0 && (
                <div className="bg-white rounded-2xl border-2 border-gray-200 p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <Award size={18} className="text-[#552CB7]" />
                        <h3 className="font-black text-sm uppercase tracking-wider">Top Performing Vouchers</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.popularVouchers.map((v) => (
                            <div key={v.voucherId} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50/50">
                                <div>
                                    <div className="font-black text-xs font-mono">{v.code}</div>
                                    <div className="text-[10px] text-gray-400 font-bold uppercase">{v.name}</div>
                                </div>
                                <div className="text-right">
                                    <div className="font-black text-xs">{v._count.id} use</div>
                                    <div className="text-[10px] text-green-600 font-bold">Rp {v._sum.discountAmount.toLocaleString()}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
