"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag, X, Plus, Minus, ArrowLeft, User, Phone, Search, Star, ArrowRight, Check, ChevronUp, Ghost, Sparkles, Smile, CircleDot, Waves, Fish } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';
import { useSearchParams, useRouter } from 'next/navigation';
import { OrderItem } from '@/types/order';

// --- TIPE DATA ---
type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image: string;
};

// Customization Type
type Customization = {
  temp: 'HOT' | 'ICE';
  size: 'REGULAR' | 'MEDIUM' | 'LARGE';
};

type CartItem = Product & { 
  qty: number;
  custom?: Customization;
  uniqueKey: string; 
};

function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isCartOpen, setIsCartOpen] = useState(false);

  // STATE BARU: Untuk Modal Customization
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [tempCustom, setTempCustom] = useState<Customization>({ temp: 'ICE', size: 'REGULAR' });

  // --- LOGIC REDIRECT ---
  const orderId = searchParams.get('order_id');

  useEffect(() => {
    if (orderId) {
      router.replace(`/ticket/${orderId}`);
    }
  }, [orderId, router]);

  // --- FETCH DATA ---
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/products');
        const data = await res.json();
        if (!res.ok) throw new Error(data.details || `HTTP Error: ${res.status}`);
        if (Array.isArray(data)) setProducts(data.filter((p: any) => p.isAvailable));
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (!orderId) fetchProducts();
  }, [orderId]);

  // --- CART LOGIC ---
  const handleAddToCartClick = (product: Product) => {
    const needsCustomization = product.category.toUpperCase().includes('COFFEE');
    
    if (needsCustomization) {
      setTempCustom({ temp: 'ICE', size: 'REGULAR' });
      setSelectedProduct(product);
    } else {
      // Langsung masuk keranjang untuk kategori non-minuman
      const uniqueKey = `${product.id}-standard`;
      setCart((prev) => {
        const existing = prev.find((item) => item.uniqueKey === uniqueKey);
        if (existing) {
          return prev.map((item) => item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + 1 } : item);
        }
        return [...prev, { ...product, qty: 1, uniqueKey }];
      });
      if(cart.length === 0) setIsCartOpen(true);
    }
  };

  const confirmAddToCart = () => {
    if (!selectedProduct) return;

    // Buat unique key berdasarkan ID + Varian
    const uniqueKey = `${selectedProduct.id}-${tempCustom.temp}-${tempCustom.size}`;

    setCart((prev) => {
      const existing = prev.find((item) => item.uniqueKey === uniqueKey);
      if (existing) {
        return prev.map((item) => 
          item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...selectedProduct, qty: 1, custom: tempCustom, uniqueKey }];
    });

    setSelectedProduct(null);
    if(cart.length === 0) setIsCartOpen(true);
  };

  const updateQty = (uniqueKey: string, delta: number) => {
    setCart((prev) => 
      prev.map((item) => 
        item.uniqueKey === uniqueKey ? { ...item, qty: item.qty + delta } : item
      ).filter(item => item.qty > 0)
    );
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const isFormValid = cart.length > 0 && customerName.length > 2 && whatsapp.length > 9;

  const categories = ['ALL', ...Array.from(new Set(products.map(p => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  // --- RENDER LOADING / ERROR ---
  if (orderId || (isLoading && !orderId)) return (
    <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center text-[#FBC02D]">
      <div className="w-12 h-12 border-2 border-[#FBC02D] border-t-transparent rounded-full animate-spin mb-4"></div>
      <h2 className="text-sm font-mono tracking-widest uppercase animate-pulse">Loading Menu...</h2>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080808] text-[#e0e0e0] font-sans selection:bg-[#FBC02D] selection:text-black">
      <style jsx global>{`* { -webkit-tap-highlight-color: transparent; }`}</style>

      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-40 h-20 px-4 md:px-8 flex items-center justify-between bg-[#080808]/80 backdrop-blur-md border-b border-white/5">
        <Link href="/" className="flex items-center gap-2 group active:scale-95 transition-transform duration-200">
          <div className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg group-hover:border-[#FBC02D]/50 group-hover:bg-white/10 transition-all duration-500 transform group-hover:-translate-y-0.5">
            <h1 className="text-base font-black tracking-tighter text-white"><span className="text-[#FBC02D]">.</span>NOL</h1>
          </div>
          <span className="font-light text-lg tracking-wider uppercase text-neutral-400 group-hover:text-white transition-colors duration-500">Reserve</span>
        </Link>

        <button onClick={() => setIsCartOpen(true)} className="hidden md:flex relative items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full border border-white/10 transition-all active:scale-95">
          <span className="text-xs font-bold uppercase">Tray</span>
          <ShoppingBag size={18} className="text-[#FBC02D]" />
          {totalItems > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#FBC02D] text-black text-[9px] font-black flex items-center justify-center rounded-full">{totalItems}</span>}
        </button>
      </nav>

      {/* HERO & MARQUEE */}
      <section className="pt-32 pb-16 px-4 text-center border-b border-white/5 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1a1a1a] via-[#080808] to-[#080808]">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[#FBC02D]/30 bg-[#FBC02D]/5 text-[#FBC02D] text-[10px] font-mono tracking-widest uppercase mb-4">
          <Star size={10} fill="currentColor" /> Premium Selection
        </div>
        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter mb-4 leading-none">TASTE THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBC02D] to-yellow-600">FUTURE</span></h1>
      </section>

      <div className="bg-[#FBC02D] text-black overflow-hidden py-2 relative">
        <div className="flex gap-8 animate-marquee whitespace-nowrap font-black text-xs uppercase tracking-widest w-max">
          {[...Array(4)].map((_, i) => <span key={i}>Fresh Brew Daily • Premium Beans • Signature Blends • </span>)}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex flex-col lg:flex-row relative">
        <div className="flex-1 min-h-screen">
          {/* FILTER BAR */}
          <div className="sticky top-20 z-30 bg-[#080808]/95 backdrop-blur-xl border-b border-white/5 py-4 px-4 md:px-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative max-w-xs w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" size={16}/>
              <input type="text" placeholder="SEARCH..." className="w-full bg-white/5 border border-white/10 rounded-lg py-2 pl-10 text-xs focus:border-[#FBC02D] transition-all text-white placeholder-neutral-600 uppercase" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((cat) => (
                <button key={cat} onClick={() => setActiveCategory(cat)} className={`whitespace-nowrap px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all duration-300 ${activeCategory === cat ? 'bg-white text-black border-white' : 'bg-transparent text-neutral-500 border-white/10'}`}>{cat}</button>
              ))}
            </div>
          </div>

          {/* GRID */}
          <div className="p-4 md:p-8 pb-32 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {filteredProducts.map((product) => (
              <div key={product.id} onClick={() => handleAddToCartClick(product)} className="group relative bg-[#111] border border-white/5 rounded-xl overflow-hidden active:scale-95 transition-all duration-300 cursor-pointer">
                <div className="relative aspect-square overflow-hidden bg-[#1a1a1a]">
                  <Image src={product.image || '/placeholder.svg'} alt={product.name} fill sizes="20vw" className="object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100" />
                  <div className="absolute bottom-2 right-2 bg-[#FBC02D] text-black w-8 h-8 rounded-full flex items-center justify-center shadow-lg"><Plus size={18} strokeWidth={3} /></div>
                </div>
                <div className="p-3">
                  <h3 className="font-bold text-xs text-neutral-200 line-clamp-2 mb-2 group-hover:text-[#FBC02D] transition-colors uppercase">{product.name}</h3>
                  <p className="font-mono font-bold text-xs text-[#FBC02D]">{(product.price / 1000)}<span className="text-white">K</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* --- FLOATING CART BUTTON (MOBILE) --- */}
        <div className={`fixed bottom-6 left-6 right-6 z-[60] md:hidden transition-all duration-500 ${cart.length > 0 ? 'translate-y-0' : 'translate-y-32 opacity-0'}`}>
          <button onClick={() => setIsCartOpen(true)} className="w-full bg-[#111] backdrop-blur-xl border border-white/10 p-2 rounded-full shadow-2xl flex items-center justify-between active:scale-95 transition-transform">
            <div className="flex items-center gap-3">
              <div className="bg-[#FBC02D] w-10 h-10 rounded-full flex items-center justify-center font-black text-black text-sm">{totalItems}</div>
              <div className="flex flex-col items-start pr-4 border-r border-white/10">
                <span className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase">Total</span>
                <span className="text-sm font-bold text-white font-mono">Rp {totalAmount.toLocaleString()}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pr-4 pl-2 font-black text-[10px] tracking-[0.2em] uppercase text-[#FBC02D]">Checkout <ArrowRight size={14} className="text-white" /></div>
          </button>
        </div>

        {/* --- CUSTOMIZATION MODAL --- */}
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedProduct(null)} />
            <div className="relative w-full max-w-md bg-[#111] border-t md:border border-white/10 rounded-t-3xl md:rounded-2xl overflow-hidden shadow-2xl animate-slide-up">
              <div className="p-6 space-y-6">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">{selectedProduct.name}</h2>
                    <p className="text-[#FBC02D] font-mono font-bold text-lg">IDR {selectedProduct.price.toLocaleString()}</p>
                  </div>
                  <button onClick={() => setSelectedProduct(null)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-all"><X size={20} /></button>
                </div>

                <div className="space-y-6">
                  {/* TEMPERATURE */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Select Temperature</p>
                    <div className="grid grid-cols-2 gap-3">
                      {(['ICE', 'HOT'] as const).map((t) => (
                        <button key={t} onClick={() => setTempCustom(prev => ({ ...prev, temp: t }))} className={`py-3 rounded-xl border-2 font-bold transition-all flex items-center justify-center gap-2 ${tempCustom.temp === t ? 'bg-white text-black border-white' : 'bg-transparent border-white/5 text-neutral-500 hover:border-white/20'}`}>
                          {t} {tempCustom.temp === t && <Check size={14} />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* SIZE LEVEL - CREATIVE & LEBAY VERSION */}
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Scale Your Caffeine</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { 
                          id: 'REGULAR', 
                          label: 'REGULAR', 
                          sub: 'Peanut Size', 
                          icon: (
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#FBC02D]">
                              <path d="M7 15c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4Z" />
                              <path d="M9 9c0-2.2 1.8-4 4-4s4 1.8 4 4-1.8 4-4 4-4-1.8-4-4Z" />
                            </svg>
                          )
                        },
                        { 
                          id: 'MEDIUM', 
                          label: 'MEDIUM', 
                          sub: 'Human Size', 
                          icon: <User size={22} /> 
                        },
                        { 
                          id: 'LARGE', 
                          label: 'LARGE', 
                          sub: 'Whale Size', 
                          icon: (
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-bounce-short">
                              <path d="M2 12c0 4.4 3.6 8 8 8h10c1.1 0 2-.9 2-2v-2c0-1.1-.9-2-2-2h-2c-1.1 0-2-.9-2-2V8c0-1.1-.9-2-2-2H6c-2.2 0-4 1.8-4 4v2Z" />
                              <path d="M10 20c0-2.2 1.8-4 4-4" />
                              <path d="M2 12h4" />
                            </svg>
                          )
                        }
                      ].map((s) => (
                        <button 
                          key={s.id} 
                          onClick={() => setTempCustom(prev => ({ ...prev, size: s.id as any }))} 
                          className={`
                            py-4 px-1 rounded-2xl border-2 transition-all flex flex-col items-center gap-2
                            ${tempCustom.size === s.id 
                              ? 'bg-[#FBC02D] text-black border-[#FBC02D] translate-y-[-6px] shadow-[0_12px_24px_-8px_rgba(251,192,45,0.5)]' 
                              : 'bg-white/5 border-white/5 text-neutral-500 hover:border-white/10'
                            }
                          `}
                        >
                          <div className={`transition-all duration-500 ${tempCustom.size === s.id ? 'scale-150' : 'scale-100 opacity-30'}`}>
                            {s.icon}
                          </div>
                          <div className="text-center mt-1">
                            <p className="text-[9px] font-black tracking-widest uppercase">{s.label}</p>
                            <p className={`text-[7px] font-medium opacity-60 italic ${tempCustom.size === s.id ? 'text-black' : ''}`}>{s.sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button onClick={confirmAddToCart} className="w-full bg-[#FBC02D] text-black py-4 rounded-xl font-black uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-yellow-500 transition-all active:scale-95 shadow-xl shadow-[#FBC02D]/10">
                  Add to Tray <Plus size={18} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- CART DRAWER --- */}
        {isCartOpen && <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[50]" onClick={() => setIsCartOpen(false)} />}
        <div className={`fixed top-0 right-0 h-full w-[85vw] md:w-[450px] z-[60] bg-[#080808]/90 backdrop-blur-xl border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-500 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/10 bg-white/5">
            <h2 className="font-black text-xl uppercase tracking-widest flex items-center gap-2">Order<span className="text-[#FBC02D]">Tray</span></h2>
            <button onClick={() => setIsCartOpen(false)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center"><X size={18} /></button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-neutral-600 space-y-4 opacity-50">
                <ShoppingBag size={48} />
                <p className="font-mono text-[10px] uppercase tracking-[0.2em]">Tray is empty</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.uniqueKey} className="group relative bg-white/5 border border-white/5 p-3 rounded-xl transition-all">
                  <div className="flex justify-between items-start mb-2">
                    <div className="space-y-1">
                      <h4 className="font-bold text-xs text-neutral-200 uppercase">{item.name}</h4>
                      {item.custom && (
                        <div className="flex gap-2">
                          <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">{item.custom.temp}</span>
                          <span className="text-[8px] font-black bg-white/10 px-1.5 py-0.5 rounded text-neutral-400">{item.custom.size} SIZE</span>
                        </div>
                      )}
                    </div>
                    <p className="font-mono text-sm text-[#FBC02D]">{(item.price * item.qty).toLocaleString()}</p>
                  </div>
                  <div className="flex justify-between items-center mt-4">
                    <p className="text-[9px] text-neutral-500 font-mono">UNIT: {item.price.toLocaleString()}</p>
                    <div className="flex items-center gap-1 bg-black/40 rounded-lg p-1 border border-white/5">
                      <button onClick={() => updateQty(item.uniqueKey, -1)} className="w-7 h-7 flex items-center justify-center text-red-400 active:scale-75 transition-transform"><Minus size={14} /></button>
                      <span className="text-xs font-mono w-6 text-center">{item.qty}</span>
                      <button onClick={() => updateQty(item.uniqueKey, 1)} className="w-7 h-7 flex items-center justify-center text-green-400 active:scale-75 transition-transform"><Plus size={14} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-[#0a0a0a] border-t border-white/10 space-y-5">
            {cart.length > 0 && (
              <div className="space-y-2">
                <input type="text" placeholder="NAME" className="w-full bg-white/5 border border-white/5 py-2.5 px-3 rounded-lg text-base md:text-[10px] font-medium placeholder:font-mono placeholder:text-neutral-600 uppercase focus:border-[#FBC02D] outline-none text-neutral-200" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                <input type="tel" placeholder="WHATSAPP" className="w-full bg-white/5 border border-white/5 py-2.5 px-3 rounded-lg text-base md:text-[10px] font-medium placeholder:font-mono placeholder:text-neutral-600 uppercase focus:border-[#FBC02D] outline-none text-neutral-200" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
              </div>
            )}
            <div className="flex justify-between items-end pb-2">
              <span className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-white tracking-tighter"><span className="text-[#FBC02D] text-sm mr-1">IDR</span>{totalAmount.toLocaleString()}</span>
            </div>
            <CheckoutButton items={cart} total={totalAmount} customerName={customerName} whatsapp={whatsapp} disabled={!isFormValid} />
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 30s linear infinite; }
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        @keyframes bounceShort {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .animate-bounce-short { animation: bounceShort 1s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#080808] flex items-center justify-center"><div className="w-6 h-6 border-2 border-[#FBC02D] rounded-full animate-ping"></div></div>}>
      <MenuContent />
    </Suspense>
  );
}
