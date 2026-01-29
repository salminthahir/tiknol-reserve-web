'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Trash2, X, ShoppingBag, Ticket, ChevronDown, ChevronUp } from 'lucide-react';
import PosSkeleton from '@/app/components/skeletons/PosSkeleton';

// --- DEKLARASI GLOBAL TYPE ---
// Agar TypeScript mengenali window.snap dari Midtrans
declare global {
  interface Window {
    snap: any;
  }
}

// --- TIPE DATA ---
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image: string;
};

type CartItem = Product & { qty: number };

export default function POSPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState<'name' | 'price_asc' | 'price_desc'>('name');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [customerPosName, setCustomerPosName] = useState(''); // STATE BARU: Nama pelanggan opsional
  const router = useRouter();

  // STATE BARU: Untuk mengontrol tampilan Cart di Mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // STATE BARU: Order Type (DINE_IN atau TAKE_AWAY)
  const [orderType, setOrderType] = useState<'DINE_IN' | 'TAKE_AWAY'>('DINE_IN');

  // STATE VOUCHER: Voucher system
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);
  const [isVoucherExpanded, setIsVoucherExpanded] = useState(false);


  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          // Filter products that are available
          setProducts(data.filter((p: any) => p.isAvailable));
        }
      } catch (err: any) {
        console.error(err);
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, []);


  // --- LOGIC CART ---
  const addToCart = (product: Product) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === product.id);
      if (existing) {
        return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, { ...product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.map((item) => item.id === productId ? { ...item, qty: item.qty - 1 } : item).filter((item) => item.qty > 0));
  };

  const clearCart = () => { // FUNGSI BARU: Hapus semua isi keranjang
    setCart([]);
    // Clear voucher data
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherError(null);
  };

  const grandTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // Calculate final total with voucher discount
  const subtotal = grandTotal;
  const finalTotal = Math.max(0, grandTotal - voucherDiscount);

  // --- VOUCHER VALIDATION ---
  const validateVoucher = async () => {
    if (!voucherCode.trim()) {
      setVoucherError('Masukkan kode voucher');
      return;
    }

    if (cart.length === 0) {
      setVoucherError('Keranjang masih kosong');
      return;
    }

    setIsValidatingVoucher(true);
    setVoucherError(null);

    try {
      const res = await fetch('/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: voucherCode.toUpperCase(),
          cartTotal: grandTotal,
          items: cart.map(item => ({ id: item.id, qty: item.qty }))
        })
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedVoucher(data.voucher);
        setVoucherDiscount(data.discount);
        setVoucherError(null);
      } else {
        setVoucherError(data.message || 'Voucher tidak valid');
        setAppliedVoucher(null);
        setVoucherDiscount(0);
      }
    } catch (error) {
      console.error('Voucher validation error:', error);
      setVoucherError('Gagal validasi voucher');
      setAppliedVoucher(null);
      setVoucherDiscount(0);
    } finally {
      setIsValidatingVoucher(false);
    }
  };

  const removeVoucher = () => {
    setVoucherCode('');
    setAppliedVoucher(null);
    setVoucherDiscount(0);
    setVoucherError(null);
  };

  // --- LOGIC PEMBAYARAN ---
  const handlePayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);

    try {
      const orderPayload = {
        customerName: customerPosName || "Customer POS",
        whatsapp: "N/A",
        orderType: orderType,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
        voucherId: appliedVoucher?.id || null,
        subtotal: grandTotal,
        discountAmount: voucherDiscount
      };

      // 2. Request Snap token from your API
      const res = await fetch('/api/tokenizer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to get Snap Token: ${res.status}`);
      }

      const data = await res.json();
      const transactionToken = data.token;

      // 3. Open Midtrans Snap pop-up
      if (window.snap) {
        window.snap.pay(transactionToken, {
          onSuccess: async function (result: any) {
            // PERBAIKAN DI SINI: Menggunakan result.order_id dari response Midtrans
            router.push(`/ticket/${result.order_id}/print`);
            setCart([]); // Clear cart after successful payment
            setCustomerPosName(''); // Clear customer name
            setIsProcessingPayment(false);
          },
          onPending: function (result: any) {
            alert("Payment Pending! " + result.transaction_id);
            setIsProcessingPayment(false);
          },
          onError: function (result: any) {
            alert("Payment Error! " + result.transaction_id);
            setIsProcessingPayment(false);
          },
          onClose: function () {
            alert('You closed the popup without finishing the payment');
            setIsProcessingPayment(false);
          }
        });
      } else {
        alert("Midtrans Snap is not loaded. Please try again.");
        setIsProcessingPayment(false);
      }
    } catch (err: any) {
      console.error("Payment failed:", err);
      alert(`Payment failed: ${err.message || 'Unknown error'}`);
      setIsProcessingPayment(false);
    }
  };

  const handleCashPayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);

    try {
      const orderData = {
        customerName: customerPosName || "Customer POS",
        whatsapp: "N/A",
        orderType: orderType,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty,
        })),
        totalAmount: finalTotal,
        voucherId: appliedVoucher?.id || null,
        subtotal: grandTotal,
        discountAmount: voucherDiscount
      };

      const res = await fetch('/api/cash-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || `Failed to process cash payment: ${res.status}`);
      }

      const newOrder = await res.json(); // Assuming the API returns the created order object

      alert(`Pembayaran Tunai Berhasil! Pesanan ID: ${newOrder.id}`);
      window.open(`/ticket/${newOrder.id}/print`, '_blank'); // Open print page in new tab
      setCart([]); // Clear cart after successful payment
      setCustomerPosName(''); // Clear customer name
      setIsProcessingPayment(false);

    } catch (err: any) {
      console.error("Cash payment failed:", err);
      alert(`Pembayaran tunai gagal: ${err.message || 'Terjadi kesalahan'}`);
      setIsProcessingPayment(false);
    }
  };

  // --- FILTERING ---
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  if (isLoading) return <PosSkeleton />;

  return (
    <>
      <Script
        src="https://app.sandbox.midtrans.com/snap/snap.js"
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY}
        strategy="lazyOnload"
      />

      {/* LAYOUT UTAMA: Optimized Floating */}
      <div className="flex h-[100dvh] bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] font-sans text-black overflow-hidden flex-col lg:flex-row relative p-2 lg:p-3 gap-3">

        {/* === BAGIAN KIRI: MENU === */}
        <div className="flex-1 flex flex-col w-full h-full">

          {/* Header Mobile/Desktop - Sticky Compact */}
          <div className="sticky top-0 z-20 bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] flex flex-col gap-2.5 shrink-0 border border-gray-100 transition-all duration-300 p-3.5 mb-3">



            <div className="flex justify-between items-center px-1">
              <h1 className="text-xl font-black italic tracking-tighter uppercase text-black">
                <span className="text-[#FD5A46] text-2xl">.</span>NOL <span className="text-[#552CB7]">POS</span> <span className="text-gray-600 font-normal text-sm">System</span>
              </h1>
              <div className="flex gap-2">
                <Link href="/admin/menu" className="font-black text-[10px] bg-[#FFC567] text-black border-2 border-black px-3 py-1.5 rounded-full shadow-[1px_1px_0px_black] hover:translate-y-[1px] hover:shadow-none transition-all">MENU</Link>
                <Link href="/admin/dashboard" className="font-black text-[10px] bg-[#00995E] text-white border-2 border-black px-3 py-1.5 rounded-full shadow-[1px_1px_0px_black] hover:translate-y-[1px] hover:shadow-none transition-all">KITCHEN</Link>
              </div>
            </div>


            {/* Search & Filter - Compact */}
            <div className="flex flex-col gap-2">

              {/* Search Bar - Compact */}
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="text-black"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </div>
                <input
                  type="text"
                  placeholder="Cari menu..."
                  className="w-full bg-white border border-gray-200 text-sm py-2 pl-10 pr-4 rounded-xl focus:outline-none focus:border-[#552CB7] focus:bg-[#FAFBFF] shadow-[0_1px_3px_rgba(0,0,0,0.08)] focus:shadow-[0_2px_8px_rgba(85,44,183,0.12)] transition-all duration-200 placeholder:text-gray-400 font-medium"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>

              {/* Sorting & Categories Row */}
              <div className="flex flex-col gap-2">
                {/* Sort Controls - Compact */}
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                  <button
                    onClick={() => setSortBy('name')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${sortBy === 'name'
                      ? 'bg-[#552CB7] text-white border-[#552CB7] shadow-[0_4px_12px_rgba(85,44,183,0.4),0_2px_4px_rgba(0,0,0,0.1)]'
                      : 'bg-white text-gray-600 border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5'
                      }`}
                  >
                    A-Z
                  </button>
                  <button
                    onClick={() => setSortBy('price_asc')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${sortBy === 'price_asc'
                      ? 'bg-[#00995E] text-white border-[#00995E] shadow-[0_4px_12px_rgba(0,153,94,0.4),0_2px_4px_rgba(0,0,0,0.1)]'
                      : 'bg-white text-gray-600 border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5'
                      }`}
                  >
                    MURAH
                  </button>
                  <button
                    onClick={() => setSortBy('price_desc')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${sortBy === 'price_desc'
                      ? 'bg-[#FD5A46] text-white border-[#FD5A46] shadow-[0_4px_12px_rgba(253,90,70,0.4),0_2px_4px_rgba(0,0,0,0.1)]'
                      : 'bg-white text-gray-600 border-gray-200 shadow-[0_2px_6px_rgba(0,0,0,0.06)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.1)] hover:-translate-y-0.5'
                      }`}
                  >
                    MAHAL
                  </button>
                </div>

                {/* Categories - Compact Pills */}
                <div className="flex gap-1 overflow-x-auto -mx-4 px-4 scrollbar-hide snap-x">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`
                         snap-center shrink-0 px-4 py-1.5 rounded-full font-black text-[11px] tracking-wide border-2 border-black transition-all
                         ${activeCategory === cat
                          ? 'bg-[#FFC567] text-black shadow-[2px_2px_0px_black] -translate-y-[1px]'
                          : 'bg-white text-gray-700 hover:bg-gray-50 shadow-[1px_1px_0px_gray] active:shadow-none active:translate-y-[1px]'
                        }
                       `}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Grid Produk - Compact 3 Cols */}
          <div className="flex-1 p-3 lg:p-4 overflow-y-auto pb-24 lg:pb-6 scrollbar-hide">
            {isLoading ? (
              <div className="flex items-center justify-center h-full flex-col gap-4">
                <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                <p className="font-black text-xl animate-pulse tracking-widest">LOADING...</p>
              </div>
            ) : (
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 lg:gap-3">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    onClick={() => addToCart(product)}
                    className="
                      group relative bg-white border-2 border-black rounded-xl cursor-pointer 
                      transition-all duration-300
                      hover:-translate-y-1 hover:shadow-[4px_4px_0px_#552CB7]
                      active:translate-y-0 active:shadow-none active:scale-95
                      shadow-[2px_2px_0px_black]
                      overflow-hidden
                      flex flex-col
                    "
                  >
                    {/* Image Container - Floating */}
                    <div className="h-24 lg:h-32 w-full bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center overflow-hidden relative shrink-0">
                      <Image
                        src={product.image || '/placeholder.svg'}
                        alt={product.name}
                        fill
                        sizes="(max-width: 768px) 33vw, 20vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      {/* Price Badge - Floating with Glow */}
                      <div className="absolute top-2 right-2 bg-[#FD5A46] text-white border-none px-3 py-1.5 rounded-xl font-bold text-xs shadow-[0_4px_12px_rgba(253,90,70,0.5),0_2px_4px_rgba(0,0,0,0.2),0_0_20px_rgba(253,90,70,0.3)] group-hover:shadow-[0_6px_16px_rgba(253,90,70,0.6),0_0_24px_rgba(253,90,70,0.4)] transition-shadow">
                        {(product.price / 1000)}K
                      </div>
                    </div>

                    {/* Content - Compact */}
                    <div className="p-2.5 flex flex-col items-center text-center gap-1 flex-1 justify-center">
                      <h3 className="font-black text-[10px] lg:text-xs leading-tight uppercase line-clamp-2 text-black w-full">
                        {product.name}
                      </h3>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div >

        {/* === TOMBOL FLOATING (HANYA HP) === */}
        {
          cart.length > 0 && (
            <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
              <button
                onClick={() => setIsMobileCartOpen(true)}
                className="w-full bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white shadow-[0_4px_16px_rgba(85,44,183,0.4),0_8px_24px_rgba(85,44,183,0.2)] py-4 px-6 flex justify-between items-center font-bold text-base rounded-2xl active:scale-95 active:shadow-[0_2px_8px_rgba(85,44,183,0.3)] transition-all hover:shadow-[0_6px_20px_rgba(85,44,183,0.5),0_12px_32px_rgba(85,44,183,0.3)] hover:-translate-y-1"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <ShoppingBag size={24} strokeWidth={2.5} />
                    <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#FD5A46] text-white rounded-full flex items-center justify-center text-xs font-black border-2 border-white">
                      {totalItems}
                    </span>
                  </div>
                  <span className="uppercase tracking-wider">PAY</span>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-xs opacity-80 font-medium">Total</span>
                  <span className="text-xl font-black">Rp {grandTotal.toLocaleString()}</span>
                </div>
              </button>
            </div>
          )
        }

        {/* === BAGIAN KANAN: CART / INVOICE (FLOATING HYBRID) === */}
        <div className={`
            bg-white flex flex-col z-50 transition-transform duration-300 rounded-3xl overflow-hidden
            shadow-[0_4px_16px_rgba(0,0,0,0.08),0_12px_40px_rgba(0,0,0,0.1)]
            ${isMobileCartOpen ? 'fixed inset-0 translate-y-0 rounded-none' : 'fixed inset-0 translate-y-[100%]'} 
            lg:static lg:translate-y-0 lg:w-[420px] lg:flex lg:shrink-0
        `}>
          {/* Header Invoice - Soft Yellow */}
          <div className="p-6 bg-[#FFC567] border-b border-black/10 flex justify-between items-start shrink-0 relative overflow-hidden">
            <div className="relative z-10 flex-1">
              <h2 className="font-black text-2xl tracking-tighter uppercase text-black italic drop-shadow-sm">ORDER LIST</h2>
              <div className="flex items-center gap-2 mt-2">
                <span className="bg-black text-white px-2 py-0.5 text-[10px] font-bold rounded-sm">#{new Date().getTime().toString().slice(-6)}</span>
                <div className="flex gap-1">
                  <button
                    onClick={() => setOrderType('DINE_IN')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg border-2 border-black transition-all ${orderType === 'DINE_IN'
                      ? 'bg-[#00995E] text-white shadow-[2px_2px_0px_black]'
                      : 'bg-white text-gray-600 shadow-[1px_1px_0px_black] hover:shadow-[2px_2px_0px_black] active:translate-y-[1px] active:shadow-none'
                      }`}
                  >
                    DINE IN
                  </button>
                  <button
                    onClick={() => setOrderType('TAKE_AWAY')}
                    className={`px-2.5 py-1 text-[10px] font-black rounded-lg border-2 border-black transition-all ${orderType === 'TAKE_AWAY'
                      ? 'bg-[#FD5A46] text-white shadow-[2px_2px_0px_black]'
                      : 'bg-white text-gray-600 shadow-[1px_1px_0px_black] hover:shadow-[2px_2px_0px_black] active:translate-y-[1px] active:shadow-none'
                      }`}
                  >
                    TAKE AWAY
                  </button>
                </div>
              </div>
            </div>


            <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden text-white z-10 bg-[#FD5A46] p-2.5 rounded-full border-2 border-black shadow-[3px_3px_0px_black] active:translate-y-[2px] active:shadow-none hover:bg-[#FF6B55] transition-all ml-3" aria-label="Close cart">
              <X size={20} />
            </button>

            {cart.length > 0 && (
              <button
                onClick={clearCart}
                className="hidden lg:flex z-10 bg-[#FD5A46] text-white px-3 py-1.5 rounded-lg border-2 border-black shadow-[2px_2px_0px_black] active:shadow-none active:translate-y-[1px] text-xs font-black items-center gap-1 hover:bg-[#FF6B55] transition-all"
              >
                <Trash2 size={14} /> RESET
              </button>
            )}
          </div>

          {/* List Item Cart */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white relative">


            {/* Input Nama - Retro Style */}
            {cart.length > 0 && (
              <div className="relative z-10 flex items-center gap-0">
                <div className="bg-black text-white p-3 border-y-2 border-l-2 border-black rounded-l-xl">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                </div>
                <input
                  type="text"
                  placeholder="NAMA PELANGGAN..."
                  className="w-full bg-[#FFF8E7] border-2 border-black p-2.5 font-bold focus:outline-none focus:bg-[#FFC567] rounded-r-xl placeholder:text-gray-400 uppercase text-sm"
                  value={customerPosName}
                  onChange={(e) => setCustomerPosName(e.target.value)}
                />
              </div>
            )}

            {cart.map((item) => (
              <div key={item.id} className="relative z-10 flex gap-3 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_black] hover:translate-x-[1px] transition-transform">
                {/* Thumbnail */}
                <div className="w-14 h-14 bg-gray-100 border-2 border-black rounded-lg shrink-0 overflow-hidden">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} width={56} height={56} className="object-cover w-full h-full" />
                  ) : (
                    <span className="text-gray-300 font-bold text-xs flex items-center justify-center h-full">IMG</span>
                  )}
                </div>

                <div className="flex-1 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <h4 className="font-black text-sm uppercase leading-tight line-clamp-1">{item.name}</h4>
                    <span className="font-bold text-sm">{(item.price * item.qty).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[10px] font-bold text-gray-500">@{item.price.toLocaleString()}</p>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-[#FD5A46] hover:text-white border border-black rounded font-black text-sm transition-colors">-</button>
                      <span className="w-6 text-center font-black text-sm">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-6 h-6 flex items-center justify-center bg-black text-white hover:bg-[#00995E] border border-black rounded font-black text-sm transition-colors">+</button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-50">
                <div className="w-24 h-24 bg-gray-100 rounded-full border-4 border-dashed border-black flex items-center justify-center">
                  <ShoppingBag size={40} className="text-black" />
                </div>
                <div>
                  <h3 className="font-black text-xl uppercase">Start Ordering</h3>
                  <p className="text-xs font-bold font-mono">SELECT ITEMS FROM MENU</p>
                </div>
              </div>
            )}
          </div>


          {/* Voucher Section - Collapsible */}
          {cart.length > 0 && (
            <div className="px-4 pb-3 shrink-0">
              {!appliedVoucher ? (
                // Collapsed/Expandable state
                <>
                  {!isVoucherExpanded ? (
                    // Compact button
                    <button
                      onClick={() => setIsVoucherExpanded(true)}
                      className="w-full bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] hover:from-[#6B3FD9] hover:to-[#7B4FE9] text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all border-2 border-black shadow-[2px_2px_0px_black] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] flex items-center justify-center gap-2"
                    >
                      <Ticket size={18} />
                      <span>Apply Voucher Code</span>
                      <ChevronDown size={16} />
                    </button>
                  ) : (
                    // Expanded input form
                    <div className="bg-white rounded-xl border-2 border-gray-300 overflow-hidden">
                      <div className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] px-3 py-2 flex justify-between items-center">
                        <span className="text-xs font-black text-white uppercase tracking-wider">Voucher Code</span>
                        <button
                          onClick={() => {
                            setIsVoucherExpanded(false);
                            setVoucherError(null);
                          }}
                          className="text-white hover:bg-white/20 p-1 rounded transition-all"
                        >
                          <ChevronUp size={16} />
                        </button>
                      </div>
                      <div className="p-3">
                        <div className="flex gap-2 mb-2">
                          <input
                            type="text"
                            value={voucherCode}
                            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                            onKeyPress={(e) => e.key === 'Enter' && validateVoucher()}
                            placeholder="PROMO10"
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#552CB7] font-mono font-bold text-sm uppercase"
                            disabled={isValidatingVoucher}
                            autoFocus
                          />
                          <button
                            onClick={validateVoucher}
                            disabled={isValidatingVoucher || !voucherCode.trim()}
                            className="px-4 py-2 bg-[#552CB7] hover:bg-[#6B3FD9] text-white font-bold rounded-lg text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed border-2 border-black"
                          >
                            {isValidatingVoucher ? '...' : 'Apply'}
                          </button>
                        </div>
                        {voucherError && (
                          <div className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-300">
                            {voucherError}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Applied voucher display (always visible)
                <div className="bg-green-50 border-2 border-green-400 rounded-xl p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2 flex-1">
                      <Ticket size={16} className="text-green-700" />
                      <div className="flex-1">
                        <div className="text-xs font-bold text-green-700 mb-0.5">VOUCHER APPLIED</div>
                        <div className="font-black text-sm font-mono text-green-900">{appliedVoucher.code}</div>
                      </div>
                    </div>
                    <button
                      onClick={removeVoucher}
                      className="p-1 hover:bg-green-200 rounded transition-all"
                      title="Remove voucher"
                    >
                      <X size={16} className="text-green-700" />
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="text-xs text-green-700">{appliedVoucher.name}</div>
                    <div className="text-sm font-black text-green-900">
                      - Rp {voucherDiscount.toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Payment Footer - Dark Highlight */}
          <div className="p-6 bg-gradient-to-br from-[#1A1A2E] to-[#16213E] border-t border-white/10 space-y-4 shrink-0 relative z-20">
            {/* Serrated Edge Decoration (CSS Trick equivalent) could be complex, sticking to border-t-4 */}

            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                <span>Subtotal</span>
                <span className="text-white">Rp {grandTotal.toLocaleString()}</span>
              </div>

              {voucherDiscount > 0 && (
                <div className="flex justify-between text-xs font-bold text-green-400 uppercase">
                  <span>Discount</span>
                  <span className="text-green-300">- Rp {voucherDiscount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-xs font-bold text-gray-400 uppercase">
                <span>Tax (0%)</span>
                <span className="text-white">Rp 0</span>
              </div>

              <div className="my-3 border-b-2 border-white/20 border-dashed"></div>

              <div className="flex justify-between items-center">
                <span className="font-black text-xl uppercase italic text-white">Total</span>
                <span className="font-black text-3xl text-black bg-[#FFC567] px-3 py-1 rounded-lg border-2 border-black shadow-[3px_3px_0px_black]">
                  Rp {finalTotal.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={handleCashPayment}
                disabled={isProcessingPayment || cart.length === 0}
                className="py-4 font-black bg-white text-black border border-white/20 shadow-[0_4px_12px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50 text-sm hover:shadow-[0_6px_16px_rgba(255,255,255,0.3)] rounded-xl"
              >
                CASH
              </button>
              <button
                onClick={handlePayment}
                disabled={isProcessingPayment || cart.length === 0}
                className="py-4 font-black bg-gradient-to-r from-[#00995E] to-[#00B870] text-white border border-white/20 shadow-[0_4px_12px_rgba(0,153,94,0.4)] active:scale-95 transition-all disabled:opacity-50 text-sm hover:shadow-[0_6px_16px_rgba(0,153,94,0.5)] rounded-xl flex flex-col items-center justify-center leading-none gap-1"
              >
                <span>PAY NOW</span>
                <span className="text-[9px] opacity-80 font-mono">QRIS / DEBIT</span>
              </button>
            </div>
          </div>
        </div>
      </div >
    </>
  );
}