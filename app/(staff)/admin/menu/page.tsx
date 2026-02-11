'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Plus, Upload, Trash2, Edit2, LayoutGrid, List as ListIcon, Loader2, X, Check, Save, DollarSign } from 'lucide-react';

type Branch = { id: string; name: string; code: string };
type BranchPriceEntry = { branchId: string; branchPrice: number | null; isAvailable: boolean };

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
  productBranches?: BranchPriceEntry[];
};

export default function MenuManagerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  // Search & Filter
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadPreview, setUploadPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Branch Pricing State
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchPrices, setBranchPrices] = useState<Record<string, string>>({});
  const [branchAvailability, setBranchAvailability] = useState<Record<string, boolean>>({});

  // Form Data
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    price: '',
    category: 'COFFEE',
    image: '',
    hasCustomization: false,
    customizationOptions: {
      temps: ['ICE', 'HOT'],
      sizes: ['REGULAR', 'MEDIUM', 'LARGE']
    }
  });

  const [currentUser, setCurrentUser] = useState<{ branchId: string; isGlobalAccess: boolean } | null>(null);

  // --- FETCH DATA ---
  useEffect(() => {
    fetchUserSession();
    fetchProducts();
    fetchBranches();
  }, []);

  const fetchUserSession = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setCurrentUser(data);
      }
    } catch (e) { console.error("Session fetch error", e); }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch('/api/branches');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setBranches(data);
      }
    } catch (err) { console.error('Failed to fetch branches:', err); }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch all products with their branch data
      const res = await fetch('/api/admin/products');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          // Calculate global availability: READY if at least one branch has it available
          const mappedData = data.map((p: any) => ({
            ...p,
            isAvailable: p.productBranches && p.productBranches.length > 0
              ? p.productBranches.some((pb: any) => pb.isAvailable)
              : true // Default to true if no branch data (legacy/fallback)
          }));
          setProducts(mappedData);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  // --- IMAGE UPLOAD HANDLER ---
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("File size too large (Max 2MB)");
      return;
    }

    setIsUploading(true);
    const uploadData = new FormData();
    uploadData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: uploadData
      });

      if (res.ok) {
        const data = await res.json();
        setFormData(prev => ({ ...prev, image: data.url }));
        setUploadPreview(data.url); // Show new image immediately
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error}`);
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed due to network error.");
    } finally {
      setIsUploading(false);
    }
  };

  // --- CRUD HANDLERS ---
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = { ...formData, price: Number(formData.price) };
      let res;

      if (editMode) {
        res = await fetch('/api/admin/products', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch('/api/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        const savedProduct = await res.json();

        // Save branch prices (only in edit mode, because POST auto-creates with null prices)
        if (editMode) {
          // Iterate over ALL branches to save availability even if price is not set
          for (const branch of branches) {
            const branchId = branch.id;
            const priceStr = branchPrices[branchId] || '';
            const branchPrice = priceStr.trim() === '' ? null : Number(priceStr);
            const isAvailable = branchAvailability[branchId] ?? true;

            await fetch('/api/admin/products', {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: formData.id,
                branchId,
                branchPrice,
                isAvailable
              })
            });
          }
        }

        if (editMode) {
          setProducts(prev => prev.map(p => p.id === formData.id ? { ...savedProduct, isAvailable: p.isAvailable } : p));
        } else {
          setProducts(prev => [savedProduct, ...prev]);
        }
        setIsModalOpen(false);
        // Refresh to get latest branch prices
        fetchProducts();
      } else {
        alert("Failed to save product.");
      }
    } catch (error) {
      console.error(error);
      alert("Error saving product.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    // Optimistic
    setProducts(prev => prev.filter(p => p.id !== id));

    try {
      await fetch('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
    } catch (error) {
      fetchProducts(); // Revert
      alert("Failed to delete.");
    }
  };

  const toggleAvailability = async (product: Product) => {
    // In Global View, toggling might be ambiguous if we don't know for which branch.
    // BUT, the existing logic sends { isAvailable: !p.isAvailable } to PUT /products.
    // The backend PUT handles this by updating ProductBranch based on... wait, the backend 
    // requires 'branchId' to update ProductBranch. If no branchId, it updates Product (which now ignores isAvailable).

    // CRITICAL FIX: The "Quick Toggle" on the main card/list doesn't specify a branch.
    // It likely sends a request without branchId, which the backend now IGNORES for isAvailable.
    // That's why it "does nothing".

    // We must disable the Quick Toggle on the main list if it's a global view
    // OR make it toggle for ALL branches (dangerous?)
    // OR prompt to select branch.

    // For now, let's ALERT the user that they must use Edit > Branch Toggle.
    alert("Please use the EDIT button to manage availability per Branch.");
    return;

    /* 
       Old Logic (Disabled because it doesn't work with Multi-Branch):
       setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isAvailable: !p.isAvailable } : p));
       await fetch('/api/admin/products', ...); 
    */
  };

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditMode(true);
      setFormData({
        id: product.id,
        name: product.name,
        price: product.price.toString(),
        category: product.category,
        image: product.image || '',
        hasCustomization: product.hasCustomization || false,
        customizationOptions: product.customizationOptions || { temps: ['ICE', 'HOT'], sizes: ['REGULAR'] }
      });
      setUploadPreview(product.image || null);

      // Populate branch prices and availability from product data
      const bpMap: Record<string, string> = {};
      const baMap: Record<string, boolean> = {};

      product.productBranches?.forEach(pb => {
        bpMap[pb.branchId] = pb.branchPrice !== null ? pb.branchPrice.toString() : '';
        baMap[pb.branchId] = pb.isAvailable;
      });

      // Initialize availability for all branches (default to true if not set)
      branches.forEach(b => {
        if (baMap[b.id] === undefined) baMap[b.id] = true;
      });

      setBranchPrices(bpMap);
      setBranchAvailability(baMap);
    } else {
      setEditMode(false);
      setFormData({
        id: '',
        name: '',
        price: '',
        category: 'COFFEE',
        image: '',
        hasCustomization: false,
        customizationOptions: { temps: ['ICE', 'HOT'], sizes: ['REGULAR'] }
      });
      setUploadPreview(null);
      setBranchPrices({});
      setBranchAvailability({});
    }
    setIsModalOpen(true);
  };

  // --- FILTERING ---
  const categories = ['ALL', 'COFFEE', 'NON-COFFEE', 'SNACK', 'MEALS'];
  const filteredProducts = products.filter(p => {
    const matchCat = activeCategory === 'ALL' || p.category === activeCategory;
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] font-sans text-black p-4 lg:p-8">
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 gap-4 border-b-4 border-black pb-6">
        <div>
          <div className="flex gap-2 mb-2 text-xs font-bold text-gray-400">
            <Link href="/admin/dashboard" className="hover:text-black hover:underline">DASHBOARD</Link>
            <span>/</span>
            <span className="text-black">MENU MANAGER</span>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black italic uppercase tracking-tighter">
            MENU <span className="bg-[#FBC02D] px-2 text-black">MANAGER</span>
          </h1>
          <p className="font-bold text-gray-500 mt-2">Manage your products, prices, and availability.</p>
        </div>

        <div className="flex flex-col gap-2 w-full lg:w-auto">
          <button
            onClick={() => handleOpenModal()}
            className="bg-black text-white px-6 py-3 font-black uppercase text-base lg:text-lg border-2 border-transparent hover:bg-white hover:text-black hover:border-black shadow-[4px_4px_0px_0px_black] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-2"
          >
            <Plus size={24} /> ADD NEW ITEM
          </button>
          <div className="flex bg-white border-2 border-black p-1 gap-1 w-full lg:w-auto">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search menu..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-2 py-2 text-sm font-bold focus:outline-none placeholder:font-medium"
              />
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 font-black text-xs uppercase border-2 transition-all rounded-full ${activeCategory === cat ? 'bg-black text-white border-black' : 'bg-white text-gray-500 border-gray-200 hover:border-black hover:text-black'}`}
          >
            {cat}
          </button>
        ))}
        <div className="ml-auto flex gap-1 bg-white border border-gray-300 rounded p-1">
          <button onClick={() => setViewMode('GRID')} className={`p-1.5 rounded ${viewMode === 'GRID' ? 'bg-gray-200 text-black' : 'text-gray-400'}`}><LayoutGrid size={16} /></button>
          <button onClick={() => setViewMode('LIST')} className={`p-1.5 rounded ${viewMode === 'LIST' ? 'bg-gray-200 text-black' : 'text-gray-400'}`}><ListIcon size={16} /></button>
        </div>
      </div>

      {/* CONTENT AREA */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin" size={48} />
          <p className="font-black animate-pulse">LOADING DATABASE...</p>
        </div>
      ) : (
        <>
          <div className="mb-4 font-bold text-gray-500 text-sm">SHOWING {filteredProducts.length} ITEMS</div>

          {viewMode === 'GRID' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} className="bg-white border-4 border-black group relative shadow-[6px_6px_0px_0px_#333] hover:-translate-y-1 transition-transform">
                  {/* Available Badge (Click to Edit) */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(product); }}
                    className={`absolute top-3 right-3 z-10 px-3 py-1 font-black text-[10px] uppercase border-2 border-black shadow-[2px_2px_0px_black] hover:scale-110 active:scale-95 transition-all ${product.isAvailable ? 'bg-[#00E676] text-black' : 'bg-red-500 text-white'}`}
                    title="Click to manage Branch Availability"
                  >
                    {product.isAvailable ? 'READY' : 'SOLD OUT'}
                  </button>

                  <div className="aspect-square bg-gray-100 border-b-4 border-black relative overflow-hidden flex items-center justify-center">
                    {product.image ? (
                      <Image src={product.image} alt={product.name} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-gray-300 font-black text-4xl">IMG</span>
                    )}
                  </div>

                  <div className="p-4">
                    <span className="inline-block bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 font-bold mb-2 uppercase">{product.category}</span>
                    <h3 className="font-black text-lg uppercase leading-tight mb-1 line-clamp-2 min-h-[3rem]">{product.name}</h3>
                    <div className="flex justify-between items-center mt-3 border-t-2 border-dashed border-gray-200 pt-3">
                      <span className="font-mono font-bold text-lg">Rp {product.price.toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button onClick={() => handleOpenModal(product)} className="p-2 bg-black text-white hover:bg-[#FBC02D] hover:text-black transition-colors rounded">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-2 bg-gray-100 text-black hover:bg-red-600 hover:text-white transition-colors rounded">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_#333] overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-black text-white border-b-4 border-black uppercase text-xs font-black">
                  <tr>
                    <th className="p-4 w-16">IMG</th>
                    <th className="p-4">Name</th>
                    <th className="p-4">Category</th>
                    <th className="p-4 text-right">Price</th>
                    <th className="p-4 text-center">Status</th>
                    <th className="p-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y-2 divide-gray-100 font-bold text-sm">
                  {filteredProducts.map(product => (
                    <tr key={product.id} className="hover:bg-yellow-50 transition-colors odd:bg-white even:bg-gray-50 border-b border-gray-100">
                      <td className="p-4">
                        <div className="w-12 h-12 bg-gray-200 rounded border border-black overflow-hidden relative">
                          {product.image && <Image src={product.image} alt="" fill className="object-cover" />}
                        </div>
                      </td>
                      <td className="p-4 uppercase">{product.name}</td>
                      <td className="p-4"><span className="bg-gray-100 px-2 py-1 text-xs text-gray-500 rounded">{product.category}</span></td>
                      <td className="p-4 text-right font-mono">Rp {product.price.toLocaleString()}</td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleOpenModal(product)}
                          className={`px-3 py-1 rounded text-xs font-black hover:opacity-80 transition-opacity ${product.isAvailable ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                        >
                          {product.isAvailable ? 'ACTIVE' : 'INACTIVE'}
                        </button>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-2">
                          <button onClick={() => handleOpenModal(product)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded"><Edit2 size={16} /></button>
                          <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Trash2 size={16} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {filteredProducts.length === 0 && (
            <div className="text-center py-20 text-gray-400 font-bold italic">NO ITEMS FOUND</div>
          )}
        </>
      )}

      {/* EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl border-4 border-black shadow-[12px_12px_0px_black] overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-black text-white p-4 flex justify-between items-center shrink-0">
              <h2 className="font-black text-xl italic uppercase tracking-wider">{editMode ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-[#FBC02D]"><X size={24} /></button>
            </div>

            <div className="p-6 overflow-y-auto">
              <form onSubmit={handleSave} className="space-y-6">
                <div className="flex flex-col sm:flex-row gap-6">
                  {/* Image Upload Section */}
                  <div className="w-full sm:w-1/3 shrink-0">
                    <label className="block text-xs font-black uppercase mb-2">Product Image</label>
                    <div
                      className="border-2 border-dashed border-gray-400 bg-gray-50 aspect-square rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-yellow-50 hover:border-black transition-colors relative overflow-hidden group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadPreview ? (
                        <>
                          <Image src={uploadPreview} alt="Preview" fill className="object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-white font-bold text-xs">CHANGE IMAGE</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <Upload className="text-gray-400 mb-2" size={32} />
                          <span className="text-xs font-bold text-gray-400 text-center px-4">CLICK TO UPLOAD</span>
                        </>
                      )}
                      {isUploading && (
                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                          <Loader2 className="animate-spin" />
                        </div>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                    />
                    <p className="text-[10px] text-gray-400 mt-2 font-medium text-center">Max size: 2MB. Format: JPG, PNG.</p>
                  </div>

                  {/* Main Details */}
                  <div className="flex-1 space-y-4">
                    <div>
                      <label className="block text-xs font-black uppercase mb-1">Item Name</label>
                      <input
                        required
                        type="text"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        className="w-full border-2 border-black rounded p-3 font-bold focus:outline-none focus:shadow-[4px_4px_0px_#FBC02D]"
                        placeholder="E.g. Iced Americano"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Price (IDR)</label>
                        <input
                          required
                          type="number"
                          value={formData.price}
                          onChange={e => setFormData({ ...formData, price: e.target.value })}
                          className="w-full border-2 border-black rounded p-3 font-mono font-bold focus:outline-none focus:shadow-[4px_4px_0px_#FBC02D]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase mb-1">Category</label>
                        <select
                          value={formData.category}
                          onChange={e => setFormData({ ...formData, category: e.target.value })}
                          className="w-full border-2 border-black rounded p-3 font-bold bg-white focus:outline-none focus:shadow-[4px_4px_0px_#FBC02D]"
                        >
                          {categories.filter(c => c !== 'ALL').map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customization Toggle */}
                <div className="pt-4 border-t border-gray-200">
                  <label className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-black transition-colors">
                    <div className={`w-5 h-5 border-2 border-black flex items-center justify-center ${formData.hasCustomization ? 'bg-black text-white' : 'bg-white'}`}>
                      {formData.hasCustomization && <Check size={14} />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={formData.hasCustomization}
                      onChange={e => setFormData({ ...formData, hasCustomization: e.target.checked })}
                    />
                    <span className="font-bold text-sm uppercase">Enable Customization (Size/Temp)</span>
                  </label>
                  {formData.hasCustomization && (
                    <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-400 rounded-lg animate-in slide-in-from-top-2 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Temperature Options */}
                        <div>
                          <p className="text-xs font-black uppercase mb-2">Temperature</p>
                          <div className="flex flex-wrap gap-2">
                            {['ICE', 'HOT'].map(temp => (
                              <label key={temp} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border-2 border-black rounded shadow-[2px_2px_0px_black] active:translate-y-0.5 active:shadow-none transition-all">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-black"
                                  checked={formData.customizationOptions?.temps?.includes(temp) || false}
                                  onChange={(e) => {
                                    const currentTemps = formData.customizationOptions?.temps || [];
                                    const newTemps = e.target.checked
                                      ? [...currentTemps, temp]
                                      : currentTemps.filter(t => t !== temp);
                                    setFormData({
                                      ...formData,
                                      customizationOptions: { ...formData.customizationOptions!, temps: newTemps }
                                    });
                                  }}
                                />
                                <span className="text-xs font-bold">{temp}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Size Options */}
                        <div>
                          <p className="text-xs font-black uppercase mb-2">Size</p>
                          <div className="flex flex-wrap gap-2">
                            {['REGULAR', 'MEDIUM', 'LARGE'].map(size => (
                              <label key={size} className="flex items-center gap-2 cursor-pointer bg-white px-3 py-2 border-2 border-black rounded shadow-[2px_2px_0px_black] active:translate-y-0.5 active:shadow-none transition-all">
                                <input
                                  type="checkbox"
                                  className="w-4 h-4 accent-black"
                                  checked={formData.customizationOptions?.sizes?.includes(size) || false}
                                  onChange={(e) => {
                                    const currentSizes = formData.customizationOptions?.sizes || [];
                                    const newSizes = e.target.checked
                                      ? [...currentSizes, size]
                                      : currentSizes.filter(s => s !== size);
                                    setFormData({
                                      ...formData,
                                      customizationOptions: { ...formData.customizationOptions!, sizes: newSizes }
                                    });
                                  }}
                                />
                                <span className="text-xs font-bold">{size}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Branch Pricing & Availability Section */}
                {editMode && branches.length > 0 && (
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign size={16} className="text-[#FBC02D]" />
                      <span className="font-black text-xs uppercase">Ketersediaan & Harga Per Cabang</span>
                    </div>
                    <div className="space-y-2">
                      {branches
                        .filter(b => {
                          // If global access, show all. If not, only show user's branch
                          if (!currentUser) return false;
                          if (currentUser.isGlobalAccess) return true;
                          // Check if user is explicit "Head Office" logic? 
                          // For now, rely on isGlobalAccess + matching branchId
                          return b.id === currentUser.branchId;
                        })
                        .map(branch => {
                          const isAvail = branchAvailability[branch.id] ?? true;
                          return (
                            <div key={branch.id} className={`flex items-center gap-3 border rounded-lg p-2.5 transition-colors ${isAvail ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'}`}>
                              <div className="flex-1">
                                <p className={`font-bold text-xs uppercase ${!isAvail && 'text-red-500 line-through'}`}>{branch.name}</p>
                                <p className="text-[10px] text-gray-400">{branch.code}</p>
                              </div>

                              {/* Availability Toggle */}
                              <label className="flex items-center gap-2 cursor-pointer mr-2">
                                <div className={`w-8 h-4 rounded-full relative transition-colors ${isAvail ? 'bg-green-500' : 'bg-gray-300'}`}>
                                  <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-transform ${isAvail ? 'left-4.5' : 'left-0.5'}`} style={{ left: isAvail ? '18px' : '2px' }}></div>
                                </div>
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={isAvail}
                                  onChange={e => setBranchAvailability(prev => ({ ...prev, [branch.id]: e.target.checked }))}
                                />
                                <span className="text-[10px] font-bold uppercase w-12">{isAvail ? 'READY' : 'EMPTY'}</span>
                              </label>

                              <div className="relative w-32">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">Rp</span>
                                <input
                                  type="number"
                                  disabled={!isAvail}
                                  placeholder={formData.price || '0'}
                                  value={branchPrices[branch.id] || ''}
                                  onChange={e => setBranchPrices(prev => ({ ...prev, [branch.id]: e.target.value }))}
                                  className="w-full border-2 border-gray-300 rounded p-1.5 pl-7 font-mono font-bold text-sm focus:outline-none focus:border-black text-right disabled:bg-gray-100 disabled:text-gray-400"
                                />
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting || isUploading}
                  className="w-full bg-[#00995E] text-white py-4 font-black uppercase tracking-wider text-lg border-2 border-black shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-[#00B870] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <><Save size={20} /> SAVE PRODUCT</>}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}