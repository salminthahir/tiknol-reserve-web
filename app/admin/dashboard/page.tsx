'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Order, OrderItem } from '@/types/order'; // Import tipe data Order

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
    // 1. Ambil data awal
    fetchOrders();

    // 2. Channel untuk real-time update
    const channel = supabase
      .channel('realtime-admin-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'Order' }, (payload) => {
        console.log('🔔 Perubahan terdeteksi, mengambil data baru...', payload);
        fetchOrders(); // Panggil ulang fetchOrders setiap ada perubahan
      })
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Admin dashboard terhubung ke Live Monitor!');
        }
         if (status === 'CHANNEL_ERROR') {
          console.error('Koneksi Live Monitor gagal:', err);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const updateStatus = async (id: string, newStatus: Order['status']) => {
    // 1. Optimistic Update
    setOrders((prevOrders: Order[]) => 
      prevOrders.map((order: Order) => {
        if (order.id === id) {
          // Opsi A: Tetap tampilkan tapi transparant (Seperti sekarang)
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
    } catch (error) {
      console.error("Gagal update status:", error);
      alert("Gagal update status, memuat ulang data.");
      fetchOrders(); // Rollback jika gagal
    }
  };

  if (loading) return <div className="p-10 font-bold">LOADING DASHBOARD...</div>;

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black p-6">
      <header className="flex justify-between items-center mb-8 border-b-4 border-black pb-4">
        <h1 className="text-4xl font-black uppercase tracking-tighter">
          KITCHEN <span className="text-[#FBC02D]">CONTROL</span>
        </h1>
        <div className="text-right">
           <p className="font-bold">LIVE MONITOR</p>
           <p className="text-xs font-mono text-gray-500">Auto-refreshing</p>
        </div>
      </header>

      {/* GRID LAYOUT KARTU ORDER */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {orders.map((order) => (
          <div key={order.id} className={`border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white transition-opacity duration-500 ${order.status === 'COMPLETED' ? 'opacity-40' : ''}`}>
            
            {/* Header Kartu */}
            <div className={`p-4 border-b-2 border-black flex justify-between items-center ${order.status === 'PAID' ? 'bg-[#FBC02D]' : 'bg-gray-100'}`}>
               <span className="font-black text-lg">#{order.id.slice(0,5).toUpperCase()}</span>
               <span className="text-xs font-bold px-2 py-1 bg-black text-white rounded">{order.status}</span>
            </div>

            {/* Body Kartu */}
            <div className="p-4 space-y-4">
               <div>
                 <p className="text-xs font-bold text-gray-400 uppercase">Customer</p>
                 <p className="font-bold text-lg">{order.customerName}</p>
                 <p className="font-mono text-sm">{order.whatsapp}</p>
               </div>
               
               <div>
                 <p className="text-xs font-bold text-gray-400 uppercase mb-2">Items</p>
                 <ul className="text-sm space-y-1">
                   {order.items.map((item: OrderItem, i: number) => ( // Gunakan tipe OrderItem
                     <li key={i} className="flex justify-between border-b border-dashed border-gray-300 pb-1">
                       <span>{item.qty}x {item.name}</span>
                     </li>
                   ))}
                 </ul>
               </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t-2 border-black bg-gray-50 grid grid-cols-2 gap-2">
               {order.status === 'PAID' && (
                 <button 
                   onClick={() => updateStatus(order.id, 'PREPARING')}
                   className="col-span-2 bg-black text-white py-3 font-bold hover:bg-green-600 transition-colors uppercase"
                 >
                   Verifikasi & Masak
                 </button>
               )}

               {order.status === 'PREPARING' && (
                 <button 
                   onClick={() => updateStatus(order.id, 'COMPLETED')}
                   className="col-span-2 bg-[#FBC02D] text-black py-3 font-bold hover:bg-yellow-500 transition-colors uppercase border border-black"
                 >
                   Selesai & Panggil
                 </button>
               )}

                {order.status === 'COMPLETED' && (
                 <div className="col-span-2 text-center text-xs font-bold text-gray-400 py-2">
                   ORDER CLOSED
                 </div>
               )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}