'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Printer } from 'lucide-react';

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
  const [hasAutoPrinted, setHasAutoPrinted] = useState(false);
  const [closeTimer, setCloseTimer] = useState<number>(20);

  useEffect(() => {
    if (orderId) {
      const fetchOrder = async () => {
        try {
          const res = await fetch(`/api/order/${orderId}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch order: ${res.statusText}`);
          }
          const data: Order = await res.json();
          // Pastikan items adalah array
          data.items = typeof data.items === 'string' ? JSON.parse(data.items) : data.items;
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

  // --- RECEIPT GENERATOR ---
  const generateReceiptText = (orderData: Order) => {
    const WIDTH = 32;
    const formatLine = (left: string, right: string) => {
      const space = WIDTH - left.length - right.length;
      return left + ' '.repeat(Math.max(0, space)) + right + '\n';
    };

    const centerLine = (text: string) => {
      const space = Math.max(0, Math.floor((WIDTH - text.length) / 2));
      return ' '.repeat(space) + text + '\n';
    };

    const separator = '-'.repeat(WIDTH) + '\n';

    const receiptDate = new Date(orderData.createdAt).toLocaleString('id-ID', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    let commands = '';

    commands += centerLine('TITIK NOL CAFE');
    commands += centerLine('Jl. Semangka No. 8, Palu');
    commands += centerLine('0812-3456-7890');
    commands += separator;

    commands += `NO: #${orderData.id.slice(-6).toUpperCase()}\n`;
    commands += `TGL: ${receiptDate}\n`;
    commands += `SVR: ${orderData.customerName.substring(0, 20)}\n`;
    commands += separator;

    orderData.items.forEach(item => {
      commands += `${item.qty}x ${item.name.substring(0, 28)}\n`;
      commands += formatLine('', `Rp ${parseInt(String(item.price * item.qty)).toLocaleString('id-ID')}`);
    });

    commands += separator;

    commands += formatLine('TOTAL', `Rp ${orderData.totalAmount.toLocaleString('id-ID')}`);
    commands += formatLine('PAYMENT', orderData.paymentType);

    commands += separator;
    commands += centerLine('TERIMA KASIH');
    commands += centerLine('Selamat Menikmati');
    commands += '\n\n\n';

    return commands;
  };

  const generateRawBTUrl = (orderData: Order) => {
    const commands = generateReceiptText(orderData);
    const base64Data = btoa(commands);
    // Intent standard (JSON payload not required for basic intent, string data is fine)
    return `intent:base64,${base64Data}#Intent;scheme=rawbt;package=ru.a402d.rawbtprinter;end;`;
  };

  // --- PRINT HANDLERS ---
  const handleRawBTPrint = () => {
    if (!order) return;
    const url = generateRawBTUrl(order);
    window.location.href = url;
  };

  // --- AUTO INTENT & AUTO CLOSE ---
  useEffect(() => {
    if (order && !isLoading && !error && !hasAutoPrinted) {
      setHasAutoPrinted(true);

      // 1. Auto Trigger RawBT Intent
      const url = generateRawBTUrl(order);
      window.location.href = url;

      // 2. Start Countdown to Close Tab
      const interval = setInterval(() => {
        setCloseTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            window.close();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [order, isLoading, error, hasAutoPrinted]);


  if (isLoading) return <div className="text-center p-10 font-bold">Memuat Struk...</div>;
  if (error) return <div className="text-center p-10 text-red-500 font-bold">Error: {error}</div>;
  if (!order) return <div className="text-center p-10 font-bold">Struk tidak ditemukan.</div>;

  const receiptDate = new Date(order.createdAt).toLocaleString('id-ID', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-100 p-4 flex flex-col items-center">
      {/* Tombol Print Controls */}
      <div className="flex gap-4 mb-6 print:hidden w-full max-w-sm">
        <button
          onClick={handleRawBTPrint}
          className="flex-1 bg-[#552CB7] text-white py-3 rounded-xl font-black shadow-lg hover:scale-105 transition-transform flex items-center justify-center gap-2"
        >
          <Printer size={20} /> PRINT RAW BT
        </button>
        <button
          onClick={() => window.print()}
          className="bg-white text-black border-2 border-black py-3 px-6 rounded-xl font-bold hover:bg-gray-50 transition-colors"
        >
          Browser Print
        </button>
      </div>

      <div className="bg-[#FFBF00]/10 border border-[#FFBF00] p-4 rounded-xl mb-6 text-center text-sm print:hidden max-w-sm">
        <p className="font-bold">Mode: Auto-Intent & Auto-Close</p>
        <p className="text-xs mt-1">Struk dikirim ke RawBT otomatis.</p>
        <p className="text-xs font-mono mt-2 text-red-600">Tab ini akan tertutup otomatis dalam {closeTimer} detik.</p>
      </div>

      {/* Tampilan HTML (Preview & Browser Print) */}
      <div className="bg-white p-4 w-full max-w-[300px] shadow-sm print:shadow-none print:w-full">
        <div className="text-center mb-4">
          <h1 className="font-black text-lg uppercase tracking-tight">TITIK NOL</h1>
          <p className="text-xs font-medium text-gray-500">Jl. Semangka No 8, Palu</p>
          <p className="text-xs font-medium text-gray-500">Telp: 0812-3456-7890</p>
          <div className="border-b-2 border-dashed border-gray-300 my-2"></div>
        </div>

        <div className="space-y-1 mb-4 text-xs font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">NO</span>
            <span className="font-bold">#{order.id.slice(-6).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">TGL</span>
            <span className="font-bold">{receiptDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">SVR</span>
            <span className="font-bold uppercase">{order.customerName}</span>
          </div>
          <div className="border-b-2 border-dashed border-gray-300 my-2"></div>
        </div>

        <div className="space-y-3 mb-4 text-xs font-mono">
          {order.items.map((item, index) => (
            <div key={index}>
              <div className="font-bold uppercase">{item.name}</div>
              <div className="flex justify-between text-gray-600">
                <span>{item.qty} x {item.price.toLocaleString('id-ID')}</span>
                <span className="font-bold text-black">{(item.price * item.qty).toLocaleString('id-ID')}</span>
              </div>
            </div>
          ))}
          <div className="border-b-2 border-dashed border-gray-300 my-2"></div>
        </div>

        <div className="text-xs font-mono">
          <div className="flex justify-between font-black text-sm mb-1">
            <span>TOTAL</span>
            <span>Rp {order.totalAmount.toLocaleString('id-ID')}</span>
          </div>
          <div className="flex justify-between text-gray-500 mb-4">
            <span>Payment</span>
            <span className="font-bold uppercase">{order.paymentType}</span>
          </div>
        </div>

        <div className="text-center mt-6 text-xs text-gray-400 font-medium">
          <p className="font-bold text-black mb-1">TERIMA KASIH</p>
          <p>Selamat Menikmati</p>
        </div>
      </div>
    </div>
  );
}
