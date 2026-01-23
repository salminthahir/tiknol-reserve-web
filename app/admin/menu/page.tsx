'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link'; // Untuk Navigasi

type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  isAvailable: boolean;
  image: string;
};

// --- DATA MENU STATIS UNTUK MIGRASI ---
const STATIC_SEED_DATA = [
  // --- KATEGORI: COFFEE ---
  { category: 'COFFEE', name: 'TIKNOL KOPI', price: 20000, description: 'Signature coffee blend. Creamy, bold, and distinct.', image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'AMERICANO', price: 20000, description: 'Espresso shot dengan air mineral. Tersedia panas/dingin.', image: 'https://images.unsplash.com/photo-1551030173-122f523535c3?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'KOPI AREN', price: 20000, description: 'Kopi susu dengan gula aren asli yang legit.', image: 'https://images.unsplash.com/photo-1461023058943-48dbf13994c6?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'COCONUT KOPI', price: 20000, description: 'Perpaduan kopi dengan rasa kelapa yang gurih dan segar.', image: 'https://images.unsplash.com/photo-1595981267035-7b04ca84a82d?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'KLEPON KOPI', price: 20000, description: 'Rasa jajanan pasar Klepon (Pandan & Kelapa) dalam kopi.', image: 'https://images.unsplash.com/photo-1626500145961-d7790b4d4586?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'CARAMEL MACHIATO', price: 20000, description: 'Espresso, vanilla, steamed milk, dan drizzle caramel.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'HAZELNUT KOPI', price: 20000, description: 'Kopi susu dengan aroma kacang Hazelnut yang wangi.', image: 'https://images.unsplash.com/photo-1632054010678-7f2e5a1a7355?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'VANILLA KOPI', price: 20000, description: 'Klasik kopi susu dengan sirup Vanilla yang lembut.', image: 'https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'CAPPUCINO', price: 20000, description: 'Espresso dengan foam susu tebal. Tersedia Panas/Dingin.', image: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'V60 MANUAL BREW', price: 20000, description: 'Seduhan manual pour-over. Tanya barista untuk beans.', image: 'https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=800&q=80' },
  { category: 'COFFEE', name: 'TITIK LITERAN', price: 115000, description: 'Kopi botolan 1 Liter untuk stok di rumah/kantor.', image: 'https://images.unsplash.com/photo-1606791405555-41c36b745421?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'MATCHA', price: 20000, description: 'Green tea Jepang creamy. Tersedia Panas/Dingin.', image: 'https://images.unsplash.com/photo-1515823662972-da6a2e4d3002?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'RED VELVET', price: 20000, description: 'Rasa kue Red Velvet dalam bentuk minuman.', image: 'https://images.unsplash.com/photo-1566318956977-3e6f66293427?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'TARO MILK', price: 20000, description: 'Minuman rasa ubi ungu yang manis, gurih, dan milky.', image: 'https://images.unsplash.com/photo-1558857563-b371033873b8?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'COKLAT MILK', price: 20000, description: 'Susu coklat klasik yang rich. Comfort drink terbaik.', image: 'https://images.unsplash.com/photo-1542990253-0d0f5be5f0ed?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'TIKNOL SODA', price: 20000, description: 'Minuman soda segar racikan spesial Titik Nol.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'STROBERI TEA', price: 20000, description: 'Teh rasa stroberi yang asam manis menyegarkan.', image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'LEMON TEA', price: 20000, description: 'Teh dengan perasan lemon asli. Vitamin C booster.', image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=80' },
  { category: 'NON-COFFEE', name: 'TIKNOL CURAH', price: 20000, description: 'Minuman botolan praktis siap minum.', image: 'https://images.unsplash.com/photo-1625244515599-4d6cb4b21644?auto=format&fit=crop&w=800&q=80' },
  { category: 'MEALS', name: 'NASI CKN TERIYAKI', price: 23000, description: 'Nasi dengan ayam saus Teriyaki jepang yang manis gurih.', image: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=80' },
  { category: 'MEALS', name: 'NASGOR TIKNOL', price: 23000, description: 'Nasi goreng spesial bumbu rahasia dapur Titik Nol.', image: 'https://images.unsplash.com/photo-1603133872878-684f208fb74b?auto=format&fit=crop&w=800&q=80' },
  { category: 'MEALS', name: 'NASGOR S. ROA', price: 23000, description: 'Nasi goreng pedas dengan aroma khas ikan asap Sambal Roa.', image: 'https://images.unsplash.com/photo-1636136701831-7b0292500d0f?auto=format&fit=crop&w=800&q=80' },
  { category: 'MEALS', name: 'SATE TAICHAN', price: 23000, description: 'Sate ayam daging putih dengan sambal pedas nampol.', image: 'https://images.unsplash.com/photo-1529563021898-1d1565e38fa9?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'INDOMIE GORENG', price: 13000, description: 'Indomie goreng perfectly al dente + Telur.', image: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'INDOMIE KUAH', price: 13000, description: 'Indomie rebus hangat dengan sayur dan telur.', image: 'https://images.unsplash.com/photo-1596450531557-4d7a8bffa931?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'NASI PUTIH', price: 5000, description: 'Nasi putih hangat tambahan.', image: 'https://images.unsplash.com/photo-1576449177114-19280a58145b?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'TAHU WALIK', price: 18000, description: 'Tahu goreng dibalik dengan isian aci daging yang kenyal.', image: 'https://images.unsplash.com/photo-1630402773295-d6d7b420f18c?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'KENTANG GORENG', price: 18000, description: 'Classic french fries. Gurih dan renyah.', image: 'https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'PIS-GOR S. ROA', price: 23000, description: 'Pisang goreng cocol sambal roa, kombinasi unik Manado.', image: 'https://images.unsplash.com/photo-1628325852553-61b474cc0419?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'CHEESE ROLL', price: 13000, description: 'Keju lumer dibalut kulit lumpia renyah.', image: 'https://images.unsplash.com/photo-1600492080034-7299a9103e5c?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'CHURROS', price: 13000, description: 'Donat spanyol dengan taburan gula kayu manis & saus coklat.', image: 'https://images.unsplash.com/photo-1624371414361-e670edf4898d?auto=format&fit=crop&w=800&q=80' },
  { category: 'SNACK', name: 'DONAT KENTANG', price: 18000, description: '2 pcs Donat kentang klasik yang empuk.', image: 'https://images.unsplash.com/photo-1527515545081-75a45e197b06?auto=format&fit=crop&w=800&q=80' },
];

export default function MenuManagerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Modal & Form
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    id: '', name: '', price: '', category: 'COFFEE', image: ''
  });
  const [isSeeding, setIsSeeding] = useState(false);

  // 1. FETCH DATA (Ambil dari Database saat halaman dibuka)
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/products');
      
      if (!res.ok) {
        // Jika status HTTP bukan 2xx, lempar error
        throw new Error(`Gagal mengambil data: Status ${res.status}`);
      }

      const data = await res.json();

      // Pastikan data adalah array sebelum di-set
      if (Array.isArray(data)) {
        setProducts(data);
      } else {
        // Jika data bukan array (misal: objek error dari API)
        console.error("Data yang diterima bukan array:", data);
        throw new Error("Format data tidak sesuai.");
      }

    } catch (error: any) {
      console.error(error);
      alert(`Terjadi kesalahan: ${error.message}`);
      setProducts([]); // Kosongkan produk agar tidak crash
    } finally {
      setIsLoading(false);
    }
  };

  // 2. HANDLE SAVE (Kirim ke Database)
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      let res;
      if (editMode) {
        // Update Menu
        res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, price: Number(formData.price) }),
        });
      } else {
        // Buat Menu Baru
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...formData, price: Number(formData.price) }),
        });
      }

      if (res.ok) {
        alert(editMode ? "Menu berhasil diupdate!" : "Menu berhasil ditambahkan!");
        fetchProducts(); // Refresh tabel
        setIsModalOpen(false);
      } else {
        const errorData = await res.json();
        alert(`Gagal menyimpan menu: ${errorData.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Terjadi kesalahan saat menyimpan menu.");
    }
  };

  // 3. HANDLE DELETE & TOGGLE
  const handleDelete = async (id: string) => {
    if (!confirm('Yakin hapus menu ini?')) return;
    await fetch('/api/admin/products', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    fetchProducts();
  };

  const toggleAvailability = async (product: Product) => {
    // Optimistic Update (Biar cepat di UI)
    setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
    
    // Kirim ke Server
    await fetch('/api/admin/products', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: product.id, isAvailable: !product.isAvailable }),
    });
  };

  // Helper buka modal
  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditMode(true);
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        image: product.image || ''
      });
    } else {
      setEditMode(false);
      setFormData({ id: '', name: '', price: '', category: 'COFFEE', image: '' });
    }
    setIsModalOpen(true);
  };

  // 4. FUNGSI SEMENTARA UNTUK MIGRASI DATA
  const handleSeedDatabase = async () => {
    if (!confirm('Ini akan menambahkan 30+ item menu ke database. Lanjutkan?')) return;

    setIsSeeding(true);
    let successCount = 0;
    let failCount = 0;

    // Cek dulu produk yang sudah ada agar tidak duplikat
    const existingNames = new Set(products.map(p => p.name.toUpperCase()));

    const newItems = STATIC_SEED_DATA.filter(item => !existingNames.has(item.name.toUpperCase()));

    if (newItems.length === 0) {
      alert("Semua menu dari data statis sepertinya sudah ada di database. Tidak ada yang ditambahkan.");
      setIsSeeding(false);
      return;
    }

    await Promise.all(newItems.map(async (item) => {
      try {
        const res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: item.name,
            price: item.price,
            category: item.category,
            image: item.image,
            description: item.description || "",
          }),
        });
        if (res.ok) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
        console.error("Gagal mengirim item:", item.name, error);
      }
    }));

    alert(`Proses Selesai!\n\nBerhasil ditambahkan: ${successCount} menu.\nGagal: ${failCount} menu.\n\nMemuat ulang daftar menu...`);
    fetchProducts();
    setIsSeeding(false);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] text-black font-sans p-8">
      {/* NAVIGASI SEDERHANA */}
      <div className="flex gap-4 mb-8 border-b-2 border-gray-300 pb-4">
         <Link href="/admin/dashboard" className="font-bold hover:underline">← BACK TO DASHBOARD</Link>
         <span className="text-gray-400">|</span>
         <Link href="/admin/pos" className="font-bold text-[#FBC02D] hover:underline">OPEN POS SYSTEM →</Link>
      </div>

      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter uppercase mb-2">
            MENU <span className="bg-[#FBC02D] px-2">MANAGER</span>
          </h1>
          <p className="font-bold text-gray-500 font-mono">DATABASE PUSAT KONTROL PRODUK</p>
        </div>
        <div className="flex gap-4">
          <button 
             onClick={handleSeedDatabase} 
             disabled={isSeeding}
             className="bg-red-500 text-white px-8 py-4 font-black uppercase text-lg border-2 border-transparent hover:bg-white hover:text-red-500 hover:border-red-500 shadow-[6px_6px_0px_0px_black] active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
           >
             {isSeeding ? 'MIGRASI DATA...' : 'MIGRASI MENU LAMA'}
           </button>
          <button onClick={() => handleOpenModal()} className="bg-black text-white px-8 py-4 font-black uppercase text-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-[6px_6px_0px_0px_black] active:shadow-none transition-all">
            + ADD NEW ITEM
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center font-bold text-2xl animate-pulse">LOADING DATABASE...</div>
      ) : (
        <div className="overflow-x-auto border-4 border-black bg-white shadow-[8px_8px_0px_0px_black]">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white uppercase text-sm tracking-widest border-b-4 border-black">
                <th className="p-4 border-r-2 border-white/20">Status</th>
                <th className="p-4 border-r-2 border-white/20">Item Name</th>
                <th className="p-4 border-r-2 border-white/20">Category</th>
                <th className="p-4 border-r-2 border-white/20 text-right">Price</th>
                <th className="p-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {products.map((product) => (
                <tr key={product.id} className="border-b-2 border-black hover:bg-yellow-50 transition-colors">
                  <td className="p-4 border-r-2 border-black w-[100px]">
                    <button 
                      onClick={() => toggleAvailability(product)}
                      className={`w-full py-1 text-xs font-black uppercase border-2 border-black transition-all ${product.isAvailable ? 'bg-[#00E676] text-black shadow-[2px_2px_0px_0px_black]' : 'bg-red-500 text-white opacity-50'}`}
                    >
                      {product.isAvailable ? 'READY' : 'EMPTY'}
                    </button>
                  </td>
                  <td className="p-4 border-r-2 border-black uppercase text-lg">{product.name}</td>
                  <td className="p-4 border-r-2 border-black"><span className="bg-gray-200 px-2 py-1 text-xs border border-black">{product.category}</span></td>
                  <td className="p-4 border-r-2 border-black text-right font-mono">{product.price.toLocaleString()}</td>
                  <td className="p-4 text-center flex justify-center gap-2">
                    <button onClick={() => handleOpenModal(product)} className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-[#FBC02D]">✎</button>
                    <button onClick={() => handleDelete(product.id)} className="w-8 h-8 bg-white border-2 border-black flex items-center justify-center hover:bg-red-500 hover:text-white">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* MODAL FORM SAMA SEPERTI SEBELUMNYA (Tapi action formnya pakai handleSave di atas) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
           <div className="bg-white border-4 border-black w-full max-w-lg shadow-[10px_10px_0px_0px_#FBC02D] relative animate-in fade-in zoom-in duration-200">
             <div className="bg-black text-white p-4 flex justify-between items-center border-b-4 border-black">
                <h2 className="text-xl font-black uppercase italic">{editMode ? 'EDIT ITEM' : 'NEW ITEM'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-white hover:text-red-500 font-bold text-xl">✕</button>
             </div>
             <form onSubmit={handleSave} className="p-6 space-y-4">
                <div>
                  <label className="block font-black text-sm uppercase mb-1">Product Name</label>
                  <input type="text" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-2 border-black p-3 font-bold focus:outline-none focus:bg-yellow-100" placeholder="Ex: KOPI SUSU" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-black text-sm uppercase mb-1">Price (IDR)</label>
                    <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border-2 border-black p-3 font-mono focus:outline-none focus:bg-yellow-100" />
                  </div>
                  <div>
                     <label className="block font-black text-sm uppercase mb-1">Category</label>
                     <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border-2 border-black p-3 font-bold bg-white">
                       <option value="COFFEE">COFFEE</option>
                       <option value="NON-COFFEE">NON-COFFEE</option>
                       <option value="SNACK">SNACK</option>
                       <option value="MEALS">MEALS</option>
                     </select>
                  </div>
                </div>
                <button type="submit" className="w-full py-3 mt-4 font-black bg-[#FBC02D] border-2 border-black shadow-[4px_4px_0px_0px_black] active:shadow-none transition-all uppercase">SAVE ITEM</button>
             </form>
           </div>
        </div>
      )}
    </div>
  );
}