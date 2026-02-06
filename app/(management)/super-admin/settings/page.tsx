'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Save, Globe, Store, LogOut, User, Phone, Building, Sun, Moon } from 'lucide-react';
import FormSkeleton from '@/app/components/skeletons/FormSkeleton';

export default function SettingsPage() {
    const router = useRouter();
    const [settings, setSettings] = useState({
        storeName: '',
        storeAddress: '',
        storePhone: '',
        adminName: '',
        officeLatitude: '',
        officeLongitude: '',
        maxRadius: ''
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'store' | 'location'>('store');
    const [theme, setTheme] = useState<'light' | 'dark'>('dark');

    useEffect(() => {
        fetchSettings();
        // Load theme from localStorage
        const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
        if (savedTheme) setTheme(savedTheme);
    }, []);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data && !data.error) {
                setSettings({
                    storeName: data.storeName || 'Nol Coffee',
                    storeAddress: data.storeAddress || '',
                    storePhone: data.storePhone || '',
                    adminName: data.adminName || 'Super Admin',
                    officeLatitude: data.officeLatitude?.toString() || '',
                    officeLongitude: data.officeLongitude?.toString() || '',
                    maxRadius: data.maxRadius?.toString() || '100'
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
                alert('Pengaturan Berhasil Disimpan!');
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

    const toggleTheme = () => {
        const newTheme = theme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    if (isLoading) {
        return <FormSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10">
            {/* Header */}
            <header className="mb-10">
                <h1 className="text-4xl font-black tracking-tight mb-2">System Settings</h1>
                <p className="text-gray-500 dark:text-gray-400">Configure store, location and system parameters</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">

                {/* MAIN SETTINGS CARD */}
                <div className="lg:col-span-2">
                    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-2xl shadow-sm overflow-hidden">

                        {/* Tabs */}
                        <div className="flex border-b border-gray-100 dark:border-[#222]">
                            <button
                                onClick={() => setActiveTab('store')}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'store'
                                    ? 'bg-[#FFBF00] text-black'
                                    : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                                    }`}
                            >
                                <Store className="inline-block mr-2" size={16} />
                                Store Info
                            </button>
                            <button
                                onClick={() => setActiveTab('location')}
                                className={`flex-1 py-4 text-sm font-bold uppercase tracking-wide transition-all ${activeTab === 'location'
                                    ? 'bg-[#FFBF00] text-black'
                                    : 'text-gray-500 hover:text-black dark:hover:text-white hover:bg-gray-50 dark:hover:bg-[#1A1A1A]'
                                    }`}
                            >
                                <Globe className="inline-block mr-2" size={16} />
                                Geofencing
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-8">
                            {/* Store Info Tab */}
                            {activeTab === 'store' && (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Store Name</label>
                                        <input
                                            type="text"
                                            value={settings.storeName}
                                            onChange={e => setSettings({ ...settings, storeName: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-bold focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all"
                                            placeholder="Nol Coffee"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Store Address</label>
                                        <textarea
                                            value={settings.storeAddress}
                                            onChange={e => setSettings({ ...settings, storeAddress: e.target.value })}
                                            className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-medium focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all resize-none"
                                            placeholder="Jl. Contoh No. 123, Jakarta"
                                            rows={2}
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Phone Number</label>
                                        <div className="relative">
                                            <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                            <input
                                                type="tel"
                                                value={settings.storePhone}
                                                onChange={e => setSettings({ ...settings, storePhone: e.target.value })}
                                                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 pl-12 font-medium focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all"
                                                placeholder="08123456789"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Geofencing Tab */}
                            {activeTab === 'location' && (
                                <div className="space-y-6">
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
                                                className="w-full bg-gray-50 dark:bg-[#1A1A1A] border border-gray-200 dark:border-[#333] rounded-xl p-4 font-mono text-lg font-bold focus:ring-2 focus:ring-[#FFBF00] focus:border-transparent outline-none transition-all"
                                                placeholder="100"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400 uppercase">Meters</div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-2">Employees must be within this range to Clock In/Out.</p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={getLocation}
                                        className="w-full bg-gray-100 dark:bg-[#222] text-black dark:text-white font-bold py-4 rounded-xl text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-all flex items-center justify-center gap-2"
                                    >
                                        <MapPin size={18} /> Get Current Location
                                    </button>
                                </div>
                            )}

                            {/* Save Button */}
                            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-[#222]">
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="w-full bg-[#FFBF00] text-black font-black py-4 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(255,191,0,0.4)] disabled:opacity-50 disabled:hover:scale-100"
                                >
                                    <Save size={18} /> {isSaving ? 'Saving...' : 'SAVE CHANGES'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* SIDEBAR */}
                <div className="space-y-6">
                    {/* Admin Profile Card */}
                    <div className="bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-2xl p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-14 h-14 rounded-full bg-[#FFBF00] flex items-center justify-center font-black text-black text-xl">
                                {settings.adminName.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                                <input
                                    type="text"
                                    value={settings.adminName}
                                    onChange={e => setSettings({ ...settings, adminName: e.target.value })}
                                    className="font-bold text-lg dark:text-white bg-transparent border-b border-transparent hover:border-gray-300 dark:hover:border-[#444] focus:border-[#FFBF00] outline-none w-full transition-all"
                                />
                                <p className="text-xs text-gray-500">Super Administrator</p>
                            </div>
                        </div>
                    </div>

                    {/* System Status */}
                    <div className="bg-[#111] text-white p-6 rounded-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFBF00]/20 rounded-full blur-2xl"></div>
                        <h3 className="font-black text-lg mb-4 relative z-10">System Status</h3>
                        <div className="space-y-3 relative z-10">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Environment</span>
                                <span className="text-xs font-bold bg-[#333] px-2 py-1 rounded text-[#FFBF00]">PRODUCTION</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Database</span>
                                <span className="text-xs font-bold text-green-400 flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>CONNECTED
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-400">Version</span>
                                <span className="font-mono text-xs font-bold text-gray-500">v2.4.0</span>
                            </div>
                        </div>
                    </div>

                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full py-4 bg-white dark:bg-[#111] border border-gray-100 dark:border-[#222] rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-[#1A1A1A] transition-all"
                    >
                        {theme === 'dark' ? (
                            <>
                                <Sun size={18} className="text-yellow-500" />
                                Switch to Light Mode
                            </>
                        ) : (
                            <>
                                <Moon size={18} className="text-indigo-500" />
                                Switch to Dark Mode
                            </>
                        )}
                    </button>

                    {/* Logout Button */}
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
