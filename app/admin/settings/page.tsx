'use client';

import { useState, useEffect } from 'react';
import { MapPin, Save, Globe } from 'lucide-react';

export default function SettingsPage() {
    const [settings, setSettings] = useState({
        officeLatitude: '',
        officeLongitude: '',
        maxRadius: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data && !data.error) {
                setSettings({
                    officeLatitude: data.officeLatitude,
                    officeLongitude: data.officeLongitude,
                    maxRadius: data.maxRadius
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) {
                alert('Pengaturan Lokasi Berhasil Disimpan!');
            } else {
                alert('Gagal menyimpan pengaturan.');
            }
        } catch (error) {
            alert('Terjadi kesalahan.');
        } finally {
            setIsSaving(false);
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation tidak didukung browser ini.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings({
                    ...settings,
                    officeLatitude: position.coords.latitude.toString(),
                    officeLongitude: position.coords.longitude.toString()
                });
                alert('Lokasi saat ini berhasil diambil!');
            },
            () => {
                alert('Gagal mengambil lokasi. Pastikan GPS aktif.');
            }
        );
    };

    return (
        <div className="p-6 md:p-10 bg-[#FFF8E1] min-h-screen font-sans">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl font-black text-black tracking-tight uppercase mb-8 flex items-center gap-3">
                    <Globe size={40} className="text-black" />
                    Lokasi Kantor
                </h1>

                <div className="bg-white border-4 border-black rounded-xl p-8 shadow-[12px_12px_0px_black]">
                    <div className="bg-blue-100 border-l-4 border-blue-600 p-4 mb-8">
                        <p className="font-bold text-blue-900 flex items-center gap-2">
                            <MapPin size={20} />
                            Atur titik pusat kantor. Karyawan hanya bisa absen jika berada dalam radius yang ditentukan.
                        </p>
                    </div>

                    {isLoading ? (
                        <div className="text-center font-bold animate-pulse text-black">Loading Settings...</div>
                    ) : (
                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block font-black text-lg mb-2 text-black">Latitude (Garis Lintang)</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={settings.officeLatitude}
                                        onChange={e => setSettings({ ...settings, officeLatitude: e.target.value })}
                                        className="w-full border-4 border-black rounded-lg p-3 font-bold text-lg focus:shadow-[4px_4px_0px_black] outline-none transition-all text-black placeholder:text-gray-400"
                                        placeholder="-6.2088..."
                                    />
                                </div>
                                <div>
                                    <label className="block font-black text-lg mb-2 text-black">Longitude (Garis Bujur)</label>
                                    <input
                                        required
                                        type="number"
                                        step="any"
                                        value={settings.officeLongitude}
                                        onChange={e => setSettings({ ...settings, officeLongitude: e.target.value })}
                                        className="w-full border-4 border-black rounded-lg p-3 font-bold text-lg focus:shadow-[4px_4px_0px_black] outline-none transition-all text-black placeholder:text-gray-400"
                                        placeholder="106.8456..."
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-black text-lg mb-2 text-black">Max Radius (Meter)</label>
                                <div className="flex items-center gap-4">
                                    <input
                                        required
                                        type="number"
                                        value={settings.maxRadius}
                                        onChange={e => setSettings({ ...settings, maxRadius: e.target.value })}
                                        className="w-full max-w-xs border-4 border-black rounded-lg p-3 font-bold text-lg focus:shadow-[4px_4px_0px_black] outline-none transition-all text-black placeholder:text-gray-400"
                                        placeholder="100"
                                    />
                                    <span className="font-bold text-gray-500">Meter dari titik pusat</span>
                                </div>
                            </div>

                            <div className="flex flex-col md:flex-row gap-4 pt-6 border-t-2 border-gray-100">
                                <button
                                    type="button"
                                    onClick={getLocation}
                                    className="flex-1 bg-yellow-400 text-black font-black py-4 rounded-lg text-lg border-4 border-black shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none hover:bg-yellow-500 flex items-center justify-center gap-2 uppercase tracking-wide"
                                >
                                    <MapPin size={24} /> Ambil Lokasi Saat Ini
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 bg-black text-white font-black py-4 rounded-lg text-lg border-4 border-black shadow-[4px_4px_0px_white] active:translate-y-1 active:shadow-none hover:bg-gray-800 flex items-center justify-center gap-2 disabled:opacity-50 uppercase tracking-wide"
                                >
                                    <Save size={24} /> {isSaving ? 'Menyimpan...' : 'Simpan Pengaturan'}
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
