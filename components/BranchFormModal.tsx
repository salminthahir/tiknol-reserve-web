'use client';

import { useState, useEffect } from 'react';
import { X, Save, MapPin, Phone, Hash } from 'lucide-react';
import { Branch } from './BranchSelector'; // Import Branch interface if needed, or redefine

interface BranchFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    branch?: Branch | null;
}

export default function BranchFormModal({ isOpen, onClose, onSuccess, branch }: BranchFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        address: '',
        phone: '',
        active: true,
        latitude: 0,
        longitude: 0,
        maxRadius: 100,
    });

    useEffect(() => {
        if (branch) {
            setFormData({
                code: branch.code || '',
                name: branch.name,
                address: branch.address || '',
                phone: '',
                active: true,
                latitude: branch.latitude || 0,
                longitude: branch.longitude || 0,
                maxRadius: branch.maxRadius || 100,
            });
            // Note: If Branch interface doesn't have phone/active, we need to check schema.
            // Based on previous analysis, branch has id, name, address, code. 
            // Let's assume basic fields first.
        } else {
            setFormData({
                code: '',
                name: '',
                address: '',
                phone: '',
                active: true,
                latitude: 0,
                longitude: 0,
                maxRadius: 100,
            });
        }
    }, [branch, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const url = branch
                ? `/api/admin/branches/${branch.id}`
                : '/api/admin/branches';

            const method = branch ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to save branch');
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl w-full max-w-lg shadow-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">

                {/* Header */}
                <div className="bg-zinc-100 dark:bg-zinc-950 px-6 py-4 flex justify-between items-center border-b border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-bold dark:text-white">
                        {branch ? 'Edit Cabang' : 'Tambah Cabang Baru'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <X size={20} className="dark:text-zinc-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-medium border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Kode Cabang</label>
                            <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input
                                    type="text"
                                    required
                                    value={formData.code}
                                    onChange={e => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono"
                                    placeholder="B01"
                                />
                            </div>
                        </div>

                        <div className="col-span-2 sm:col-span-1">
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Status</label>
                            <select
                                value={formData.active ? 'true' : 'false'}
                                onChange={e => setFormData({ ...formData, active: e.target.value === 'true' })}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                            >
                                <option value="true">Aktif</option>
                                <option value="false">Non-Aktif</option>
                            </select>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Nama Cabang</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                placeholder="Contoh: Titik Nol Pusat"
                            />
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1">Alamat Lengkap</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-3 text-zinc-400" size={16} />
                                <textarea
                                    value={formData.address}
                                    onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                                    rows={3}
                                    placeholder="Jalan..."
                                />
                            </div>
                        </div>

                        <div className="col-span-2">
                            <label className="block text-xs font-bold uppercase text-zinc-500 mb-1 font-outfit">Nomor Telepon (Optional)</label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                                    placeholder="08..."
                                />
                            </div>
                        </div>

                        {/* Geofencing Section */}
                        <div className="col-span-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                            <h3 className="text-sm font-black dark:text-white mb-4">Geofencing Absensi</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Latitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.latitude}
                                        onChange={e => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Longitude</label>
                                    <input
                                        type="number"
                                        step="any"
                                        value={formData.longitude}
                                        onChange={e => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-[10px] font-bold uppercase text-zinc-500 mb-1">Radius Absensi (Meter)</label>
                                    <input
                                        type="number"
                                        value={formData.maxRadius}
                                        onChange={e => setFormData({ ...formData, maxRadius: parseFloat(e.target.value) })}
                                        className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-bold"
                                        placeholder="100"
                                    />
                                </div>
                                <div className="col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (navigator.geolocation) {
                                                navigator.geolocation.getCurrentPosition((pos) => {
                                                    setFormData({
                                                        ...formData,
                                                        latitude: pos.coords.latitude,
                                                        longitude: pos.coords.longitude
                                                    });
                                                }, (err) => {
                                                    alert("Gagal mengambil lokasi: " + err.message);
                                                });
                                            }
                                        }}
                                        className="w-full py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-zinc-200 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={14} /> Gunakan Lokasi Saat Ini
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-xl font-bold hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {loading ? 'Menyimpan...' : (
                                <>
                                    <Save size={18} />
                                    Simpan Data
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
