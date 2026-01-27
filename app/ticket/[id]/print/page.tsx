'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export const runtime = 'edge';

type OrderItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
};

type Order = {
  id: string;
  customerName: string;
  whatsapp: string;
  totalAmount: number;
  items: OrderItem[];
  paymentType: string;
  createdAt: string;
};

export default function PrintReceiptPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const res = await fetch(`/api/order/${orderId}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch order: ${res.statusText}`);
          }
          const data: Order = await res.json();
          // Pastikan items adalah array, karena di DB disimpan sebagai Json
          data.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items; // ensure it's a proper array of objects
          setOrder(data);
        } catch (err: any) {
          console.error(err);
          setError(err.message || 'Failed to load order details.');
        } finally {
          setIsLoading(false);
        }
      };
      fetchOrder();
    }
  }, [orderId]);

  useEffect(() => {
    // Otomatis cetak setelah order dimuat
    if (order && !isLoading && !error) {
      window.print();
      // Opsional: Tutup window setelah cetak atau kembali ke POS
      // window.close(); 
    }
  }, [order, isLoading, error]);

  if (isLoading) {
    return <div className="text-center p-4">Memuat Struk...</div>;
  }

  if (error) {
    return <div className="text-center p-4 text-red-500">Error: {error}</div>;
  }

  if (!order) {
    return <div className="text-center p-4">Struk tidak ditemukan.</div>;
  }

  // Format tanggal dan waktu
  const receiptDate = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="max-w-xs mx-auto p-4 bg-white font-mono text-xs print:text-black">
      <div className="text-center mb-4">
        <h1 className="text-sm font-bold">TITIK NOL CAFE</h1>
        <p>Jl. Contoh No. 123, Kota Contoh</p>
        <p>Telp: 0812-3456-7890</p>
        <hr className="my-2 border-dashed border-gray-400" />
      </div>

      <div className="mb-4">
        <p>Order ID: {order.id.slice(-8).toUpperCase()}</p>
        <p>Tanggal: {receiptDate}</p>
        <p>Pelanggan: {order.customerName}</p>
        <hr className="my-2 border-dashed border-gray-400" />
      </div>

      <div className="mb-4">
        {order.items.map((item, index) => (
          <div key={index} className="flex justify-between">
            <span>{item.qty}x {item.name}</span>
            <span>Rp{(item.price * item.qty).toLocaleString('id-ID')}</span>
          </div>
        ))}
        <hr className="my-2 border-dashed border-gray-400" />
        <div className="flex justify-between font-bold text-sm mt-2">
          <span>TOTAL</span>
          <span>Rp{order.totalAmount.toLocaleString('id-ID')}</span>
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span>Pembayaran</span>
          <span>{order.paymentType}</span>
        </div>
        <hr className="my-2 border-dashed border-gray-400" />
      </div>

      <div className="text-center">
        <p>Terima Kasih!</p>
        <p>Selamat menikmati.</p>
      </div>
    </div>
  );
}
