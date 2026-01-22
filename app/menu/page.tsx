"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { ShoppingBag, X, Plus, Minus, ArrowLeft, ChevronDown, Search, User, Phone } from 'lucide-react';
import CheckoutButton from '@/components/CheckoutButton';
import { useSearchParams, useRouter } from 'next/navigation';


// --- DATA MENU LENGKAP (UPDATED) ---
const MENU_ITEMS = [
  // --- KATEGORI: COFFEE SERIES ---
  { 
    id: 101, category: 'COFFEE SERIES', name: 'TIKNOL KOPI', price: 20000, 
    description: 'Signature coffee blend dari Titik Nol. Creamy, bold, and distinct.', 
    image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 102, category: 'COFFEE SERIES', name: 'AMERICANO', price: 20000, 
    description: 'Espresso shot dengan air mineral. Tersedia panas/dingin. Pure caffeine kick.', 
    image: 'https://images.unsplash.com/photo-1551030173-122f523535c3?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 103, category: 'COFFEE SERIES', name: 'KOPI AREN', price: 20000, 
    description: 'Kopi susu dengan gula aren asli yang legit. Favorit sejuta umat.', 
    image: 'https://images.unsplash.com/photo-1461023058943-48dbf13994c6?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 104, category: 'COFFEE SERIES', name: 'COCONUT KOPI', price: 20000, 
    description: 'Perpaduan kopi dengan rasa kelapa yang gurih dan segar tropical.', 
    image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 105, category: 'COFFEE SERIES', name: 'KLEPON KOPI', price: 20000, 
    description: 'Unik! Rasa jajanan pasar Klepon (Pandan & Kelapa) dalam segelas kopi.', 
    image: 'https://images.unsplash.com/photo-1626500145961-d7790b4d4586?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 106, category: 'COFFEE SERIES', name: 'CARAMEL MACHIATO', price: 20000, 
    description: 'Espresso, vanilla syrup, steamed milk, dan drizzle caramel manis.', 
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 107, category: 'COFFEE SERIES', name: 'HAZELNUT KOPI', price: 20000, 
    description: 'Kopi susu dengan aroma kacang Hazelnut yang wangi dan nutty.', 
    image: 'https://images.unsplash.com/photo-1632054010678-7f2e5a1a7355?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 108, category: 'COFFEE SERIES', name: 'VANILLA KOPI', price: 20000, 
    description: 'Klasik kopi susu dengan sirup Vanilla yang lembut.', 
    image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 109, category: 'COFFEE SERIES', name: 'CAPPUCINO', price: 20000, 
    description: 'Espresso dengan foam susu tebal. Tersedia Panas/Dingin.', 
    image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 110, category: 'COFFEE SERIES', name: 'V60 MANUAL BREW', price: 20000, 
    description: 'Seduhan manual pour-over. Tanya barista untuk beans of the week.', 
    image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 111, category: 'COFFEE SERIES', name: 'TITIK LITERAN', price: 115000, 
    description: 'Kopi botolan 1 Liter. Stok kafein untuk seharian di rumah/kantor.', 
    image: 'https://images.unsplash.com/photo-1606791405555-41c36b745421?auto=format&fit=crop&w=800&q=80' 
  },

  // --- KATEGORI: NON-COFFEE ---
  { 
    id: 201, category: 'NON-COFFEE', name: 'MATCHA', price: 20000, 
    description: 'Green tea Jepang creamy. Tersedia Panas/Dingin.', 
    image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 202, category: 'NON-COFFEE', name: 'RED VELVET', price: 20000, 
    description: 'Rasa kue Red Velvet dalam bentuk minuman. Manis dan cantik.', 
    image: 'https://images.unsplash.com/photo-1566318956977-3e6f66293427?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 203, category: 'NON-COFFEE', name: 'TARO MILK', price: 20000, 
    description: 'Minuman rasa ubi ungu yang manis, gurih, dan milky.', 
    image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 204, category: 'NON-COFFEE', name: 'COKLAT MILK', price: 20000, 
    description: 'Susu coklat klasik yang rich. Comfort drink terbaik.', 
    image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 205, category: 'NON-COFFEE', name: 'TIKNOL SODA', price: 20000, 
    description: 'Minuman soda segar racikan spesial Titik Nol.', 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 206, category: 'NON-COFFEE', name: 'STROBERI TEA', price: 20000, 
    description: 'Teh rasa stroberi yang asam manis menyegarkan.', 
    image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 207, category: 'NON-COFFEE', name: 'LEMON TEA', price: 20000, 
    description: 'Teh dengan perasan lemon asli. Vitamin C booster.', 
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 208, category: 'NON-COFFEE', name: 'TIKNOL CURAH', price: 20000, 
    description: 'Minuman botolan praktis siap minum.', 
    image: 'https://images.unsplash.com/photo-1625244515599-4d6cb4b21644?auto=format&fit=crop&w=800&q=80' 
  },

  // --- KATEGORI: HEAVY MEALS ---
  { 
    id: 301, category: 'HEAVY MEALS', name: 'NASI CHICKEN TERIYAKI', price: 23000, 
    description: 'Nasi dengan ayam saus Teriyaki jepang yang manis gurih.', 
    image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 302, category: 'HEAVY MEALS', name: 'NASGOR TIKNOL', price: 23000, 
    description: 'Nasi goreng spesial bumbu rahasia dapur Titik Nol.', 
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 303, category: 'HEAVY MEALS', name: 'NASGOR SAMBAL ROA', price: 23000, 
    description: 'Nasi goreng pedas dengan aroma khas ikan asap Sambal Roa.', 
    image: 'https://images.unsplash.com/photo-1636136701831-7b0292500d0f?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 304, category: 'HEAVY MEALS', name: 'SATE TAICHAN', price: 23000, 
    description: 'Sate ayam daging putih dibakar polos dengan sambal pedas nampol.', 
    image: 'https://images.unsplash.com/photo-1529563021898-1d1565e38fa9?auto=format&fit=crop&w=800&q=80' 
  },

  // --- KATEGORI: NOODLES & RICE ---
  { 
    id: 401, category: 'NOODLES', name: 'INDOMIE GORENG', price: 13000, 
    description: 'Indomie goreng dimasak perfectly al dente + Telur.', 
    image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 402, category: 'NOODLES', name: 'INDOMIE KUAH', price: 13000, 
    description: 'Indomie rebus hangat dengan sayur dan telur. Cocok saat hujan.', 
    image: 'https://images.unsplash.com/photo-1596450531557-4d7a8bffa931?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 403, category: 'NOODLES', name: 'NASI PUTIH', price: 5000, 
    description: 'Nasi putih hangat tambahan.', 
    image: 'https://images.unsplash.com/photo-1576449177114-19280a58145b?auto=format&fit=crop&w=800&q=80' 
  },

  // --- KATEGORI: SNACKS ---
  { 
    id: 501, category: 'SNACKS', name: 'TAHU WALIK', price: 18000, 
    description: 'Tahu goreng dibalik dengan isian aci daging yang kenyal.', 
    image: 'https://images.unsplash.com/photo-1630402773295-d6d7b420f18c?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 502, category: 'SNACKS', name: 'KENTANG GORENG', price: 18000, 
    description: 'Classic french fries. Gurih dan renyah.', 
    image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 503, category: 'SNACKS', name: 'PIS-GOR SAMBAL ROA', price: 23000, 
    description: 'Pisang goreng dicocol sambal roa? Kombinasi manis pedas unik Manado.', 
    image: 'https://images.unsplash.com/photo-1628325852553-61b474cc0419?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 504, category: 'SNACKS', name: 'CHEESE ROLL', price: 13000, 
    description: 'Keju lumer dibalut kulit lumpia renyah.', 
    image: 'https://images.unsplash.com/photo-1600492080034-7299a9103e5c?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 505, category: 'SNACKS', name: 'CHURROS', price: 13000, 
    description: 'Donat spanyol panjang dengan taburan gula kayu manis & saus coklat.', 
    image: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&w=800&q=80' 
  },
  { 
    id: 506, category: 'SNACKS', name: 'DONAT KENTANG', price: 18000, 
    description: '2 pcs Donat kentang klasik yang empuk.', 
    image: 'https://images.unsplash.com/photo-1527515545081-75a45e197b06?auto=format&fit=crop&w=800&q=80' 
  },
];
function MenuContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  // Ambil Order ID dari URL (jika ada)
  const orderId = searchParams.get('order_id');

  // --- 1. LOGIC REDIRECT (POS SATPAM) ---
  useEffect(() => {
    if (orderId) {
      // Jika ada order_id, langsung lempar ke halaman tiket
      router.replace(`/ticket/${orderId}`);
    }
  }, [orderId, router]);

  // --- 2. TAMPILAN LOADING (Mencegah Menu Berat Muncul) ---
  // Jika sedang proses redirect, TAMPILKAN INI SAJA. Jangan render menu.
  if (orderId) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center text-[#FBC02D]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#FBC02D] mb-4"></div>
        <h2 className="text-xl font-bold tracking-widest uppercase">Memproses Pesanan...</h2>
        <p className="text-sm text-gray-500 mt-2">Mohon tunggu sebentar</p>
      </div>
    );
  }

  // --- 3. LOGIC MENU NORMAL (Hanya jalan kalau tidak ada order_id) ---
  const [cart, setCart] = useState<any[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  // Filter Menu
  const groupedMenu = {
    'COFFEE SERIES': MENU_ITEMS.filter(i => i.category === 'COFFEE SERIES'),
    'NON-COFFEE': MENU_ITEMS.filter(i => i.category === 'NON-COFFEE'),
    'HEAVY MEALS': MENU_ITEMS.filter(i => i.category === 'HEAVY MEALS'),
    'NOODLES': MENU_ITEMS.filter(i => i.category === 'NOODLES'),
    'SNACKS': MENU_ITEMS.filter(i => i.category === 'SNACKS'),
  };

  const toggleExpand = (id: number) => setExpandedId(prev => prev === id ? null : id);

  const addToCart = (item: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...item, qty: 1 }];
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
<<<<<<< HEAD
  const isFormValid = cart.length > 0 && customerName.length > 0 && whatsapp.length > 0;
