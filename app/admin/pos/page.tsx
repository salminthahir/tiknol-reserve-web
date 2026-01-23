'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import Image from 'next/image'; // Import Image

// Definisikan tipe untuk item menu, sesuaikan dengan data yang ada
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
  const [isLoading, setIsLoading] = useState(true); // Untuk memuat menu
  const [isProcessingPayment, setIsProcessingPayment] = useState(false); // Untuk proses bayar

  // useEffect untuk fetch data dari database
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        const res = await fetch('/api/admin/products');
        if (!res.ok) {
          throw new Error(`Gagal mengambil data: Status ${res.status}`);
        }
        const data = await res.json();
        if (Array.isArray(data)) {
          // Hanya tampilkan produk yang tersedia di POS
          setProducts(data.filter((p: any) => p.isAvailable));
        } else {
          throw new Error("Format data tidak sesuai.");
        }
      } catch (err: any) {
        console.error(err);
        alert(`Tidak dapat memuat menu: ${err.message}`);
        setProducts([]); // Kosongkan menu jika error agar tidak crash
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, []);

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

  const handlePayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);

    try {
      const orderData = {
        customerName: "POS - Walk in Customer",
        whatsapp: "-",
        totalAmount: grandTotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty
        }))
      };

      const response = await fetch('/api/tokenizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      const { token, orderId } = await response.json();

      if (token) {
        // @ts-ignore
        window.snap.pay(token, {
          onSuccess: function(result: any) {
            alert("Pembayaran Berhasil!");
            setCart([]); 
            // Buka halaman struk di window baru
            if (orderId) {
              window.open(`/ticket/${orderId}/print`, '_blank');
            }
          },
          onPending: function(result: any) { alert("Menunggu Pembayaran"); },
          onError: function(result: any) { alert("Pembayaran Gagal"); },
          onClose: function() { /* Tidak melakukan apa-apa saat popup ditutup */ }
        });
      }
    } catch (error) {
      console.error(error);
      alert("Gagal memproses pembayaran QRIS");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCashPayment = async () => {
    if (cart.length === 0) return alert("Keranjang kosong!");
    setIsProcessingPayment(true);

    try {
      const orderData = {
        customerName: "POS - Walk in Customer", // Atau input dari user
        whatsapp: "-", // Atau input dari user
        totalAmount: grandTotal,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          qty: item.qty
        }))
      };

      const response = await fetch('/api/cash-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        throw new Error(`Gagal membuat order tunai: ${response.statusText}`);
      }
      
      const newOrder = await response.json();
      alert("Pembayaran Tunai Berhasil!");
      setCart([]);
      
      // Buka halaman struk di window baru
      if (newOrder.id) {
        window.open(`/ticket/${newOrder.id}/print`, '_blank');
      }

    } catch (error: any) {
      console.error(error);
      alert(`Gagal memproses pembayaran tunai: ${error.message}`);
    } finally {
      setIsProcessingPayment(false);
    }
  };
  
  // Mengambil kategori unik dari produk untuk tombol filter
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

      <div className="flex h-screen bg-[#F5F5F5] font-sans text-black overflow-hidden">
        <div className="flex-1 flex flex-col border-r-4 border-black">
          <div className="p-6 bg-white border-b-4 border-black flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h1 className="text-4xl font-black italic tracking-tighter uppercase">
                TIKNOL <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FBC02D] to-yellow-600">POS System</span>
              </h1>
              <div className="flex gap-2">
                 <Link href="/admin/menu" className="bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-gray-800">MENU MANAGER</Link>
                 <Link href="/admin/dashboard" className="bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-gray-800">KITCHEN DISPLAY</Link>
              </div>
            </div>

            <div className="flex gap-4">
               <input type="text" placeholder="CARI MENU..." className="flex-1 bg-white border-2 border-black p-3 font-bold focus:outline-none focus:bg-[#FBC02D] shadow-[4px_4px_0px_0px_black]" value={search} onChange={(e) => setSearch(e.target.value)} />
               <div className="flex gap-2 flex-wrap">
                 {categories.map((cat) => (
                    <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-4 py-2 font-black text-sm uppercase border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none transition-all ${activeCategory === cat ? 'bg-black text-[#FBC02D]' : 'bg-white hover:bg-gray-100'}`}>{cat}</button>
                 ))}
               </div>
            </div>
          </div>

          <div className="flex-1 p-6 overflow-y-auto bg-[#F5F5F5]">
             {isLoading ? (
                <div className="flex items-center justify-center h-full">
                  <p className="font-black text-2xl animate-pulse">LOADING MENU...</p>
                </div>
             ) : (
               <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                 {filteredProducts.map((product) => (
                   <div key={product.id} onClick={() => addToCart(product)} className="group relative bg-white border-2 border-black cursor-pointer transition-transform active:scale-95 shadow-[6px_6px_0px_0px_black] hover:shadow-[8px_8px_0px_0px_black]">
                      {/* Tampilkan Gambar Produk */}
                      <div className="h-40 w-full bg-gray-100 border-b-2 border-black flex items-center justify-center overflow-hidden relative">
                         <Image src={product.image || '/placeholder.svg'} alt={product.name} layout="fill" objectFit="cover" className="group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="p-4">
                         <h3 className="font-black text-lg leading-none uppercase mb-2 group-hover:underline decoration-2 decoration-[#FBC02D]">{product.name}</h3>
                         <p className="bg-black text-white inline-block px-2 py-1 font-bold text-sm">{product.price / 1000}K</p>
                      </div>
                   </div>
                 ))}
               </div>
             )}
          </div>
        </div>

        {/* BAGIAN KANAN: CART */}
        <div className="w-[400px] bg-white flex flex-col border-l-4 border-black relative z-10">
           <div className="p-6 bg-black text-white border-b-4 border-black"><h2 className="font-black text-2xl tracking-widest uppercase">Current Order</h2></div>
           
           <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[url('/noise.png')]">
             {cart.map((item) => (
               <div key={item.id} className="flex flex-col bg-white border-2 border-black shadow-[4px_4px_0px_0px_gray] p-3">
                 <div className="flex justify-between"><span className="font-black uppercase">{item.name}</span><span className="font-mono font-bold">{(item.price * item.qty).toLocaleString()}</span></div>
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
                <div className="flex items-center justify-center h-full text-center text-gray-400">
                    <p className="font-mono text-sm">Keranjang kosong. <br/> Klik menu di samping untuk menambahkan.</p>
                </div>
             )}
           </div>

           <div className="p-6 bg-[#F5F5F5] border-t-4 border-black space-y-4">
              <div className="bg-white border-2 border-black p-4 flex justify-between items-center shadow-[4px_4px_0px_0px_black]">
                 <span className="font-bold text-sm uppercase tracking-widest text-gray-500">Total</span>
                 <span className="font-black text-3xl">Rp {grandTotal.toLocaleString()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <button 
                   onClick={handleCashPayment} 
                   disabled={isProcessingPayment || cart.length === 0} 
                   className="bg-white border-2 border-black py-4 font-black uppercase shadow-[4px_4px_0px_0px_black] active:shadow-none hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {isProcessingPayment ? 'MEMPROSES...' : 'CASH'}
                 </button>
                 
                 <button onClick={handlePayment} disabled={isProcessingPayment || cart.length === 0} className="bg-[#FBC02D] border-2 border-black py-4 font-black uppercase shadow-[4px_4px_0px_0px_black] active:shadow-none flex flex-col items-center justify-center leading-none hover:bg-yellow-400 disabled:opacity-50 disabled:cursor-not-allowed">
                   {isProcessingPayment ? 'MEMPROSES...' : <><span>QRIS</span><span className="text-[10px] mt-1 font-mono">MIDTRANS</span></>}
                 </button>
              </div>
           </div>
        </div>
      </div>
    </>
  );
}