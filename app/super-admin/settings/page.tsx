'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Save, Globe, Smartphone, Store, LogOut } from 'lucide-react';
import FormSkeleton from '@/app/components/skeletons/FormSkeleton';

export default function SettingsPage() {
    const router = useRouter();
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

    const handleLogout = async () => {
        if (!confirm('Are you sure you want to logout?')) return;
        try {
            await fetch('/api/auth/super-admin/logout', { method: 'POST' });
            router.push('/super-admin/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    if (isLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">System Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure store location and core parameters</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* SETTINGS CARD */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-2xl p-8 shadow-sm relative overflow-hidden">

                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFBF00]/5 rounded-bl-full pointer-events-none"></div>

                        <div className="flex items-center gap-4 mb-8 relative z-10">
                            <div className="w-12 h-12 rounded-xl bg-[#FFBF00]/10 text-[#FFBF00] flex items-center justify-center">
                                <Globe size={24} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black dark:text-white">Store Location & Geofencing</h2>
                                <p className="text-sm text-gray-500">Set coordinates for employee attendance validation</p>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="text-center py-10 font-bold text-gray-400 animate-pulse">Loading Configuration...</div>
                        ) : (
                            <form onSubmit={handleSave} className="space-y-8 relative z-10">

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Latitude</label>
                                        <input
                                            required
                                            type="number"
                                            step="any"
                                            value={settings.officeLatitude}
                                            onChange={e => setSettings({ ...settings, officeLatitude: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all"
                                            placeholder="-6.2088..."
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Longitude</label>
                                        <input
                                            required
                                            type="number"
                                            step="any"
                                            value={settings.officeLongitude}
                                            onChange={e => setSettings({ ...settings, officeLongitude: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-mono text-sm focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all"
                                            placeholder="106.8456..."
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Allowed Radius (Meters)</label>
                                    <div className="relative">
                                        <input
                                            required
                                            type="number"
                                            value={settings.maxRadius}
                                            onChange={e => setSettings({ ...settings, maxRadius: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-mono text-lg font-bold focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all pl-4"
                                            placeholder="100"
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Meters</div>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">Employees must be within this range to Clock In/Out.</p>
                                </div>

                                <div className="flex gap-4 pt-6 border-t border-gray-100 dark:border-[#222]">
                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        className="flex-1 bg-gray-100 dark:bg-[#222] text-black dark:text-white font-bold py-4 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={18} /> Get Current Location
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 bg-[#FFBF00] text-black font-black py-4 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,191,0,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        <Save size={18} /> {isSaving ? 'Saving...' : 'SAVE CHANGES'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>

                {/* INFO SIDEBAR */}
                <div className="space-y-6">
                    <div className="bg-[#111] text-white p-8 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBF00]/20 rounded-full blur-2xl"></div>
                        <h3 className="font-black text-xl mb-4 relative z-10">System Status</h3>
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Environment</span>
                                <span className="text-sm font-bold bg-[#333] px-2 py-1 rounded text-[#FFBF00]">PRODUCTION</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Database</span>
                                <span className="text-sm font-bold text-green-400 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div> CONNECTED</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Version</span>
                                <span className="font-mono text-sm font-bold text-gray-500">v2.4.0</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] p-6 rounded-2xl">
                        <h3 className="font-bold text-sm mb-4 dark:text-white flex items-center gap-2">
                            <Store size={16} /> Device Management
                        </h3>
                        <p className="text-xs text-gray-500 mb-4">Manage registered devices for attendance.</p>
                        <button className="w-full py-3 border border-gray-200 dark:border-[#333] rounded-lg text-xs font-bold hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-colors">
                            View Paired Devices
                        </button>
                    </div>

                    {/* Logout Button (Ideally for Mobile) */}
                    <button
                        onClick={handleLogout}
                        className="w-full py-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 font-black rounded-2xl hover:bg-red-100 dark:hover:bg-red-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut size={18} /> LOGOUT
                    </button>
                </div>

            </div>
        </div>
    );
}