=======

  const handleCheckout = () => {
    if (cart.length === 0) return;
    let message = `*ORDER REQUEST - TITIK NOL*%0A--------------------------------%0A`;
    cart.forEach(item => {
      message += `• ${item.name} (x${item.qty}) - Rp${(item.price * item.qty).toLocaleString('id-ID')}%0A`;
    });
    message += `--------------------------------%0A*TOTAL: Rp ${totalAmount.toLocaleString('id-ID')}*%0A%0Amohon diproses.`;
    window.open(`https://wa.me/6288999324001?text=${message}`, '_blank');
  };
>>>>>>> 18cab77da59d21417e6a84643f8395678e937b34

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
                      <button onClick={(e) => addToCart(item, e)} className="w-12 h-12 border border-[#FBC02D] bg-black flex items-center justify-center hover:bg-[#FBC02D] hover:text-black transition-colors z-10">
                        <Plus size={24} />
                      </button>
                    </div>
                  </div>
                  {/* DETAIL */}
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${expandedId === item.id ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="p-6 pt-0 flex flex-col md:flex-row gap-6">
                      <div className="w-full md:w-64 h-48 md:h-48 bg-gray-800 flex-shrink-0 border border-[#FBC02D]/30">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" />
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
                      <button onClick={(e) => addToCart(item, e)}><Plus size={14} /></button>
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
<<<<<<< HEAD

export default function MenuPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center text-[#FBC02D]">Loading...</div>}>
      <MenuContent />
    </Suspense>
  );
}
=======
>>>>>>> 18cab77da59d21417e6a84643f8395678e937b34
