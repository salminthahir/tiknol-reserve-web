'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Filter, Search, Edit, Trash2, Copy, X, Scissors } from 'lucide-react';
import { Voucher } from '@/types/voucher';
import VoucherFormModal from '@/app/components/VoucherFormModal';

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

        if (!voucher.active) return 'bg-gray-100 border-gray-400 text-gray-700';
        if (now > validUntil) return 'bg-red-50 border-red-400 text-red-700';
        if (daysUntilExpiry <= 7) return 'bg-yellow-50 border-yellow-400 text-yellow-700';
        return 'bg-green-50 border-green-400 text-green-700';
    };

    const getStatusText = (voucher: Voucher) => {
        const now = new Date();
        const validUntil = new Date(voucher.validUntil);
        const daysUntilExpiry = Math.ceil((validUntil.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (!voucher.active) return 'INACTIVE';
        if (now > validUntil) return 'EXPIRED';
        if (daysUntilExpiry <= 7) return 'EXPIRING SOON';
        return 'ACTIVE';
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'PERCENTAGE': return 'PERCENTAGE DISCOUNT';
            case 'FIXED_AMOUNT': return 'FIXED AMOUNT';
            case 'FREE_ITEM': return 'FREE ITEM';
            case 'BUY_X_GET_Y': return 'BUY X GET Y';
            default: return type;
        }
    };

    const getValueDisplay = (voucher: Voucher) => {
        switch (voucher.type) {
            case 'PERCENTAGE':
                return `${voucher.value}% OFF`;
            case 'FIXED_AMOUNT':
                return `Rp ${voucher.value.toLocaleString()}`;
            default:
                return voucher.value;
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus voucher ini?')) return;

        try {
            const res = await fetch(`/api/admin/vouchers/${id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchVouchers();
            }
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

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] p-6 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-[#552CB7] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="font-black text-xl text-gray-800">Loading vouchers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] font-sans text-black p-3 lg:p-6">

            {/* Header */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-5 mb-4">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">
                            <span className="text-[#FD5A46] text-3xl">.</span>NOL <span className="text-[#552CB7]">VOUCHERS</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            {filteredVouchers.length} voucher tersedia
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/admin/menu"
                            className="bg-white text-gray-700 px-5 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 hover:border-[#552CB7] transition-all"
                        >
                            ← Menu Manager
                        </Link>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white px-5 py-2.5 text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(85,44,183,0.3)] hover:shadow-[0_6px_16px_rgba(85,44,183,0.4)] transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus size={18} />
                            Create Voucher
                        </button>
                    </div>
                </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-4 mb-4">
                <div className="flex flex-col lg:flex-row gap-3">

                    {/* Search */}
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Cari kode atau nama voucher..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all text-sm"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>

                    {/* Filter Toggle */}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${showFilters
                                ? 'bg-[#552CB7] text-white border-[#552CB7] shadow-[0_3px_8px_rgba(85,44,183,0.3)]'
                                : 'bg-white text-gray-600 border-gray-200 hover:border-[#552CB7]'
                            }`}
                    >
                        <Filter size={18} />
                        Filter
                    </button>
                </div>

                {/* Filter Panel */}
                {showFilters && (
                    <div className="mt-4 pt-4 border-t-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 gap-3">

                        {/* Status Filter */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">STATUS</label>
                            <select
                                value={activeFilter}
                                onChange={(e) => setActiveFilter(e.target.value as any)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
                            >
                                <option value="ALL">Semua</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>

                        {/* Type Filter */}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">TIPE</label>
                            <select
                                value={typeFilter}
                                onChange={(e) => setTypeFilter(e.target.value)}
                                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
                            >
                                <option value="ALL">Semua</option>
                                <option value="PERCENTAGE">Percentage</option>
                                <option value="FIXED_AMOUNT">Fixed Amount</option>
                                <option value="FREE_ITEM">Free Item</option>
                                <option value="BUY_X_GET_Y">Buy X Get Y</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            {/* Vouchers Grid - Ticket Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVouchers.length === 0 ? (
                    <div className="col-span-full bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-2 border-gray-200 p-12 text-center">
                        <Scissors size={64} className="mx-auto mb-4 text-gray-300" />
                        <h3 className="text-xl font-black text-gray-800 mb-2">Belum Ada Voucher</h3>
                        <p className="text-gray-500 mb-4">Buat voucher pertama Anda untuk mulai promosi!</p>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white px-6 py-3 text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(85,44,183,0.3)] hover:shadow-[0_6px_16px_rgba(85,44,183,0.4)] transition-all active:scale-95"
                        >
                            Create Voucher
                        </button>
                    </div>
                ) : (
                    filteredVouchers.map((voucher) => (
                        <div
                            key={voucher.id}
                            className="group relative"
                        >
                            {/* Ticket Container with Perforated Edge Effect */}
                            <div className={`relative bg-white rounded-lg overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.08)] border-2 border-gray-300 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.12)] hover:-translate-y-1 ${getStatusColor(voucher)}`}>

                                {/* Perforated Edge (Top) */}
                                <div className="absolute top-0 left-0 right-0 h-2 flex justify-between px-1">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className="w-1 h-2 bg-gray-200"></div>
                                    ))}
                                </div>

                                {/* Ticket Header - Status Bar */}
                                <div className="pt-3 px-4 pb-2 border-b-2 border-dashed border-gray-300">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black tracking-widest text-gray-500">
                                            VOUCHER TICKET
                                        </span>
                                        <span className={`text-[10px] font-black tracking-wider px-2 py-0.5 rounded border-2 ${getStatusColor(voucher)}`}>
                                            {getStatusText(voucher)}
                                        </span>
                                    </div>
                                </div>

                                {/* Main Content */}
                                <div className="p-4">
                                    {/* Voucher Code - Big & Bold */}
                                    <div className="mb-3">
                                        <div className="text-xs font-bold text-gray-500 mb-1">CODE</div>
                                        <div className="font-black text-2xl tracking-tight text-black font-mono bg-gray-100 px-3 py-2 rounded border-2 border-gray-300 text-center">
                                            {voucher.code}
                                        </div>
                                    </div>

                                    {/* Voucher Name */}
                                    <h3 className="font-bold text-sm text-gray-800 mb-3 line-clamp-2 min-h-[2.5rem]">
                                        {voucher.name}
                                    </h3>

                                    {/* Value Display - Prominent */}
                                    <div className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white px-4 py-3 rounded-lg mb-3 text-center border-2 border-black">
                                        <div className="text-xs font-bold opacity-90 mb-1">{getTypeLabel(voucher.type)}</div>
                                        <div className="text-2xl font-black tracking-tight">{getValueDisplay(voucher)}</div>
                                    </div>

                                    {/* Details Grid */}
                                    <div className="space-y-2 mb-3 text-xs">
                                        {voucher.minPurchase > 0 && (
                                            <div className="flex justify-between border-b border-gray-200 pb-1">
                                                <span className="text-gray-600 font-bold">MIN. PURCHASE</span>
                                                <span className="font-black">Rp {voucher.minPurchase.toLocaleString()}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between border-b border-gray-200 pb-1">
                                            <span className="text-gray-600 font-bold">VALID UNTIL</span>
                                            <span className="font-black">
                                                {new Date(voucher.validUntil).toLocaleDateString('id-ID', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                }).toUpperCase()}
                                            </span>
                                        </div>
                                        <div className="flex justify-between border-b border-gray-200 pb-1">
                                            <span className="text-gray-600 font-bold">USAGE</span>
                                            <span className="font-black">
                                                {voucher.usageCount}{voucher.usageLimit ? `/${voucher.usageLimit}` : '/∞'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Usage Progress Bar */}
                                    {voucher.usageLimit && (
                                        <div className="mb-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2 border border-gray-300">
                                                <div
                                                    className="bg-[#552CB7] h-full rounded-full transition-all"
                                                    style={{ width: `${Math.min((voucher.usageCount / voucher.usageLimit) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Barcode-style decoration */}
                                    <div className="flex gap-[2px] h-12 mb-3 items-end">
                                        {voucher.code.split('').map((char, i) => (
                                            <div
                                                key={i}
                                                className="flex-1 bg-black"
                                                style={{ height: `${30 + (char.charCodeAt(0) % 40)}%` }}
                                            ></div>
                                        ))}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="grid grid-cols-3 gap-2 pt-3 border-t-2 border-dashed border-gray-300">
                                        <button
                                            onClick={() => handleEdit(voucher)}
                                            className="p-2 rounded-lg border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 transition-all text-blue-600 font-bold text-xs"
                                            title="Edit"
                                        >
                                            <Edit size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleDuplicate(voucher)}
                                            className="p-2 rounded-lg border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 transition-all text-green-600 font-bold text-xs"
                                            title="Duplicate"
                                        >
                                            <Copy size={16} className="mx-auto" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(voucher.id)}
                                            className="p-2 rounded-lg border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 transition-all text-red-600 font-bold text-xs"
                                            title="Delete"
                                        >
                                            <Trash2 size={16} className="mx-auto" />
                                        </button>
                                    </div>
                                </div>

                                {/* Perforated Edge (Bottom) */}
                                <div className="absolute bottom-0 left-0 right-0 h-2 flex justify-between px-1">
                                    {Array.from({ length: 20 }).map((_, i) => (
                                        <div key={i} className="w-1 h-2 bg-gray-200"></div>
                                    ))}
                                </div>
                            </div>

                            {/* Scissors Icon (Decorative) */}
                            <Scissors
                                size={20}
                                className="absolute -right-2 top-1/2 -translate-y-1/2 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity rotate-90"
                            />
                        </div>
                    ))
                )}
            </div>

            {/* Voucher Form Modal */}
            <VoucherFormModal
                isOpen={showCreateModal}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                voucher={editVoucher}
            />
        </div>
    );
}
