'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Filter, Search, Edit, Trash2, Copy, X, Scissors, Ticket, MoreHorizontal } from 'lucide-react';
import { Voucher } from '@/types/voucher';
import VoucherFormModal from '@/app/components/VoucherFormModal';
import VoucherAnalytics from '@/app/components/VoucherAnalytics';
import VoucherSkeleton from '@/app/components/skeletons/VoucherSkeleton';

export default function VouchersPage() {
    const [vouchers, setVouchers] = useState<Voucher[]>([]);
    const [loading, setLoading] = useState(true);
    const [showFilters, setShowFilters] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
    const [typeFilter, setTypeFilter] = useState<string>('ALL');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);

    useEffect(() => {
        fetchVouchers();
    }, [activeFilter, typeFilter]);

    const fetchVouchers = async () => {
        try {
            const params = new URLSearchParams();
            if (activeFilter !== 'ALL') {
                params.append('active', activeFilter === 'ACTIVE' ? 'true' : 'false');
            }
            if (typeFilter !== 'ALL') {
                params.append('type', typeFilter);
            }

            const res = await fetch(`/api/admin/vouchers?${params}`);

            if (!res.ok) {
                throw new Error(`Failed to fetch vouchers: ${res.status}`);
            }

            const data = await res.json();

            if (Array.isArray(data)) {
                setVouchers(data);
            } else {
                console.error('API returned non-array data:', data);
                setVouchers([]);
            }
        } catch (error) {
            console.error('Error fetching vouchers:', error);
            setVouchers([]);
        } finally {
            setLoading(false);
        }
    };

    const filteredVouchers = Array.isArray(vouchers)
        ? vouchers.filter(voucher =>
            voucher.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
            voucher.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];

    const getStatusColor = (voucher: Voucher) => {
        const now = new Date();
        const validUntil = new Date(voucher.validUntil);
        const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (!voucher.active) return 'bg-[#111] border-[#333] text-gray-500';
        if (now > validUntil) return 'bg-red-900/10 border-red-900/30 text-red-500';
        if (daysUntilExpiry <= 7) return 'bg-[#FFBF00]/10 border-[#FFBF00]/30 text-[#FFBF00]';
        return 'bg-white dark:bg-[#111] border-gray-200 dark:border-[#333]';
    };

    const getStatusBadge = (voucher: Voucher) => {
        const now = new Date();
        const validUntil = new Date(voucher.validUntil);

        if (!voucher.active) return <span className="bg-gray-200 dark:bg-[#333] text-gray-500 px-2 py-0.5 rounded text-[10px] font-black uppercase">Inactive</span>;
        if (now > validUntil) return <span className="bg-red-100 dark:bg-red-900/20 text-red-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Expired</span>;
        return <span className="bg-green-100 dark:bg-green-900/20 text-green-600 px-2 py-0.5 rounded text-[10px] font-black uppercase">Active</span>;
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PERCENTAGE': return 'PERCENTAGE';
            case 'FIXED_AMOUNT': return 'FIXED AMOUNT';
            case 'FREE_ITEM': return 'FREE ITEM';
            case 'BUY_X_GET_Y': return 'BUY X GET Y';
            default: return type;
        }
    };

    const getValueDisplay = (voucher: Voucher) => {
        switch (voucher.type) {
            case 'PERCENTAGE':
                return `${voucher.value}%`;
            case 'FIXED_AMOUNT':
                return `Rp ${voucher.value.toLocaleString()}`;
            default:
                return voucher.value;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus voucher ini?')) return;
        try {
            const res = await fetch(`/api/admin/vouchers/${id}`, { method: 'DELETE' });
            if (res.ok) fetchVouchers();
        } catch (error) {
            console.error('Error deleting voucher:', error);
        }
    };

    const handleEdit = (voucher: Voucher) => {
        setEditVoucher(voucher);
        setShowCreateModal(true);
    };

    const handleDuplicate = (voucher: Voucher) => {
        const duplicate = {
            ...voucher,
            code: `${voucher.code}_COPY`,
            usageCount: 0
        };
        setEditVoucher(duplicate as any);
        setShowCreateModal(true);
    };

    const handleModalClose = () => {
        setShowCreateModal(false);
        setEditVoucher(null);
    };

    const handleModalSuccess = () => {
        fetchVouchers();
        handleModalClose();
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10 transition-colors">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Voucher Management</h1>
                    <p className="text-gray-500 dark:text-gray-400">Create & manage promotional campaigns</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="bg-[#FFBF00] hover:bg-yellow-400 text-black px-6 py-3 text-sm font-black rounded-xl shadow-[0_0_20px_rgba(255,191,0,0.3)] hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    NEW VOUCHER
                </button>
            </header>

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-48 bg-gray-100 dark:bg-[#111] animate-pulse rounded-2xl"></div>)}
                </div>
            ) : (
                <>
                    {/* Search & Filter */}
                    <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] shadow-sm mb-8 flex flex-col md:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by code or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-lg font-medium focus:ring-2 focus:ring-[#FFBF00] transition-all text-sm"
                            />
                        </div>
                        <div className="flex bg-gray-50 dark:bg-[#1A1A1A] p-1 rounded-lg">
                            {['ALL', 'ACTIVE', 'INACTIVE'].map((f: any) => (
                                <button
                                    key={f}
                                    onClick={() => setActiveFilter(f)}
                                    className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${activeFilter === f
                                        ? 'bg-white dark:bg-[#333] text-black dark:text-white shadow-sm'
                                        : 'text-gray-500 hover:text-black dark:hover:text-white'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Vouchers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredVouchers.map((voucher) => (
                            <div
                                key={voucher.id}
                                className={`group relative bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] overflow-hidden transition-all hover:border-[#FFBF00]/50 hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)]`}
                            >
                                {/* Ticket "Hole" Decorations */}
                                <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-full"></div>
                                <div className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-[#FAFAFA] dark:bg-[#0A0A0A] rounded-full"></div>

                                <div className="p-6 pb-4 border-b border-dashed border-gray-200 dark:border-[#333] relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">{getTypeLabel(voucher.type)}</span>
                                            <h3 className="font-black text-2xl tracking-tight dark:text-white mt-1">{getValueDisplay(voucher)}</h3>
                                        </div>
                                        {getStatusBadge(voucher)}
                                    </div>
                                    <div className="bg-gray-50 dark:bg-[#1A1A1A] p-3 rounded-lg border border-gray-100 dark:border-[#333] flex justify-between items-center">
                                        <span className="font-mono font-black text-lg tracking-wider dark:text-white">{voucher.code}</span>
                                        <button
                                            onClick={() => { navigator.clipboard.writeText(voucher.code); alert('Copied!'); }}
                                            className="text-gray-400 hover:text-[#FFBF00]"
                                        >
                                            <Copy size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="p-6 pt-4 bg-gray-50/50 dark:bg-[#151515]">
                                    <div className="flex justify-between items-center text-xs font-medium text-gray-500 mb-4">
                                        <span>Min. Purchase: <span className="text-black dark:text-white font-bold">{voucher.minPurchase > 0 ? `Rp ${voucher.minPurchase.toLocaleString()}` : 'None'}</span></span>
                                        <span>Used: <span className="text-black dark:text-white font-bold">{voucher.usageCount}</span></span>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(voucher)}
                                            className="flex-1 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            EDIT
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(voucher)}
                                            className="flex-1 py-2 bg-white dark:bg-[#222] border border-gray-200 dark:border-[#333] rounded-lg text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#333]"
                                        >
                                            DUPLICATE
                                        </button>
                                        <button
                                            onClick={() => handleDelete(voucher.id)}
                                            className="w-8 flex items-center justify-center bg-red-50 dark:bg-red-900/10 text-red-500 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            <VoucherFormModal
                isOpen={showCreateModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                voucher={editVoucher}
            />
        </div>
    );
}
