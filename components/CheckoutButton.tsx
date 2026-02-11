'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { OrderItem } from '@/types/order'; // Import tipe data OrderItem

// Tipe data untuk props
interface CheckoutProps {
  items: OrderItem[];
  total: number;
  customerName: string;
  whatsapp: string;
  disabled: boolean;
  branchId?: string; // Optional temporary, but should be required.
}

export default function CheckoutButton({ items, total, customerName, whatsapp, disabled, branchId }: CheckoutProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // ... (useEffect remains same) ...

  const handlePayment = async () => {
    if (!branchId) {
      alert("Mohon pilih cabang terlebih dahulu");
      return;
    }
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
          totalAmount: total,
          branchId: branchId
        }),
      });

      const data = await response.json();

      // 2. Munculkan Popup Midtrans
      if (data.token) {
        // @ts-expect-error - window.snap di-inject oleh script Midtrans secara global
        window.snap.pay(data.token, {
          onSuccess: function (result: { order_id: string }) {
            console.log("Payment Success:", result);
            router.push(`/ticket/${result.order_id}`);
          },
          onPending: function (result: { order_id: string }) {
            console.log("Payment Pending:", result);
            router.push(`/ticket/${result.order_id}`);
          },
          onError: function (result: Record<string, unknown>) {
            console.error("Payment Error:", result);
            alert("Pembayaran gagal! Silakan coba lagi.");
          },
          onClose: function () {
            alert("Anda belum menyelesaikan pembayaran.");
          }
        });
      } else {
        alert("Gagal mendapatkan token pembayaran");
      }
    }
    catch (error) {
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
      {loading ? "MEMPROSES..." : "PAY NOW"}
    </button>
  );
}