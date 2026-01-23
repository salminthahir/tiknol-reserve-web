'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image';

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
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // STATE BARU: Untuk mengontrol tampilan Cart di Mobile
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) throw new Error(`Status ${res.status}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setProducts(data.filter((p: any) => p.isAvailable));
        }
      } catch (err: any) {
        console.error(err);
        // Data Dummy untuk preview jika fetch gagal (bisa dihapus nanti)
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

  const grandTotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);

  // --- LOGIC PEMBAYARAN ---
  const handlePayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);
    // ... (Logika QRIS sama seperti sebelumnya)
    // Simulasi sebentar
    setTimeout(() => setIsProcessingPayment(false), 2000);
  };

  const handleCashPayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);
    // ... (Logika Cash sama seperti sebelumnya)
    setTimeout(() => setIsProcessingPayment(false), 2000);
  };
  
  // --- FILTERING ---
  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];

  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <Script 
        src="https://app.sandbox.midtrans.com/snap/snap.js" 
        data-client-key={process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY} 
        strategy="lazyOnload"
      />

      {/* LAYOUT UTAMA:
         Menggunakan flex-col untuk Mobile (atas-bawah)
         Menggunakan flex-row untuk Desktop (lg) (kiri-kanan)
      */}
      <div className="flex h-screen bg-[#F5F5F5] font-sans text-black overflow-hidden flex-col lg:flex-row relative">
        
        {/* === BAGIAN KIRI: MENU === */}
        {/* flex-1 agar memenuhi ruang, overflow-hidden agar scroll independent */}
        <div className="flex-1 flex flex-col lg:border-r-4 lg:border-black w-full h-full">
          
          {/* Header Mobile/Desktop */}
          <div className="p-4 lg:p-6 bg-white border-b-4 border-black flex flex-col gap-3 lg:gap-4 shrink-0">
            <div className="flex justify-between items-center">
              {/* Ukuran font responsif: text-2xl di HP, text-4xl di Desktop */}
              <h1 className="text-2xl lg:text-4xl font-black italic tracking-tighter uppercase">
                TIKNOL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBC02D] to-yellow-600">POS</span>
              </h1>
              <div className="hidden lg:flex gap-2">
                 <Link href="/admin/menu" className="bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-gray-800">MENU</Link>
                 <Link href="/admin/dashboard" className="bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-gray-800">KITCHEN</Link>
              </div>
              {/* Tombol Menu Manager Mobile (Icon Only) */}
              <div className="lg:hidden">
                <Link href="/admin/dashboard" className="bg-black text-white p-2 text-xs font-mono font-bold">DASHBOARD</Link>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="flex flex-col lg:flex-row gap-2 lg:gap-4">
               <input 
                 type="text" 
                 placeholder="CARI..." 
                 className="w-full bg-white border-2 border-black p-2 lg:p-3 font-bold focus:outline-none focus:bg-[#FBC02D] shadow-[2px_2px_0px_0px_black] lg:shadow-[4px_4px_0px_0px_black]" 
                 value={search} 
                 onChange={(e) => setSearch(e.target.value)} 
               />
               <div className="flex gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
                 {categories.map((cat) => (
                    <button 
                      key={cat} 
                      onClick={() => setActiveCategory(cat)} 
                      className={`whitespace-nowrap px-3 py-1 lg:px-4 lg:py-2 font-black text-xs lg:text-sm uppercase border-2 border-black shadow-[2px_2px_0px_0px_black] active:shadow-none transition-all ${activeCategory === cat ? 'bg-black text-[#FBC02D]' : 'bg-white hover:bg-gray-100'}`}
                    >
                      {cat}
                    </button>
                 ))}
               </div>
            </div>
          </div>

          {/* Grid Produk */}
          <div className="flex-1 p-4 lg:p-6 overflow-y-auto bg-[#F5F5F5] pb-24 lg:pb-6">
             {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-black text-xl animate-pulse">LOADING...</p>
                </div>
             ) : (
               // Grid Responsif: 2 kolom (HP), 3 (Tablet), 4 (Desktop)
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-6">
                 {filteredProducts.map((product) => (
                   <div key={product.id} onClick={() => addToCart(product)} className="group relative bg-white border-2 border-black cursor-pointer transition-transform active:scale-95 shadow-[3px_3px_0px_0px_black] hover:shadow-[6px_6px_0px_0px_black]">
                      <div className="h-28 lg:h-40 w-full bg-gray-100 border-b-2 border-black flex items-center justify-center overflow-hidden relative">
                         <Image 
                            src={product.image || '/placeholder.svg'} 
                            alt={product.name} 
                            fill
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                            className="object-cover group-hover:scale-105 transition-transform duration-300" 
                         />
                      </div>
                      <div className="p-2 lg:p-4">
                         <h3 className="font-black text-sm lg:text-lg leading-tight uppercase mb-1 lg:mb-2 line-clamp-2">{product.name}</h3>
                         <p className="bg-black text-white inline-block px-1 lg:px-2 py-0.5 lg:py-1 font-bold text-xs lg:text-sm">{product.price / 1000}K</p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* === TOMBOL FLOATING (HANYA HP) === */}
        {/* Muncul jika cart tidak kosong */}
        {cart.length > 0 && (
          <div className="lg:hidden fixed bottom-4 left-4 right-4 z-40">
             <button 
               onClick={() => setIsMobileCartOpen(true)}
               className="w-full bg-black text-[#FBC02D] border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] py-4 px-6 flex justify-between items-center font-black text-lg animate-bounce-short"
             >
               <div className="flex items-center gap-2">
                 <span className="bg-[#FBC02D] text-black w-8 h-8 rounded-full flex items-center justify-center text-sm border border-white">{totalItems}</span>
                 <span>ITEM</span>
               </div>
               <span>Rp {grandTotal.toLocaleString()} &rarr;</span>
             </button>
          </div>
        )}

        {/* === BAGIAN KANAN: CART === */}
        {/* Pada Desktop (lg): Tampil Statis (w-[400px]).
            Pada Mobile: Menjadi Modal Full Screen (fixed inset-0) yang bisa ditoggle.
        */}
        <div className={`
            bg-white flex flex-col border-l-4 border-black z-50 transition-transform duration-300
            ${isMobileCartOpen ? 'fixed inset-0 translate-y-0' : 'fixed inset-0 translate-y-[100%]'} 
            lg:static lg:translate-y-0 lg:w-[400px] lg:flex
        `}>
           {/* Header Cart */}
           <div className="p-4 lg:p-6 bg-black text-white border-b-4 border-black flex justify-between items-center shrink-0">
             <h2 className="font-black text-xl lg:text-2xl tracking-widest uppercase">Current Order</h2>
             {/* Tombol Close khusus Mobile */}
             <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden text-white font-bold text-sm bg-red-600 px-3 py-1 border border-white">
                TUTUP X
             </button>
           </div>
           
           {/* List Item Cart */}
           <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f0f0f0]">
             {cart.map((item) => (
               <div key={item.id} className="flex flex-col bg-white border-2 border-black shadow-[3px_3px_0px_0px_gray] p-3">
                 <div className="flex justify-between">
                    <span className="font-black uppercase text-sm lg:text-base line-clamp-1">{item.name}</span>
                    <span className="font-mono font-bold text-sm lg:text-base">{(item.price * item.qty).toLocaleString()}</span>
                 </div>
                 <div className="flex justify-between items-center mt-2">
                    <span className="text-xs font-bold bg-gray-200 px-1">@{item.price.toLocaleString()}</span>
                    <div className="flex items-center border border-black bg-white">
                       <button onClick={(e) => { e.stopPropagation(); removeFromCart(item.id); }} className="w-8 h-8 font-black hover:bg-red-500 hover:text-white border-r border-black">-</button>
                       <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                       <button onClick={(e) => { e.stopPropagation(); addToCart(item); }} className="w-8 h-8 font-black hover:bg-green-500 hover:text-white border-l border-black">+</button>
                    </div>
                 </div>
               </div>
             ))}
             {cart.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-400">
                    <p className="font-mono text-sm">Keranjang kosong.</p>
                    <button onClick={() => setIsMobileCartOpen(false)} className="lg:hidden mt-4 text-black underline font-bold">Kembali ke Menu</button>
                </div>
             )}
           </div>

           {/* Footer Cart (Total & Checkout) */}
           <div className="p-4 lg:p-6 bg-[#F5F5F5] border-t-4 border-black space-y-3 shrink-0">
              <div className="bg-white border-2 border-black p-3 lg:p-4 flex justify-between items-center shadow-[3px_3px_0px_0px_black]">
                 <span className="font-bold text-xs lg:text-sm uppercase tracking-widest text-gray-500">Total Tagihan</span>
                 <span className="font-black text-2xl lg:text-3xl">Rp {grandTotal.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 lg:gap-4">
                 <button 
                   onClick={handleCashPayment} 
                   disabled={isProcessingPayment || cart.length === 0} 
                   className="bg-white border-2 border-black py-3 lg:py-4 font-black uppercase shadow-[3px_3px_0px_0px_black] active:shadow-none hover:bg-gray-200 disabled:opacity-50 text-sm lg:text-base"
                 >
                   {isProcessingPayment ? '...' : 'CASH'}
                 </button>
                 
                 <button 
                   onClick={handlePayment} 
                   disabled={isProcessingPayment || cart.length === 0} 
                   className="bg-[#FBC02D] border-2 border-black py-3 lg:py-4 font-black uppercase shadow-[3px_3px_0px_0px_black] active:shadow-none flex flex-col items-center justify-center leading-none hover:bg-yellow-400 disabled:opacity-50"
                 >
                   {isProcessingPayment ? '...' : <><span className="text-sm lg:text-base">QRIS</span><span className="text-[9px] lg:text-[10px] mt-1 font-mono">MIDTRANS</span></>}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}
