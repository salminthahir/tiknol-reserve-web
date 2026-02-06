'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import Script from 'next/script';
import { Search, ShoppingBag, Trash2, X, Plus, Minus, CreditCard, Banknote, Ticket, ChevronDown, ChevronUp, Loader2, Printer } from 'lucide-react';
import PosSkeleton from '@/app/components/skeletons/PosSkeleton';
import { motion, AnimatePresence } from 'framer-motion';


import { generateRawBTUrl } from '@/app/utils/receiptGenerator';

// --- TIPE DATA ---
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image: string;
  hasCustomization?: boolean;
  customizationOptions?: {
    temps: string[];
    sizes: string[];
  };
};

type CartItem = Product & {
  qty: number;
  selectedTemp?: string; // Menyimpan temp yang dipilih (e.g., "ICE")
  selectedSize?: string; // Menyimpan size yang dipilih (e.g., "REGULAR")
};



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

  // STATE BARU: Success Modal Data
  const [successModal, setSuccessModal] = useState<any | null>(null);

  // TRIGGER AUTO PRINT SAAT MODAL SUKSES MUNCUL
  useEffect(() => {
    if (successModal) {
      // Auto trigger print setelah jeda singkat
      const timer = setTimeout(() => {
        const url = generateRawBTUrl(successModal);
        window.location.href = url;
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [successModal]);

  // STATE BARU: Confirmation Modal
  const [confirmModal, setConfirmModal] = useState<{ open: boolean; type: 'CASH' | 'ONLINE' | null }>({ open: false, type: null });

  // STATE BARU: Customization In-Context (Card Overlay)
  const [activeCustomization, setActiveCustomization] = useState<{
    productId: string | null;
    temp: string | null;
    size: string | null;
  }>({ productId: null, temp: null, size: null });

  // STATE VOUCHER: Voucher system
  const [voucherCode, setVoucherCode] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherDiscount, setVoucherDiscount] = useState(0);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [isVoucherExpanded, setIsVoucherExpanded] = useState(false);
  const [isValidatingVoucher, setIsValidatingVoucher] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProducts = async () => {
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
  const addToCart = (product: Product, customization?: { temp: string | null, size: string | null }) => {
    // If product has customization and no customization provided
    if (product.hasCustomization && !customization) {

      // Check if this product is already active, if so, just close it (toggle behavior)
      if (activeCustomization.productId === product.id) {
        setActiveCustomization({ productId: null, temp: null, size: null });
        return;
      }

      // Initialize defaults
      const availableTemps = product.customizationOptions?.temps || ['ICE', 'HOT'];
      const availableSizes = product.customizationOptions?.sizes || ['REGULAR'];

      const defaultTemp = availableTemps.length > 0 ? availableTemps[0] : null;
      const defaultSize = availableSizes.length > 0 ? availableSizes[0] : 'REGULAR';

      setActiveCustomization({
        productId: product.id,
        temp: defaultTemp,
        size: defaultSize
      });
      return;
    }

    // Add to cart logic
    setCart((prev) => {
      // Unique key for cart item based on ID + Customizations
      const isMatch = (item: CartItem) =>
        item.id === product.id &&
        item.selectedTemp === (customization?.temp || undefined) &&
        item.selectedSize === (customization?.size || undefined);

      const existing = prev.find(isMatch);

      if (existing) {
        return prev.map((item) => isMatch(item) ? { ...item, qty: item.qty + 1 } : item);
      }
      return [...prev, {
        ...product,
        qty: 1,
        selectedTemp: customization?.temp || undefined,
        selectedSize: customization?.size || undefined
      }];
    });

    // Reset active customization after adding
    if (activeCustomization.productId === product.id) {
      setActiveCustomization({ productId: null, temp: null, size: null });
    }
  };

  const confirmCustomization = (product: Product) => {
    if (activeCustomization.productId !== product.id) return;

    addToCart(product, {
      temp: activeCustomization.temp,
      size: activeCustomization.size || 'REGULAR'
    });
  };

  const removeFromCart = (productId: string, temp?: string, size?: string) => {
    setCart((prev) => prev.map((item) => {
      if (item.id === productId && item.selectedTemp === temp && item.selectedSize === size) {
        return { ...item, qty: item.qty - 1 };
      }
      return item;
    }).filter((item) => item.qty > 0));
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
  const processOnlinePayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);
    setConfirmModal({ open: false, type: null }); // Close modal

    try {
      const orderPayload = {
        customerName: customerPosName || "Customer POS",
        whatsapp: "N/A",
        orderType: orderType,
        items: cart.map((item) => ({
          id: item.id,
          name: item.name + (item.selectedTemp || item.selectedSize ? ` (${[item.selectedTemp, item.selectedSize].filter(Boolean).join('/')})` : ''),
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
            // FLOW BARU: In-Page Success Modal (Auto Print Invisible)
            // Kita construct object successModal dari data lokal + result.order_id
            // karena di database order sudah dibuat via API tokenizer
            const orderForReceipt = {
              id: result.order_id,
              customerName: orderPayload.customerName,
              items: orderPayload.items, // Gunakan items dari payload yang sudah diformat
              totalAmount: finalTotal,
              createdAt: new Date().toISOString(),
              paymentType: 'QRIS',
              discountAmount: voucherDiscount
            };

            setSuccessModal(orderForReceipt);

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

  const processCashPayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);
    // setConfirmModal({ open: false, type: null }); // Jangan tutup modal dulu biar loading kelihatan

    try {
      const orderData = {
        customerName: customerPosName || "Customer POS",
        whatsapp: "N/A",
        orderType: orderType,
        items: cart.map(item => ({
          id: item.id,
          name: item.name + (item.selectedTemp || item.selectedSize ? ` (${[item.selectedTemp, item.selectedSize].filter(Boolean).join('/')})` : ''),
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

      const newOrder = await res.json();

      // Parse items if string (Prisma might return it as string depending on schema)
      if (typeof newOrder.items === 'string') {
        try {
          newOrder.items = JSON.parse(newOrder.items);
        } catch (e) {
          console.error("Failed to parse items:", e);
          newOrder.items = [];
        }
      }

      // Artificial Delay biar user lihat "Memproses..."
      await new Promise(resolve => setTimeout(resolve, 800));

      // FLOW BARU: In-Page Success Modal (Auto Print Invisible)
      setSuccessModal(newOrder);

      setCart([]);
      setCustomerPosName('');
      setConfirmModal({ open: false, type: null }); // Baru tutup modal
      setIsProcessingPayment(false);

    } catch (err: any) {
      console.error("Cash payment failed:", err);
      alert(`Pembayaran tunai gagal: ${err.message || 'Terjadi kesalahan'}`);
      setIsProcessingPayment(false);
      setConfirmModal({ open: false, type: null });
    }

  };

  // Helper untuk trigger modal
  const initiatePayment = (type: 'CASH' | 'ONLINE') => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setConfirmModal({ open: true, type });
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
                <Link href="/admin/kitchen-online" className="font-black text-[10px] bg-[#00995E] text-white border-2 border-black px-3 py-1.5 rounded-full shadow-[1px_1px_0px_black] hover:translate-y-[1px] hover:shadow-none transition-all">KITCHEN-On</Link>
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
              <motion.div
                layout
                className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 lg:gap-3 grid-flow-dense auto-rows-min"
              >
                <AnimatePresence>
                  {filteredProducts.map((product) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      key={product.id}
                      onClick={() => addToCart(product)}
                      className={`
                        group relative bg-white border-2 border-black rounded-xl cursor-pointer
                        shadow-[2px_2px_0px_black]
                        overflow-hidden
                        ${activeCustomization.productId === product.id
                          ? 'col-span-2 z-10 shadow-[8px_8px_0px_black] -translate-y-1'
                          : 'hover:-translate-y-1 hover:shadow-[4px_4px_0px_#552CB7] active:translate-y-0 active:shadow-none active:scale-95'}
                      `}
                    >
                      {/* Active State (Horizontal Layout) */}
                      {activeCustomization.productId === product.id ? (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.15 }} // Faster content fade-in
                          className="flex h-full w-full bg-white relative"
                        >
                          {/* Close Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCustomization({ productId: null, temp: null, size: null });
                            }}
                            className="absolute top-2 right-2 bg-white/80 hover:bg-white border-2 border-black p-1 rounded-full text-black z-50 hover:scale-110 transition-transform shadow-sm"
                          >
                            <X size={16} />
                          </button>

                          {/* Left: Image (40%) */}
                          <div className="w-[40%] relative shrink-0 border-r-2 border-black bg-gray-50">
                            <Image
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              fill
                              className="object-cover"
                            />
                            <div className="absolute top-2 left-2 bg-[#FD5A46] text-white px-2 py-0.5 rounded text-[10px] font-black shadow-sm">
                              {(product.price / 1000)}K
                            </div>
                          </div>

                          {/* Right: Customization (60%) */}
                          <div className="flex-1 p-3 flex flex-col justify-between" onClick={(e) => e.stopPropagation()}>
                            <div className="space-y-3 overflow-y-auto">
                              <h3 className="font-black text-sm uppercase leading-tight line-clamp-2">{product.name}</h3>

                              {/* Options Grid */}
                              <div className="space-y-2">
                                {/* TEMP & SIZE Combined Grid */}
                                <div className="grid grid-cols-2 gap-2">
                                  {/* Temp Options */}
                                  {product.customizationOptions?.temps?.map(t => {
                                    const isIce = t === 'ICE';
                                    const isHot = t === 'HOT';
                                    const isSelected = activeCustomization.temp === t;

                                    let baseColor = "bg-white text-black border-black hover:bg-gray-50";
                                    if (isSelected) {
                                      if (isIce) baseColor = "bg-[#E0F7FA] text-[#006064] border-[#006064] shadow-[2px_2px_0px_#006064]";
                                      else if (isHot) baseColor = "bg-[#FFEBEE] text-[#B71C1C] border-[#B71C1C] shadow-[2px_2px_0px_#B71C1C]";
                                      else baseColor = "bg-black text-white border-black shadow-[2px_2px_0px_#552CB7]";
                                    } else {
                                      if (isIce) baseColor = "bg-white text-[#00838F] border-[#00838F] hover:bg-[#E0F7FA]";
                                      else if (isHot) baseColor = "bg-white text-[#D32F2F] border-[#D32F2F] hover:bg-[#FFEBEE]";
                                    }

                                    return (
                                      <button
                                        key={t}
                                        onClick={() => setActiveCustomization(prev => ({ ...prev, temp: t }))}
                                        className={`py-2 text-[10px] font-black uppercase border-2 rounded-md transition-all flex items-center justify-center gap-1 ${baseColor}`}
                                      >
                                        {isIce && <span>❄️</span>}
                                        {isHot && <span>🔥</span>}
                                        {t}
                                      </button>
                                    );
                                  })}
                                  {/* Size Options */}
                                  {product.customizationOptions?.sizes?.map(s => (
                                    <button
                                      key={s}
                                      onClick={() => setActiveCustomization(prev => ({ ...prev, size: s }))}
                                      className={`py-2 text-[10px] font-black uppercase border-2 border-black rounded-md transition-colors ${activeCustomization.size === s ? 'bg-[#FFC567] shadow-[2px_2px_0px_black]' : 'bg-white hover:bg-gray-50'}`}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            <button
                              onClick={() => confirmCustomization(product)}
                              className="w-full bg-[#00995E] text-white py-2.5 mt-2 text-xs font-black uppercase rounded-lg border-2 border-black shadow-[2px_2px_0px_black] active:shadow-none active:translate-y-[2px] hover:brightness-110 transition-all"
                            >
                              ADD +
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        /* Inactive State (Standard Vertical) */
                        <div className="flex flex-col h-full">
                          <div className="h-24 lg:h-32 w-full bg-gray-50 relative shrink-0 border-b-2 border-black/5">
                            <Image
                              src={product.image || '/placeholder.svg'}
                              alt={product.name}
                              fill
                              sizes="(max-width: 768px) 33vw, 20vw"
                              className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute top-2 right-2 bg-[#FD5A46] text-white px-2 py-1 rounded-lg font-bold text-[10px] shadow-sm">
                              {(product.price / 1000)}K
                            </div>
                          </div>
                          <div className="p-2 flex items-center justify-center flex-1">
                            <h3 className="font-black text-[10px] lg:text-xs leading-tight uppercase text-center line-clamp-2">
                              {product.name}
                            </h3>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
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
              <div key={`${item.id}-${item.selectedTemp || ''}-${item.selectedSize || ''}`} className="relative z-10 flex gap-3 p-3 bg-white border-2 border-black rounded-xl shadow-[3px_3px_0px_black] hover:translate-x-[1px] transition-transform">
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
                    <div className="flex flex-col">
                      <h4 className="font-black text-sm uppercase leading-tight line-clamp-1">{item.name}</h4>
                      {(item.selectedTemp || item.selectedSize) && (
                        <span className="text-[10px] font-bold text-[#552CB7] mt-0.5">
                          {[item.selectedTemp, item.selectedSize].filter(Boolean).join(' - ')}
                        </span>
                      )}
                    </div>
                    <span className="font-bold text-sm">{(item.price * item.qty).toLocaleString()}</span>
                  </div>

                  <div className="flex justify-between items-end mt-1">
                    <p className="text-[10px] font-bold text-gray-500">@{item.price.toLocaleString()}</p>

                    {/* Qty Controls */}
                    <div className="flex items-center gap-1">
                      <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id, item.selectedTemp, item.selectedSize); }} className="w-6 h-6 flex items-center justify-center bg-gray-100 hover:bg-[#FD5A46] hover:text-white border border-black rounded font-black text-sm transition-colors">-</button>
                      <span className="w-6 text-center font-black text-sm">{item.qty}</span>
                      <button onClick={(e) => { e.stopPropagation(); addToCart(item, { temp: item.selectedTemp || null, size: item.selectedSize || null }); }} className="w-6 h-6 flex items-center justify-center bg-black text-white hover:bg-[#00995E] border border-black rounded font-black text-sm transition-colors">+</button>
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
                onClick={() => initiatePayment('CASH')}
                disabled={isProcessingPayment || cart.length === 0}
                className="py-4 font-black bg-white text-black border border-white/20 shadow-[0_4px_12px_rgba(255,255,255,0.2)] active:scale-95 transition-all disabled:opacity-50 text-sm hover:shadow-[0_6px_16px_rgba(255,255,255,0.3)] rounded-xl"
              >
                CASH
              </button>
              <button
                onClick={() => initiatePayment('ONLINE')}
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

      {/* CONFIRMATION MODAL */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white border-4 border-black shadow-[12px_12px_0px_black] w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">

            {/* Header */}
            <div className="bg-black text-white p-4 flex justify-between items-center">
              <h3 className="font-black text-lg uppercase tracking-wider italic">KONFIRMASI</h3>
              <button
                onClick={() => setConfirmModal({ open: false, type: null })}
                className="text-white hover:text-[#FD5A46] transition-colors"
              >
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            <div className="p-6 flex flex-col items-center text-center gap-6">

              {/* Icon & Type */}
              <div className="flex flex-col items-center gap-2">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-black shadow-[4px_4px_0px_black] ${confirmModal.type === 'CASH' ? 'bg-[#00995E] text-white' : 'bg-[#552CB7] text-white'}`}>
                  {confirmModal.type === 'CASH' ? <Banknote size={40} strokeWidth={2.5} /> : <CreditCard size={40} strokeWidth={2.5} />}
                </div>
                <div
                  className="font-black text-2xl uppercase mt-2 text-black tracking-wide"
                >
                  {confirmModal.type === 'CASH' ? 'TUNAI' : 'QRIS / DEBIT'}
                </div>
              </div>

              {/* Amount Display */}
              <div className="w-full bg-gray-100 border-2 border-black p-3 rounded-xl relative">
                <p className="text-xs font-bold text-gray-500 uppercase mb-1">Total Tagihan</p>
                <p className="text-3xl font-black text-black tracking-tight">Rp {finalTotal.toLocaleString()}</p>
                <div className="absolute top-1/2 left-0 -translate-x-1/2 w-4 h-4 bg-white border-2 border-black rounded-full"></div>
                <div className="absolute top-1/2 right-0 translate-x-1/2 w-4 h-4 bg-white border-2 border-black rounded-full"></div>
              </div>

              <p className="font-bold text-gray-700 text-sm px-4 leading-relaxed">
                Pastikan nominal pembayaran dan metode yang dipilih sudah sesuai.
              </p>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3 w-full">
                <button
                  onClick={() => setConfirmModal({ open: false, type: null })}
                  className="py-3.5 font-black bg-white text-black border-2 border-black shadow-[4px_4px_0px_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none transition-all uppercase text-sm"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    if (confirmModal.type === 'CASH') processCashPayment();
                    else processOnlinePayment();
                  }}
                  disabled={isProcessingPayment}
                  className="py-3.5 font-black bg-[#FFC567] text-black border-2 border-black shadow-[4px_4px_0px_black] hover:bg-[#FFD188] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_black] active:translate-y-1 active:shadow-none transition-all uppercase text-sm flex gap-2 items-center justify-center disabled:opacity-70 disabled:cursor-wait"
                >
                  {isProcessingPayment ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      <span>Memproses...</span>
                    </>
                  ) : (
                    'Ya, Lanjut'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL (AUTO PRINT INTENT) */}
      <AnimatePresence>
        {successModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl relative text-center"
            >
              {/* Header */}
              <div className="bg-[#552CB7] p-8 text-white relative overflow-hidden flex flex-col items-center justify-center">
                <div className="absolute top-0 left-0 w-full h-full bg-[url('/pattern-noise.png')] opacity-10"></div>

                {/* Checkmark Animation */}
                <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-[0_4px_12px_rgba(0,0,0,0.2)] animate-[bounce_1s_infinite]">
                  <svg className="w-10 h-10 text-[#552CB7]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
                </div>

                <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Pembayaran Berhasil!</h2>
                <p className="text-sm font-medium opacity-80">Order #{successModal.id.slice(-6).toUpperCase()}</p>
              </div>

              {/* Receipt Preview (Order Details) */}
              <div className="p-5 bg-gray-50 max-h-[50vh] overflow-y-auto text-left">
                <div className="bg-white p-3 shadow-sm border border-gray-200 rounded-xl text-xs font-mono space-y-2">
                  <div className="text-center font-bold border-b border-gray-100 pb-2 mb-2 text-gray-400 uppercase tracking-widest text-[10px]">
                    Rincian Pesanan
                  </div>

                  <div className="space-y-1.5">
                    {successModal.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-start gap-2">
                        <span className="uppercase font-medium text-gray-700 leading-tight">
                          {item.qty}x {item.name}
                        </span>
                        <span className="font-bold shrink-0">
                          {(item.price * item.qty).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-dashed border-gray-300 pt-2 mt-2 space-y-1">
                    {successModal.discountAmount > 0 && (
                      <div className="flex justify-between text-[#00995E]">
                        <span>Hemat (Voucher)</span>
                        <span>- {successModal.discountAmount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm pt-1">
                      <span>TOTAL</span>
                      <span>Rp {successModal.totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-center">
                  <p className="text-[10px] text-gray-400 italic animate-pulse">
                    Sedang mencetak struk secara otomatis...
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="p-4 bg-white flex flex-col gap-3">
                <button
                  onClick={() => {
                    const url = generateRawBTUrl(successModal);
                    window.location.href = url;
                  }}
                  className="w-full py-3 bg-gray-100 text-black border-2 border-black font-black rounded-xl hover:bg-gray-200 transition-colors uppercase flex items-center justify-center gap-2 text-sm"
                >
                  <Printer size={16} /> Print Manual
                </button>

                <button
                  onClick={() => setSuccessModal(null)}
                  className="w-full py-3 bg-[#00995E] text-white font-black rounded-xl shadow-[4px_4px_0px_black] hover:translate-y-0.5 hover:shadow-[2px_2px_0px_black] active:shadow-none active:translate-y-1 transition-all uppercase text-sm"
                >
                  Selesai / Transaksi Baru
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}