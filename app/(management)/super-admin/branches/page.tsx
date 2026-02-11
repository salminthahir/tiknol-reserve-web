'use client';

import { useState, useEffect } from 'react';
import { Plus, Search, MapPin, Edit, Trash2, Building2 } from 'lucide-react';
import BranchFormModal from '@/components/BranchFormModal';
import { Branch } from '@/components/BranchSelector';

export default function BranchManagementPage() {
    const [branches, setBranches] = useState<Branch[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);

    const fetchBranches = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/branches'); // Re-use public or make admin-specific? 
            // Admin API: /api/admin/branches usually returns full details.
            // But we have /api/branches (public) and /api/admin/branches (protected).
            // Let's use /api/admin/branches if possible, assuming user is logged in as super admin.
            const data = await res.json();
            if (Array.isArray(data)) {
                setBranches(data);
            }
        } catch (error) {
            console.error('Failed to fetch branches', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBranches();
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah anda yakin ingin menghapus cabang ini? Data yang terkait mungkin akan terpengaruh.')) return;

        try {
            const res = await fetch(`/api/admin/branches/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchBranches();
            } else {
                alert('Gagal menghapus cabang');
            }
        } catch (error) {
            console.error(error);
            alert('Terjadi kesalahan');
        }
    };

    const filteredBranches = branches.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase()) ||
        b.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="p-6 md:p-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-zinc-900 dark:text-white flex items-center gap-3">
                        <Building2 className="text-emerald-500" size={32} />
                        Branch Management
                    </h1>
                    <p className="text-zinc-500 dark:text-zinc-400 mt-1">Kelola daftar cabang outlet.</p>
                </div>
                <button
                    onClick={() => { setSelectedBranch(null); setIsModalOpen(true); }}
                    className="flex items-center gap-2 bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                >
                    <Plus size={20} />
                    Tambah Cabang
                </button>
            </div>

            {/* Filter */}
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl shadow-sm border border-zinc-100 dark:border-zinc-800 mb-6 sticky top-20 z-10">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
                    <input
                        type="text"
                        placeholder="Cari cabang (Nama, Kode)..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800 border-none rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="text-center py-20 text-zinc-500">Loading branches...</div>
            ) : filteredBranches.length === 0 ? (
                <div className="text-center py-20 text-zinc-500 bg-zinc-50 rounded-3xl border border-dashed border-zinc-200">
                    <Building2 size={48} className="mx-auto mb-4 opacity-20" />
                    <p>Tidak ada cabang ditemukan</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBranches.map((branch) => (
                        <div key={branch.id} className="group bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 p-5 rounded-2xl hover:shadow-xl hover:border-emerald-500/30 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-mono font-bold px-3 py-1 rounded-lg text-sm">
                                    {branch.code}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setSelectedBranch(branch); setIsModalOpen(true); }}
                                        className="p-2 bg-zinc-100 hover:bg-blue-100 text-zinc-600 hover:text-blue-600 rounded-lg transition-colors"
                                    >
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(branch.id)}
                                        className="p-2 bg-zinc-100 hover:bg-red-100 text-zinc-600 hover:text-red-600 rounded-lg transition-colors"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="font-bold text-lg text-zinc-900 dark:text-white mb-2">{branch.name}</h3>

                            {branch.address && (
                                <div className="flex items-start gap-2 text-zinc-500 dark:text-zinc-400 text-sm mb-4 min-h-[40px]">
                                    <MapPin size={16} className="mt-0.5 shrink-0" />
                                    <p className="line-clamp-2">{branch.address}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            <BranchFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => {
                    fetchBranches();
                    // setIsModalOpen(false); // handled by onClose? No, usuall separate.
                }}
                branch={selectedBranch}
            />
        </div>
    );
}
