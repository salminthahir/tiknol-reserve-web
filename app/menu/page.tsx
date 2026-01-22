"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image'; // Import Next.js Image component
import { ShoppingBag, X, Plus, Minus, ArrowLeft, ChevronDown, User, Phone } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderItem } from '@/types/order'; // Import tipe data

// Definisikan tipe untuk item menu
interface MenuItem {
  id: number;
  category: string;
  name: string;
  price: number;
  description: string;
  image: string;
}

// --- DATA MENU LENGKAP (UPDATED) ---
const MENU_ITEMS: MenuItem[] = [
  // --- KATEGORI: COFFEE SERIES ---
  { 
    id: 101, category: 'COFFEE SERIES', name: 'TIKNOL KOPI', price: 20000, 
    description: 'Signature coffee blend dari Titik Nol. Creamy, bold, and distinct.', 
    image: '/img/IMG_8565.jpg'
  },
  { 
    id: 102, category: 'COFFEE SERIES', name: 'AMERICANO', price: 20000, 
    description: 'Espresso shot dengan air mineral. Tersedia panas/dingin. Pure caffeine kick.', 
    image: '/img/IMG_8587.jpg' 
  },
    { 
    id: 103, category: 'COFFEE SERIES', name: 'KOPI AREN', price: 20000, 
    description: 'Kopi susu dengan gula aren asli yang legit. Favorit sejuta umat.', 
    image: '/img/Space01.png'
  },
  // ... Tambahkan sisa menu items di sini jika ada path gambar lokalnya
  // Untuk sementara, item lain di-comment agar tidak error jika gambar tidak ada
];

