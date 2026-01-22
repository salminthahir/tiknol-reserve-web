'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// 1. Setup Supabase Client (Client Side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function AdminDashboard() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // app/admin/dashboard/page.tsx

  useEffect(() => {
    // 1. Ambil data awal
    fetchOrders();

    // 2. DEBUGGER CHANNEL
    const channel = supabase
      .channel('room1')
      .on('postgres_changes', { event: '*', schema: 'public' }, (payload) => {
        // Log ini akan muncul di Console Browser (F12) kalau ada koneksi nyambung
        console.log('🔔 ADA SINYAL MASUK:', payload);
        
        // Panggil fetchOrders setiap ada perubahan apapun di database
        fetchOrders();
      })
      .subscribe((status) => {
        // Cek status koneksi di Console
        console.log('STATUS KONEKSI:', status);
      });

    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const fetchOrders = async () => {
    // Ambil order yang statusnya BUKAN Pending (hanya yang sudah bayar/gagal)
    // Urutkan dari yang terbaru
    const res = await fetch('/api/admin/orders'); 
    const data = await res.json();
    setOrders(data);
    setLoading(false);
  };

  const updateStatus = async (id: string, newStatus: string) => {
    // 1. MAGIC: OPTIMISTIC UPDATE
    // Langsung ubah tampilan di layar detik ini juga (tanpa nunggu server/loading)
    // Cari bagian ini di updateStatus
        setOrders((prevOrders) => 
        prevOrders.map((order) => {
            if (order.id === id) {
            // Jika status baru adalah COMPLETED, kita jangan cuma ganti status,
            // tapi mungkin kita ingin menghilangkannya dari pandangan?
            
            // OPSI A: Tetap tampilkan tapi transparant (Seperti sekarang)
            return { ...order, status: newStatus }; 
            
            // OPSI B: Langsung Hapus dari Layar (Biar bersih)
            // return null; // (Nanti di filter di bawah)
            }
            return order;
        })
        // Jika pilih OPSI B, tambahkan .filter(Boolean) di sini
        );

    // 2. Kirim Laporan ke Server (Di Background)
    try {
      await fetch('/api/admin/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      // Sukses? Biarkan saja, tampilan sudah berubah duluan tadi.
    } catch (error) {
      console.error("Gagal update status:", error);
      // Jika error, baru kita refresh data asli (Rollback)
      alert("Gagal update status, cek koneksi internet.");
      fetchOrders(); 
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
          <div key={order.id} className={`border-2 border-black p-0 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-white ${order.status === 'COMPLETED' ? 'opacity-50' : ''}`}>
            
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
                   {order.items.map((item: any, i: number) => (
                     <li key={i} className="flex justify-between border-b border-dashed border-gray-300 pb-1">
                       <span>{item.qty}x {item.name}</span>
                     </li>
                   ))}
                 </ul>
               </div>
            </div>

            {/* Footer Actions (GHOST ORDER PREVENTION) */}
            <div className="p-4 border-t-2 border-black bg-gray-50 grid grid-cols-2 gap-2">
               {/* Logic Tombol Berubah Sesuai Status */}
               
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