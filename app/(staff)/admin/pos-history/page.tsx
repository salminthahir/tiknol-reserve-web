'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Order } from '@/types/order';
import { Search, Filter, Calendar, ChevronLeft, ChevronRight, X, Ticket } from 'lucide-react';
import HistorySkeleton from '@/app/components/skeletons/HistorySkeleton';

export default function POSHistoryPage() {
  // Data State
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [orderTypeFilter, setOrderTypeFilter] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'TODAY' | 'YESTERDAY' | 'WEEK' | 'MONTH'>('ALL');

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Sort State
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc'>('date_desc');

  // UI States
  const [showFilters, setShowFilters] = useState(false);

  // Multi-Branch State
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<{ isGlobalAccess: boolean; branchId: string } | null>(null);

  // Fetch Session & Branches
  useEffect(() => {
    const init = async () => {
      try {
        const sessionRes = await fetch('/api/auth/me');
        if (sessionRes.ok) {
          const user = await sessionRes.json();
          setCurrentUser(user);

          if (user.isGlobalAccess) {
            const branchRes = await fetch('/api/branches');
            if (branchRes.ok) {
              const branchData = await branchRes.json();
              setBranches(branchData);
              // Default to home branch or first
              if (user.branchId) setSelectedBranchId(user.branchId);
              else if (branchData.length > 0) setSelectedBranchId(branchData[0].id);
            }
          } else {
            setSelectedBranchId(user.branchId);
          }
        }
      } catch (e) { console.error(e); }
    };
    init();
  }, []);

  // Fetch Orders
  useEffect(() => {
    const fetchOrders = async () => {
      // Wait for branch selection if global access
      if (currentUser?.isGlobalAccess && !selectedBranchId) return;

      try {
        setLoading(true);
        const url = currentUser?.isGlobalAccess
          ? `/api/admin/pos-history?branchId=${selectedBranchId}`
          : `/api/admin/pos-history`;

        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch POS history: Status ${res.status}`);
        }
        const data: Order[] = await res.json();
        const parsedOrders = data.map(order => ({
          ...order,
          items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
        }));
        setOrders(parsedOrders);
      } catch (err: any) {
        console.error("Error fetching POS history:", err);
        setError(err.message || "Failed to load POS history.");
      } finally {
        setLoading(false);
      }
    };

    // Trigger fetch only when we have necessary branch context
    if (selectedBranchId || (currentUser && !currentUser.isGlobalAccess)) {
      fetchOrders();
    }
  }, [selectedBranchId, currentUser]);

  // Filter & Sort Logic
  const filteredAndSortedOrders = useMemo(() => {
    let filtered = [...orders];

    // Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query)
      );
    }

    // Status Filter
    if (statusFilter !== 'ALL') {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // Order Type Filter
    if (orderTypeFilter !== 'ALL') {
      filtered = filtered.filter(order =>
        (order as any).orderType === orderTypeFilter
      );
    }

    // Date Filter
    if (dateFilter !== 'ALL') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      filtered = filtered.filter(order => {
        const orderDate = new Date(order.createdAt);
        const orderDay = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());

        switch (dateFilter) {
          case 'TODAY':
            return orderDay.getTime() === today.getTime();
          case 'YESTERDAY':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return orderDay.getTime() === yesterday.getTime();
          case 'WEEK':
            const weekAgo = new Date(today);
            weekAgo.setDate(weekAgo.getDate() - 7);
            return orderDay >= weekAgo;
          case 'MONTH':
            const monthAgo = new Date(today);
            monthAgo.setMonth(monthAgo.getMonth() - 1);
            return orderDay >= monthAgo;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'date_asc':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'amount_desc':
          return b.totalAmount - a.totalAmount;
        case 'amount_asc':
          return a.totalAmount - b.totalAmount;
        default:
          return 0;
      }
    });

    return filtered;
  }, [orders, searchQuery, statusFilter, orderTypeFilter, dateFilter, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedOrders = filteredAndSortedOrders.slice(startIndex, endIndex);

  // Group paginated orders by date
  const paginatedGroupedOrders = useMemo(() => {
    const groups: { [key: string]: Order[] } = {};

    paginatedOrders.forEach(order => {
      const date = new Date(order.createdAt);
      const dateKey = date.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(order);
    });

    return groups;
  }, [paginatedOrders]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, orderTypeFilter, dateFilter, sortBy]);

  if (loading) return <HistorySkeleton />;
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] p-6 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl border-2 border-red-500 shadow-lg">
        <p className="text-red-600 font-bold text-lg">Error: {error}</p>
      </div>
    </div>
  );

  const activeFiltersCount = [
    searchQuery !== '',
    statusFilter !== 'ALL',
    orderTypeFilter !== 'ALL',
    dateFilter !== 'ALL'
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] font-sans text-black p-3 lg:p-6">

      {/* Header - Swiss Design */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-5 mb-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
          <div>
            <div className="flex items-center gap-4">
              <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter">
                <span className="text-[#FD5A46] text-3xl">.</span>NOL <span className="text-[#552CB7]">HISTORY</span>
              </h1>

              {currentUser?.isGlobalAccess && (
                <select
                  value={selectedBranchId}
                  onChange={(e) => setSelectedBranchId(e.target.value)}
                  className="bg-white border-2 border-gray-200 rounded-lg px-3 py-1 font-bold text-sm focus:outline-none focus:border-[#552CB7]"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {filteredAndSortedOrders.length} transaksi ditemukan
            </p>
          </div>
          <Link
            href="/admin/pos"
            className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white px-5 py-2.5 text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(85,44,183,0.3)] hover:shadow-[0_6px_16px_rgba(85,44,183,0.4)] transition-all active:scale-95"
          >
            ← Kembali ke POS
          </Link>
        </div>
      </div>

      {/* Search & Filter Bar - Swiss Grid */}
      <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-4 mb-4">
        <div className="flex flex-col lg:flex-row gap-3">

          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari order ID atau nama customer..."
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

          {/* Filter Toggle Button */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-all ${showFilters || activeFiltersCount > 0
              ? 'bg-[#552CB7] text-white border-[#552CB7] shadow-[0_3px_8px_rgba(85,44,183,0.3)]'
              : 'bg-white text-gray-600 border-gray-200 hover:border-[#552CB7]'
              }`}
          >
            <Filter size={18} />
            Filter {activeFiltersCount > 0 && `(${activeFiltersCount})`}
          </button>

          {/* Items per page */}
          <select
            value={itemsPerPage}
            onChange={(e) => setItemsPerPage(Number(e.target.value))}
            className="px-4 py-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>
        </div>

        {/* Filter Panel - Swiss Layout */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">

            {/* Date Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">TANGGAL</label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
              >
                <option value="ALL">Semua</option>
                <option value="TODAY">Hari Ini</option>
                <option value="YESTERDAY">Kemarin</option>
                <option value="WEEK">7 Hari Terakhir</option>
                <option value="MONTH">30 Hari Terakhir</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">STATUS</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
              >
                <option value="ALL">Semua</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="PREPARING">Preparing</option>
                <option value="READY">Ready</option>
                <option value="COMPLETED">Completed</option>
                <option value="FAILED">Failed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="EXPIRED">Expired</option>
              </select>
            </div>

            {/* Order Type Filter */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">TIPE ORDER</label>
              <select
                value={orderTypeFilter}
                onChange={(e) => setOrderTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
              >
                <option value="ALL">Semua</option>
                <option value="DINE_IN">Dine In</option>
                <option value="TAKE_AWAY">Take Away</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1.5">URUTKAN</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg font-bold text-sm focus:outline-none focus:border-[#552CB7] transition-all"
              >
                <option value="date_desc">Terbaru</option>
                <option value="date_asc">Terlama</option>
                <option value="amount_desc">Nilai Tertinggi</option>
                <option value="amount_asc">Nilai Terendah</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Orders List - Grouped by Date */}
      <div className="space-y-4">
        {Object.keys(paginatedGroupedOrders).length === 0 ? (
          <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100 p-12 text-center">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-black text-gray-800 mb-2">Tidak Ada Transaksi</h3>
            <p className="text-gray-500">Tidak ada transaksi yang sesuai dengan filter Anda.</p>
          </div>
        ) : (
          Object.entries(paginatedGroupedOrders).map(([date, dateOrders]) => {
            const dailyTotal = dateOrders.reduce((sum, order) => sum + order.totalAmount, 0);

            return (
              <div key={date} className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 overflow-hidden">

                {/* Date Header - Swiss Design */}
                <div className="bg-gradient-to-r from-[#FFC567] to-[#FFD54F] px-5 py-3 border-b-2 border-black">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Calendar size={18} className="text-black" />
                      <h2 className="font-black text-lg text-black">{date}</h2>
                      <span className="bg-black text-[#FFC567] px-2.5 py-1 rounded text-xs font-black border-2 border-black">
                        {dateOrders.length}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-black/60">Total Hari Ini</p>
                      <p className="font-black text-lg text-black">Rp {dailyTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {/* Orders in this date - Zebra Striping */}
                <div className="divide-y-2 divide-gray-200">
                  {dateOrders.map((order, idx) => (
                    <div
                      key={order.id}
                      className={`p-5 transition-colors border-l-4 border-l-[#552CB7] ${idx % 2 === 0
                        ? 'bg-white hover:bg-gray-50'
                        : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:justify-between gap-4">

                        {/* Left: Order Info */}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-black text-sm text-gray-800">
                              #{order.id.slice(0, 8).toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${order.status === 'PAID' || order.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : order.status === 'PENDING' || order.status === 'PREPARING' || order.status === 'READY'
                                ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                                : order.status === 'FAILED' || order.status === 'CANCELLED' || order.status === 'EXPIRED'
                                  ? 'bg-red-100 text-red-700 border-red-300'
                                  : 'bg-gray-100 text-gray-700 border-gray-300'
                              }`}>
                              {order.status}
                            </span>
                            {(order as any).orderType && (
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${(order as any).orderType === 'DINE_IN'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-purple-100 text-purple-700'
                                }`}>
                                {(order as any).orderType === 'DINE_IN' ? 'DINE IN' : 'TAKE AWAY'}
                              </span>
                            )}
                            {order.voucherId && (
                              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-300">
                                <Ticket size={12} />
                                {(order as any).voucher?.code || 'VOUCHER'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-bold text-gray-600">{order.customerName}</p>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {new Date(order.createdAt).toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>

                          {/* Items */}
                          <div className="space-y-1 mt-3">
                            {order.items.map((item: any, i: number) => (
                              <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-600">
                                  <span className="font-bold text-gray-800">{item.qty}x</span> {item.name}
                                </span>
                                <span className="font-bold text-gray-800">
                                  Rp {(item.price * item.qty).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Right: Total - Swiss Box */}
                        <div className="lg:text-right bg-white px-4 py-3 rounded-xl border-2 border-gray-200 lg:min-w-[200px] flex flex-col justify-center">
                          {order.discountAmount > 0 && (
                            <div className="mb-2 pb-2 border-b border-gray-100 space-y-0.5">
                              <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
                                <span>Subtotal</span>
                                <span>Rp {(order.subtotal || (order.totalAmount + order.discountAmount)).toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[10px] font-bold text-green-600 uppercase">
                                <span>Discount</span>
                                <span>- Rp {order.discountAmount.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-1">TOTAL FINAL</p>
                          <p className="text-2xl font-black text-black">
                            Rp {order.totalAmount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination - Swiss Design */}
      {totalPages > 1 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-2 border-gray-200 p-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-600">
              Menampilkan <span className="font-bold">{startIndex + 1}</span> - <span className="font-bold">{Math.min(endIndex, filteredAndSortedOrders.length)}</span> dari <span className="font-bold">{filteredAndSortedOrders.length}</span> transaksi
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#552CB7] hover:bg-[#552CB7] hover:text-white transition-all"
              >
                <ChevronLeft size={20} />
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-10 h-10 rounded-lg font-bold text-sm transition-all ${currentPage === pageNum
                        ? 'bg-[#552CB7] text-white shadow-[0_3px_8px_rgba(85,44,183,0.3)]'
                        : 'border-2 border-gray-200 hover:border-[#552CB7]'
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg border-2 border-gray-200 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#552CB7] hover:bg-[#552CB7] hover:text-white transition-all"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
