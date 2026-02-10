'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Order, OrderItem } from '@/types/order'; // Import tipe data Order
import { sendWhatsAppNotification } from '@/lib/whatsapp'; // Import fungsi notifikasi
import KitchenSkeleton from '@/app/components/skeletons/KitchenSkeleton';
import { motion, AnimatePresence } from 'framer-motion';

// Base URL aplikasi untuk URL tiket
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";

// 1. Setup Supabase Client (Client Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]); // Gunakan tipe data Order[]
  const [loading, setLoading] = useState(true);

  // Pindahkan deklarasi fungsi ke atas
  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/admin/orders');
      if (!res.ok) {
        throw new Error(`Failed to fetch orders: Status ${res.status}`);
      }
      const data: Order[] = await res.json();

      // Parse the 'items' field only if it's a string.
      // If it's already an object/array (from JSONB), use it directly.
      const parsedOrders = data.map(order => ({
        ...order,
        items: typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      }));

      setOrders(parsedOrders);
      setLoading(false);
    } catch (error: any) {
      console.error("Failed to fetch orders:", error);
      alert(`Gagal mengambil data order: ${error.message || 'Unknown error'}. Silakan coba lagi.`);
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("AdminDashboard: Initializing useEffect for orders and Supabase Realtime.");
    // 1. Ambil data awal
    fetchOrders();

    // 2. Channel untuk real-time update
    const channel = supabase
      .channel('realtime-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, (payload) => {
        console.log('🔔 Supabase Realtime: Perubahan terdeteksi!', payload);
        fetchOrders(); // Panggil ulang fetchOrders setiap ada perubahan
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Admin dashboard terhubung ke Live Monitor!');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Koneksi Live Monitor gagal:', err);
        } else {
          console.log('Admin dashboard Live Monitor status:', status);
        }
      });

    return () => {
      console.log("AdminDashboard: Cleaning up Supabase Realtime channel.");
      supabase.removeChannel(channel);
    };
  }, []);

  // --- PAGINATION LOGIC ---
  const ITEMS_PER_PAGE = 50;
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState<'INCOMING' | 'PREPARING' | 'READY' | 'COMPLETED'>('INCOMING');

  // Reset page when tab changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const updateStatus = async (id: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(order => order.id === id);
    if (!orderToUpdate) return;

    // 1. Optimistic Update
    setOrders((prevOrders: Order[]) =>
      prevOrders.map((order: Order) => {
        if (order.id === id) {
          return { ...order, status: newStatus };
        }
        return order;
      })
    );

    // 2. Kirim perubahan ke server
    try {
      await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });

      // 3. KIRIM NOTIFIKASI WHATSAPP
      let notificationMessage = '';
      const ticketUrl = `${APP_BASE_URL}/ticket/${orderToUpdate.id}`;

      // Logic Notifikasi Sesuai Request Baru
      if (newStatus === 'PREPARING') {
        // Dari PAID -> PREPARING
        notificationMessage = `👨‍🍳 Halo ${orderToUpdate.customerName}! Pesanan *Titiknol Reserve* Anda (#${orderToUpdate.id.slice(-4)}) sedang kami SIAPKAN. Mohon tunggu sebentar yaa! 🙏 Cek update: ${ticketUrl}`;
      } else if (newStatus === 'COMPLETED') {
        // Dari READY -> COMPLETED (Panggil / Selesaikan)
        // User request: "Update ke COMPLETED & Kirim WA"
        notificationMessage = `✅ Halo ${orderToUpdate.customerName}! Pesanan *Titiknol Reserve* Anda (#${orderToUpdate.id.slice(-4)}) SUDAH SIAP / SELESAI! 🥳 Silakan ambil pesanan Anda. Terima kasih! ${ticketUrl}`;
      }
      // Note: Transition ke READY (Selesai Masak) tidak trigger WA, hanya pindah tab.

      if (notificationMessage) {
        await sendWhatsAppNotification({
          customerName: orderToUpdate.customerName,
          whatsapp: orderToUpdate.whatsapp,
          orderId: orderToUpdate.id,
          status: newStatus,
          message: notificationMessage
        });
      }

    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal update status, memuat ulang data.");
      fetchOrders(); // Rollback jika gagal
    }
  };

  if (loading) return <KitchenSkeleton />;

  // Filter Orders based on Active Tab
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'INCOMING') return order.status === 'PAID';
    if (activeTab === 'PREPARING') return order.status === 'PREPARING';
    if (activeTab === 'READY') return order.status === 'READY';
    if (activeTab === 'COMPLETED') return order.status === 'COMPLETED';
    return false;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black p-4 lg:p-6">
      <header className="flex flex-col md:flex-row justify-between items-center mb-6 border-b-4 border-black pb-4 gap-4">
        <h1 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-center md:text-left">
          KITCHEN <span className="text-[#FBC02D]">CONTROL</span>
        </h1>

        {/* TABS NAVIGATION */}
        <div className="flex bg-white border-2 border-black rounded-xl overflow-hidden shadow-[4px_4px_0px_black] p-1">
          <button
            onClick={() => setActiveTab('INCOMING')}
            className={`px-4 py-2 font-black text-xs md:text-sm uppercase transition-colors rounded-lg ${activeTab === 'INCOMING' ? 'bg-[#FBC02D] text-black' : 'hover:bg-gray-100'}`}
          >
            Baru ({orders.filter(o => o.status === 'PAID').length})
          </button>
          <button
            onClick={() => setActiveTab('PREPARING')}
            className={`px-4 py-2 font-black text-xs md:text-sm uppercase transition-colors rounded-lg ${activeTab === 'PREPARING' ? 'bg-black text-white' : 'hover:bg-gray-100'}`}
          >
            Diproses ({orders.filter(o => o.status === 'PREPARING').length})
          </button>
          <button
            onClick={() => setActiveTab('READY')}
            className={`px-4 py-2 font-black text-xs md:text-sm uppercase transition-colors rounded-lg ${activeTab === 'READY' ? 'bg-[#00995E] text-white' : 'hover:bg-gray-100'}`}
          >
            Siap ({orders.filter(o => o.status === 'READY').length})
          </button>
          <button
            onClick={() => setActiveTab('COMPLETED')}
            className={`px-4 py-2 font-black text-xs md:text-sm uppercase transition-colors rounded-lg ${activeTab === 'COMPLETED' ? 'bg-gray-200 text-gray-500' : 'hover:bg-gray-100'}`}
          >
            Selesai
          </button>
        </div>
      </header>

      {/* GRID LAYOUT KARTU ORDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative">
        <AnimatePresence mode="popLayout">
          {paginatedOrders.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="col-span-full flex flex-col items-center justify-center h-64 opacity-40"
            >
              <p className="font-black text-xl">TIDAK ADA PESANAN DI TAB INI</p>
            </motion.div>
          ) : (
            paginatedOrders.map((order) => (
              <motion.div
                layout
                key={order.id}
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{
                  opacity: 0,
                  scale: 0.8,
                  transition: { duration: 0.3 }
                }}
                className={`border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white overflow-hidden rounded-xl flex flex-col h-full`}
              >

                {/* Header Kartu */}
                <div className={`p-4 border-b-2 border-black flex justify-between items-center ${order.status === 'PAID' ? 'bg-[#FBC02D]' :
                  order.status === 'PREPARING' ? 'bg-white' :
                    order.status === 'READY' ? 'bg-[#00995E] text-white' : 'bg-gray-200'
                  }`}>
                  <span className="font-black text-xl">#{order.id.slice(-5).toUpperCase()}</span>
                  <div className="flex flex-col items-end">
                    <span className={`text-[10px] font-black px-2 py-1 rounded border border-black shadow-[2px_2px_0px_rgba(0,0,0,0.5)] ${order.status === 'READY' ? 'bg-white text-black' : 'bg-black text-white'}`}>
                      {order.status}
                    </span>
                    <span className="font-mono text-[10px] font-bold mt-1 opacity-80">
                      {new Date(order.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* Body Kartu */}
                <div className="p-4 space-y-4 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Customer</p>
                      <p className="font-bold text-lg leading-tight line-clamp-1">{order.customerName}</p>
                      <span className="inline-block bg-gray-100 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-300 mt-1">
                        {order.orderType}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Order Items</p>
                      <div className="h-[1px] bg-gray-200 flex-1"></div>
                    </div>

                    <ul className="text-sm space-y-3">
                      {order.items.map((item: any, i: number) => (
                        <li key={i} className="flex flex-col">
                          <div className="flex justify-between font-bold items-start gap-2">
                            <span className="bg-black text-white rounded text-xs w-6 h-6 flex items-center justify-center shrink-0 shadow-sm">{item.qty}</span>
                            <span className="flex-1 leading-tight text-sm py-0.5">{item.name}</span>
                          </div>
                          {item.custom && (
                            <div className="flex gap-1 mt-1.5 ml-8">
                              <span className="text-[9px] font-black border border-black px-1.5 py-0.5 rounded-sm uppercase bg-yellow-100">{item.custom.temp}</span>
                              <span className="text-[9px] font-black border border-black px-1.5 py-0.5 rounded-sm uppercase bg-gray-100">{item.custom.size}</span>
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {order.whatsapp && order.whatsapp !== 'N/A' && (
                    <div className="bg-blue-50 p-2 rounded-lg border border-blue-100 text-blue-800 text-xs flex items-center gap-2">
                      <span className="font-bold shrink-0">📞</span> <span className="truncate">{order.whatsapp}</span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t-2 border-black bg-gray-50 mt-auto">
                  {order.status === 'PAID' && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      onClick={() => updateStatus(order.id, 'PREPARING')}
                      className="w-full bg-black text-white py-3.5 font-black hover:bg-gray-900 transition-colors uppercase rounded-lg shadow-[4px_4px_0px_black] active:shadow-[0px_0px_0px_black] active:translate-x-[4px] active:translate-y-[4px] border-2 border-black tracking-wide"
                    >
                      Terima / Masak
                    </motion.button>
                  )}

                  {order.status === 'PREPARING' && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      onClick={() => updateStatus(order.id, 'READY')}
                      className="w-full bg-white text-black border-2 border-black py-3.5 font-black hover:bg-yellow-50 transition-colors uppercase rounded-lg shadow-[4px_4px_0px_black] active:shadow-[0px_0px_0px_black] active:translate-x-[4px] active:translate-y-[4px] tracking-wide"
                    >
                      Selesai Masak
                    </motion.button>
                  )}

                  {order.status === 'READY' && (
                    <motion.button
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98, y: 0 }}
                      onClick={() => updateStatus(order.id, 'COMPLETED')}
                      className="w-full bg-[#00995E] text-white py-3.5 font-black hover:bg-green-700 transition-colors uppercase rounded-lg border-2 border-black shadow-[4px_4px_0px_black] active:shadow-[0px_0px_0px_black] active:translate-x-[4px] active:translate-y-[4px] tracking-wide"
                    >
                      Panggil / Selesaikan
                    </motion.button>
                  )}

                  {order.status === 'COMPLETED' && (
                    <div className="text-center text-xs font-bold text-gray-400 py-2 italic border-2 border-dashed border-gray-300 rounded-lg">
                      Pesanan Selesai
                    </div>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* PAGINATION CONTROLS */}
      {totalPages > 1 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white border-2 border-black shadow-[4px_4px_0px_black] rounded-full px-6 py-2 flex items-center gap-4 z-50">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="font-black hover:text-[#FBC02D] disabled:opacity-30 disabled:hover:text-black transition-colors"
          >
            ← PREV
          </button>
          <span className="font-mono text-sm font-bold">
            PAGE {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="font-black hover:text-[#FBC02D] disabled:opacity-30 disabled:hover:text-black transition-colors"
          >
            NEXT →
          </button>
        </div>
      )}
    </div>
  );
}