'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Tipe data untuk props
interface CheckoutProps {
  items: any[];
  total: number;
  customerName: string;
  whatsapp: string;
  disabled: boolean;
}

export default function CheckoutButton({ items, total, customerName, whatsapp, disabled }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Load Script Midtrans Snap
  useEffect(() => {
    const snapScript = "https://app.sandbox.midtrans.com/snap/snap.js";
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || ""; 
    
    const script = document.createElement('script');
    script.src = snapScript;
    script.setAttribute('data-client-key', clientKey);
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    setLoading(true);
    try {
      // 1. Panggil API Tokenizer
      const response = await fetch("/api/tokenizer", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          whatsapp,
          items,
          total
        }),
      });

      const data = await response.json();

      // 2. Munculkan Popup Midtrans
      if (data.token) {
        // @ts-ignore
        window.snap.pay(data.token, {
          // Sukses -> Redirect ke Ticket Page
          onSuccess: function(result: any) {
            console.log("Payment Success:", result);
            router.push(`/ticket/${result.order_id}`); 
          },
          // Pending -> Redirect ke Ticket Page (Status Kuning)
          onPending: function(result: any) {
            console.log("Payment Pending:", result);
            router.push(`/ticket/${result.order_id}`);
          },
          // Error -> Alert
          onError: function(result: any) {
            console.error("Payment Error:", result);
            alert("Pembayaran gagal! Silakan coba lagi.");
          },
          // Close -> Alert
          onClose: function() {
            alert("Anda belum menyelesaikan pembayaran.");
          }
        });
      } else {
        alert("Gagal mendapatkan token pembayaran");
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan sistem");
    }
    setLoading(false);
  };

  return (
    <button 
      onClick={handlePayment} 
      disabled={disabled || loading}
      className={`w-full py-4 font-bold tracking-widest uppercase transition-colors rounded-xl shadow-lg
        ${disabled || loading 
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed' 
          : 'bg-[#E64A19] text-white hover:bg-white hover:text-[#E64A19] border-2 border-transparent hover:border-[#E64A19]'
        }`}
    >
      {loading ? "MEMPROSES..." : `PAY NOW • Rp ${total.toLocaleString('id-ID')}`}
    </button>
  );
}