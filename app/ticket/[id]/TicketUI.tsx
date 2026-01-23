'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import { createClient } from '@supabase/supabase-js';
import { Order, OrderItem } from '@/types/order'; // Import tipe data Order

// Inisialisasi Supabase Client (hanya di client-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Helper untuk format tanggal
const formatDate = (dateString: string) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).replace(/\./g, ':').toUpperCase();
};

// [KOMPONEN BARU] Live Order Status Tracker
const OrderStatusTracker = ({ status }: { status: Order['status'] }) => {
  const statuses: Order['status'][] = ['PAID', 'PREPARING', 'COMPLETED'];
  let currentStatusIndex = statuses.indexOf(status);
  
  if (currentStatusIndex === -1 && status === 'PENDING') currentStatusIndex = -1;
  else if (currentStatusIndex === -1) currentStatusIndex = 2;


  return (
    <div className="w-full mb-10">
      <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-4 border-b border-black pb-2">
        LIVE ORDER TRACKER
      </h3>
      <div className="flex justify-between items-start font-mono relative">
        <div className="absolute top-2.5 left-0 w-full h-1 bg-gray-300 transform -translate-y-1/2"></div>
        <div 
          className="absolute top-2.5 left-0 h-1 bg-black transform -translate-y-1/2 transition-all duration-500 ease-in-out" 
          style={{ width: `${(currentStatusIndex / (statuses.length - 1)) * 100}%` }}
        ></div>

        {statuses.map((step, index) => {
          const isActive = index <= currentStatusIndex;
          return (
            <div key={step} className="z-10 text-center w-20">
              <div 
                className={`w-5 h-5 rounded-full border-[3px] border-black mx-auto transition-colors duration-300 ${isActive ? 'bg-[#FBC02D]' : 'bg-white'}`}
              ></div>
              <p className={`mt-3 text-xs font-bold uppercase tracking-widest transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                {step === 'PAID' && 'Diterima'}
                {step === 'PREPARING' && 'Disiapkan'}
                {step === 'COMPLETED' && 'Selesai'}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default function TicketUI({ order }: { order: Order }) {
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);
  const [liveOrder, setLiveOrder] = useState<Order>(order);

  useEffect(() => { setIsClient(true); }, []);

  useEffect(() => {
    if (!isClient || ['COMPLETED', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(liveOrder.status)) {
      return;
    }

    const channel = supabase
      .channel(`ticket-channel-${liveOrder.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'Order',
          filter: `id=eq.${liveOrder.id}`,
        },
        (payload) => {
          console.log('Perubahan status terdeteksi:', payload.new);
          setLiveOrder(payload.new as Order);
        }
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
          console.log('Berhasil terhubung ke Live Tracker!');
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Koneksi Live Tracker gagal:', err);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isClient, liveOrder.id]);

  useEffect(() => {
    if (liveOrder.status === 'PENDING') {
      const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
      const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || "";
      const script = document.createElement('script');
      script.src = snapScript;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
      return () => { document.body.removeChild(script); };
    }
  }, [liveOrder.status]);

  const handleResume = () => {
    if (!liveOrder.snapToken) return alert("Token tidak ditemukan, hubungi admin.");
    // @ts-expect-error - window.snap di-inject oleh script Midtrans secara global
    window.snap.pay(liveOrder.snapToken, {
      onSuccess: (result: Record<string, unknown>) => { console.log(result); setLiveOrder({...liveOrder, status: 'PAID' }); },
      onPending: (result: Record<string, unknown>) => { console.log(result); },
      onError: (result: Record<string, unknown>) => { console.error(result); setLiveOrder({...liveOrder, status: 'FAILED' }); },
      onClose: () => console.log("Popup ditutup")
    });
  };

  if (!isClient) return null;

  const isPending = liveOrder.status === 'PENDING';
  const isProcessing = ['PAID', 'PREPARING'].includes(liveOrder.status);
  const isCompleted = liveOrder.status === 'COMPLETED';
  const isFailed = ['FAILED', 'CANCELLED', 'EXPIRED'].includes(liveOrder.status);
  
  const accentColor = isProcessing || isCompleted ? '#10B981' : (isFailed ? '#EF4444' : '#FBC02D');
  let statusText: string = liveOrder.status;
  if (isPending) statusText = 'WAITING PAYMENT';
  if (isProcessing) statusText = 'PAID / IN PROGRESS';
  if (isCompleted) statusText = 'COMPLETED';
  if (isFailed) statusText = 'VOID / FAILED';
  

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4 font-sans selection:bg-[#FBC02D] selection:text-black">
      <div className="w-full max-w-4xl bg-[#F5F5F5] text-[#1A1A1A] shadow-2xl rounded-lg overflow-hidden flex flex-col md:flex-row relative">
        <div className="absolute top-0 left-0 w-full h-4 bg-[#1A1A1A] flex items-center px-2">
            <div className="flex gap-1">
                {[...Array(10)].map((_,i) => <div key={i} className="w-2 h-2 rounded-full bg-[#FBC02D]"></div>)}
            </div>
        </div>

        <div className="flex-grow p-8 md:p-10 pt-14 relative">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-4 border-black pb-6">
            <div>
              <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                THE <span style={{ color: accentColor }}>SELECTION</span>
              </h1>
              <p className="text-sm font-bold tracking-widest uppercase mt-2">Official E-Ticket Receipt</p>
            </div>
            <div 
              className="mt-4 md:mt-0 px-6 py-2 text-xl font-black uppercase tracking-widest transform -rotate-2 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              style={{ backgroundColor: accentColor, color: (isProcessing || isCompleted) ? 'white' : 'black' }}
            >
              {statusText}
            </div>
          </div>
          
          {!isPending && !isFailed && <OrderStatusTracker status={liveOrder.status} />}

          <div className="grid grid-cols-2 gap-y-8 gap-x-4 mb-10">
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Order ID</h3>
              <p className="text-2xl font-mono font-bold">#{liveOrder.id.slice(0,8).toUpperCase()}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Date Issued</h3>
              <p className="text-lg font-mono font-bold">{formatDate(liveOrder.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">Customer Name</h3>
              <p className="text-xl font-bold uppercase truncate">{liveOrder.customerName}</p>
            </div>
             <div>
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-1">WhatsApp</h3>
              <p className="text-lg font-bold font-mono">{liveOrder.whatsapp}</p>
            </div>
          </div>

          <div className="mb-8">
             <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 border-b border-black pb-1 inline-block">Manifest / Items</h3>
             <ul className="space-y-3 font-mono text-sm">
                {Array.isArray(liveOrder.items) && liveOrder.items.map((item: OrderItem, idx: number) => (
                  <li key={idx} className="flex justify-between items-center border-b border-dashed border-gray-300 pb-2">
                    <div>
                      <span className="font-bold mr-2">{item.qty}x</span>
                      <span className="uppercase">{item.name}</span>
                    </div>
                    <span className="font-bold">Rp {item.price.toLocaleString('id-ID')}</span>
                  </li>
                ))}
             </ul>
          </div>

          <div className="flex justify-between items-end border-t-4 border-black pt-4">
              <span className="text-lg font-black uppercase tracking-widest">Total Amount NETT</span>
              <span className="text-4xl md:text-5xl font-black tracking-tighter" style={{ color: accentColor }}>
                 Rp {liveOrder.totalAmount.toLocaleString('id-ID')}
              </span>
          </div>

          {isPending && (
            <div className="mt-8 pt-6 border-t border-gray-300">
                <button onClick={handleResume} className="w-full font-bold py-4 uppercase tracking-widest shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 hover:shadow-none transition-all border-2 border-black" style={{ backgroundColor: accentColor }}>
                    Complete Payment Now ➔
                </button>
            </div>
          )}
           {isFailed && (
            <div className="mt-8 pt-6 border-t border-gray-300">
                <button onClick={() => router.push('/')} className="w-full bg-black text-white font-bold py-4 uppercase tracking-widest hover:bg-red-600 transition-colors">
                    Order Failed - Return to Menu
                </button>
            </div>
          )}

        </div>

        <div className="md:w-[320px] bg-[#1A1A1A] text-[#F5F5F5] p-8 relative flex flex-col justify-between overflow-hidden">
           <div className="hidden md:block absolute left-0 top-0 bottom-0 w-[2px] border-l-2 border-dashed" style={{ borderColor: accentColor }}></div>
           <div className="hidden md:block absolute -left-3 top-1/4 w-6 h-6 bg-[#121212] rounded-full"></div>
           <div className="hidden md:block absolute -left-3 bottom-1/4 w-6 h-6 bg-[#121212] rounded-full"></div>
           <div className="text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter mb-6">ADMIT ONE</h2>
              <div className="bg-white p-3 rounded-lg inline-block mb-6 shadow-[0_0_20px_rgba(251,192,45,0.3)]">
                 <QRCodeSVG 
                    value={typeof window !== 'undefined' ? window.location.href : liveOrder.id} 
                    size={180}
                    fgColor="#1A1A1A"
                    bgColor="#FFFFFF"
                    level="Q"
                 />
              </div>
              <p className="text-xs font-mono text-gray-400 uppercase tracking-widest mb-1">Scan for validation</p>
              <p className="text-lg font-mono font-bold" style={{ color: accentColor }}>#{liveOrder.id.slice(0,8).toUpperCase()}</p>
           </div>
           <div className="mt-8 text-center border-t border-dashed border-gray-700 pt-6">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Ticket Summary</p>
              <div className="font-mono text-sm text-gray-300 space-y-1">
                 <p>{formatDate(liveOrder.createdAt).split(' ')[0]}</p>
                 <p>{liveOrder.customerName.split(' ')[0]}</p>
                 <p className="text-xl font-bold mt-2" style={{ color: accentColor }}>Rp {liveOrder.totalAmount.toLocaleString('id-ID')}</p>
              </div>
           </div>
           <div className="absolute -right-6 bottom-20 transform -rotate-90 text-gray-800 text-5xl font-black uppercase tracking-widest opacity-30 pointer-events-none">
              SELECTION
           </div>
        </div>
      </div>
    </div>
  );
}