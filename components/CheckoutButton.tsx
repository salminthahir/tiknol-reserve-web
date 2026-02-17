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
  const [isProcessing, setIsProcessing] = useState(false); // New state for post-payment processing
  const router = useRouter();

  // ... (useEffect remains same) ...

  /* Duitku Implementation */
  const [showModal, setShowModal] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);

  // 1. Fetch Methods & Show Modal
  const handleInitialClick = async () => {
    if (!branchId) {
      alert("Mohon pilih cabang terlebih dahulu");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/payment/methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: total })
      });
      const data = await res.json();

      if (data.methods) {
        setPaymentMethods(data.methods);
        setShowModal(true);
      } else {
        alert("Gagal memuat metode pembayaran");
      }
    } catch (e) {
      console.error(e);
      alert("Gagal memuat metode pembayaran");
    } finally {
      setLoading(false);
    }
  };

  // 2. Process Payment with Selected Method
  const handlePayment = async (selectedMethod: string) => {
    setShowModal(false);
    setLoading(true);
    try {
      // Request Payment URL form Backend
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
          branchId: branchId,
          paymentMethod: selectedMethod // Send selected method
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.details || "Gagal memproses pembayaran");
      }

      // Redirect to Duitku Payment Page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      } else {
        alert("Gagal mendapatkan URL pembayaran");
        setLoading(false);
      }
    }
    catch (error: any) {
      console.error(error);
      alert(error.message || "Terjadi kesalahan sistem");
      setLoading(false);
    }
  };

  const baseClass = "w-full py-4 font-bold tracking-widest uppercase transition-colors rounded-xl shadow-lg";
  const stateClass = (disabled || loading || isProcessing)
    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
    : "bg-[#E64A19] text-white hover:bg-white hover:text-[#E64A19] border-2 border-transparent hover:border-[#E64A19]";

  return (
    <>
      {/* Payment Selection Modal */}
      {showModal && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white dark:bg-neutral-900 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-gray-200 dark:border-neutral-800 flex justify-between items-center">
              <h3 className="font-bold text-lg">Pilih Pembayaran</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-red-500">
                ✕
              </button>
            </div>
            <div className="p-4 overflow-y-auto space-y-2">
              {paymentMethods.map((method: any) => (
                <button
                  key={method.paymentMethod}
                  onClick={() => handlePayment(method.paymentMethod)}
                  className="w-full flex items-center gap-4 p-3 rounded-xl border border-gray-200 dark:border-neutral-800 hover:bg-orange-50 dark:hover:bg-neutral-800 transition-colors text-left"
                >
                  <img src={method.paymentImage} alt={method.paymentName} className="h-8 w-12 object-contain" />
                  <div>
                    <div className="font-bold text-sm">{method.paymentName}</div>
                    <div className="text-xs text-gray-500">Biaya: Rp {method.totalFee.toLocaleString()}</div>
                  </div>
                </button>
              ))}
              {paymentMethods.length === 0 && (
                <p className="text-center text-gray-500 py-8">Tidak ada metode pembayaran tersedia.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {isProcessing && (
        <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-md flex flex-col items-center justify-center text-white">
          <div className="w-16 h-16 border-4 border-[#FBC02D] border-t-transparent rounded-full animate-spin mb-4"></div>
          <h2 className="text-xl font-black uppercase tracking-widest animate-pulse">Processing Ticket...</h2>
          <p className="text-sm font-mono text-neutral-400 mt-2">Mohon tunggu sebentar, tiket sedang dibuat.</p>
        </div>
      )}
      <button
        onClick={handleInitialClick}
        disabled={disabled || loading || isProcessing}
        className={`${baseClass} ${stateClass}`}
      >
        {loading || isProcessing ? "MEMPROSES..." : "PAY NOW"}
      </button>
    </>
  );
}