function MenuContent() {
  // --- SEMUA HOOKS HARUS DI ATAS ---
  const searchParams = useSearchParams();
  const router = useRouter();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const orderId = searchParams.get('order_id');

  // --- 1. LOGIC REDIRECT ---
  useEffect(() => {
    if (orderId) {
      router.replace(`/ticket/${orderId}`);
    }
  }, [orderId, router]);

  // --- 2. TAMPILAN LOADING (Jika sedang redirect) ---
  if (orderId) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-[#FBC02D]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FBC02D] mb-4"></div>
        <h2 className="text-xl font-bold tracking-widest uppercase">Memproses Pesanan...</h2>
        <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
      </div>
    );
  }

  // --- 3. LOGIC MENU NORMAL ---
  // Filter Menu
  const groupedMenu = MENU_ITEMS.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);


  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  const addToCart = (itemId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    setCart(prev => {
      const existing = prev.find(i => i.id === itemId);
      if (existing) {
        return prev.map(i => i.id === itemId ? { ...i, qty: i.qty + 1 } : i);
      }
      const newItem = MENU_ITEMS.find(i => i.id === itemId);
      if (newItem) {
        return [...prev, { id: newItem.id, name: newItem.name, price: newItem.price, qty: 1 }];
      }
      return prev;
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.map(i => {
      if (i.id === id) return { ...i, qty: i.qty - 1 };
      return i;
    }).filter(i => i.qty > 0));
  };

  const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.qty, 0);
  const isFormValid = cart.length > 0 && customerName.length > 0 && whatsapp.length > 0;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-[#F5F5F5] font-sans pb-32">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#1A1A1A]/95 backdrop-blur border-b border-[#FBC02D] px-4 h-20 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-sm font-bold tracking-widest hover:text-[#FBC02D] transition-colors">
          <ArrowLeft size={16} /> HOME
        </Link>
        <button 
          onClick={() => setIsCartOpen(true)}
          className="flex items-center gap-2 bg-[#FBC02D] text-black px-4 py-2 font-bold hover:bg-white transition-colors"
        >
          <span className="text-xs md:text-sm">CART ({totalItems})</span>
          <ShoppingBag size={18} />
        </button>
      </nav>

      {/* HEADER */}
      <header className="py-16 md:py-24 px-4 text-center border-b border-[#FBC02D]/20">
        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter mb-4">
          The <span className="text-[#FBC02D]">Selection</span>
        </h1>
        <p className="text-gray-400 text-xs md:text-sm font-mono tracking-widest">
          CLICK ITEM TO SEE DETAILS
        </p>
      </header>

      {/* LIST MENU */}
      <div className="max-w-5xl mx-auto mt-12 px-4 space-y-20">
        {Object.entries(groupedMenu).map(([categoryName, items]) => (
          <div key={categoryName}>
            <h2 className="text-3xl font-black uppercase tracking-tight text-[#FBC02D] mb-6 border-b border-[#FBC02D] pb-2 inline-block">
              {categoryName}
            </h2>
            <div className="border-t border-[#FBC02D]/20">
              {items.map((item) => (
                <div key={item.id} className={`border-b border-[#FBC02D]/20 transition-all duration-300 ${expandedId === item.id ? 'bg-[#252525]' : 'hover:bg-[#252525]/50'}`}>
                  <div onClick={() => toggleExpand(item.id)} className="cursor-pointer py-6 px-2 md:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-[10px] font-bold text-gray-500 tracking-widest border border-gray-600 px-1">{item.category}</span>
                        <ChevronDown size={14} className={`text-gray-500 transition-transform ${expandedId === item.id ? 'rotate-180' : ''}`} />
                      </div>
                      <h3 className="text-2xl font-bold uppercase">{item.name}</h3>
                    </div>
                    <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0">
                      <span className="text-xl font-mono text-[#FBC02D]">{item.price.toLocaleString('id-ID')}</span>
                      <button onClick={(e) => addToCart(item.id, e)} className="w-12 h-12 border border-[#FBC02D] bg-black flex items-center justify-center hover:bg-[#FBC02D] hover:text-black transition-colors z-10">
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                  {/* DETAIL */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === item.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-0 flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-64 h-48 md:h-48 bg-gray-800 flex-shrink-0 border border-[#FBC02D]/30 relative">
                        <Image src={item.image} alt={item.name} layout="fill" objectFit="cover" className="grayscale hover:grayscale-0 transition-all duration-500" />
                      </div>
                      <div className="flex flex-col justify-center">
                        <h4 className="text-[#FBC02D] font-bold mb-2 uppercase text-sm tracking-widest">Description</h4>
                        <p className="text-gray-300 leading-relaxed max-w-lg">{item.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* DRAWER KERANJANG */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[60]">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}></div>
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-[#1E1E1E] border-l border-[#FBC02D] p-6 flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-700 pb-4">
              <h2 className="text-xl font-bold uppercase tracking-widest">Your Tray</h2>
              <button onClick={() => setIsCartOpen(false)}><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                  <ShoppingBag size={48} className="mb-4" />
                  <p>Tray is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-[#1A1A1A] p-4 border border-gray-800">
                    <div>
                      <h4 className="font-bold text-sm uppercase">{item.name}</h4>
                      <p className="text-[#FBC02D] text-xs mt-1">Rp {(item.price * item.qty).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black px-2 py-1 border border-gray-800">
                      <button onClick={() => removeFromCart(item.id)}><Minus size={14} /></button>
                      <span className="text-sm w-4 text-center">{item.qty}</span>
                      <button onClick={() => addToCart(item.id)}><Plus size={14} /></button>
                    </div>
                  </div>
                ))
              )}
            </div>
            {cart.length > 0 && (
              <div className="mt-4 space-y-3 border-t border-gray-700 pt-4">
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-2">Customer Details</p>
                <div className="bg-black border border-gray-700 p-3 flex items-center gap-3">
                  <User size={18} className="text-gray-500" />
                  <input type="text" placeholder="Your Name (Required)" className="bg-transparent w-full outline-none text-sm placeholder-gray-600" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                </div>
                <div className="bg-black border border-gray-700 p-3 flex items-center gap-3">
                  <Phone size={18} className="text-gray-500" />
                  <input type="text" placeholder="WhatsApp Number (Required)" className="bg-transparent w-full outline-none text-sm placeholder-gray-600" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
                </div>
              </div>
            )}
            <div className="pt-6 border-t border-[#FBC02D] mt-4">
              <div className="flex justify-between text-xl font-bold mb-6">
                <span>TOTAL</span>
                <span className="text-[#FBC02D]">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
              <CheckoutButton items={cart} total={totalAmount} customerName={customerName} whatsapp={whatsapp} disabled={!isFormValid} />
              {!isFormValid && cart.length > 0 && <p className="text-center text-xs text-red-500 mt-2">*Please fill name & whatsapp to proceed</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-[#FBC02D]">Loading...</div>}>
      <MenuContent />
    </Suspense>
  );
}