'use client';

import { useState, useEffect } from 'react';
import {
    Plus, RefreshCw, Trash2, Smartphone, Shield, User, Search, Users,
    IdCard, X, MapPin, Calendar, Settings, Save, Globe, Eye, Clock,
    Image as ImageIcon, Loader2, Link2, Link2Off, Check
} from 'lucide-react';
import Link from 'next/link';
import EmployeeSkeleton from '@/app/components/skeletons/EmployeeSkeleton';

// --- TYPES ---
interface Employee {
    id: string;
    name: string;
    whatsapp: string;
    role: string;
    deviceId: string | null;
    isActive: boolean;
    _count: { attendances: number };
}

interface AttendanceRecord {
    id: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    timestamp: string;
    photoUrl: string;
    latitude: number;
    longitude: number;
    status: string;
    employee: {
        name: string;
        role: string;
    };
}

export default function AdminDashboardPage() {
    const [activeTab, setActiveTab] = useState<'employees' | 'attendance' | 'settings'>('employees');

    // --- EMPLOYEES STATE ---
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [isEmpLoading, setIsEmpLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({ id: '', name: '', whatsapp: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [actionLoading, setActionLoading] = useState<{ id: string; action: string } | null>(null);

    // --- ATTENDANCE STATE ---
    const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
    const [isAttLoading, setIsAttLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<AttendanceRecord | null>(null);

    // --- SETTINGS STATE ---
    const [settings, setSettings] = useState({
        officeLatitude: '',
        officeLongitude: '',
        maxRadius: ''
    });
    const [isSettingsLoading, setIsSettingsLoading] = useState(true);
    const [isSavingSettings, setIsSavingSettings] = useState(false);

    // --- INITIAL DATA FETCH ---
    useEffect(() => {
        if (activeTab === 'employees') fetchEmployees();
        if (activeTab === 'attendance') fetchAttendance();
        if (activeTab === 'settings') fetchSettings();
    }, [activeTab]);

    // Re-fetch attendance when date changes
    useEffect(() => {
        if (activeTab === 'attendance') fetchAttendance();
    }, [attendanceDate]);

    // --- EMPLOYEES FUNCTIONS ---
    const fetchEmployees = async () => {
        setIsEmpLoading(true);
        try {
            const res = await fetch('/api/admin/employees');
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setEmployees([]);
        } finally {
            setIsEmpLoading(false);
        }
    };

    const handleSaveEmployee = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = '/api/admin/employees';
            const method = editingId ? 'PATCH' : 'POST';
            const body = editingId
                ? { id: formData.id, oldId: editingId, action: 'UPDATE_PROFILE', ...formData }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ id: '', name: '', whatsapp: '' });
                setEditingId(null);
                fetchEmployees();
            } else {
                const data = await res.json();
                alert(`Gagal: ${data.details || data.error}`);
            }
        } catch (err) {
            alert('Terjadi kesalahan sistem.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteEmployee = async (id: string) => {
        if (!confirm('Yakin hapus karyawan?')) return;
        const res = await fetch(`/api/admin/employees?id=${id}`, { method: 'DELETE' });
        if (res.ok) fetchEmployees();
    };

    const resetDevice = async (id: string, empName: string) => {
        if (!confirm(`Reset device untuk ${empName}? Karyawan harus login ulang dari HP baru.`)) return;
        setActionLoading({ id, action: 'reset' });
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'RESET_DEVICE' })
            });
            if (res.ok) {
                alert('✅ Device berhasil di-reset!');
                fetchEmployees();
            } else {
                alert('❌ Gagal reset device');
            }
        } catch (err) {
            alert('❌ Terjadi kesalahan');
        } finally {
            setActionLoading(null);
        }
    };

    const toggleStatus = async (id: string, currentlyActive: boolean, empName: string) => {
        const newStatus = currentlyActive ? 'Non-aktifkan' : 'Aktifkan';
        if (!confirm(`${newStatus} karyawan ${empName}?`)) return;
        setActionLoading({ id, action: 'status' });
        try {
            const res = await fetch('/api/admin/employees', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, action: 'TOGGLE_STATUS' })
            });
            if (res.ok) {
                alert(`✅ Status berhasil diubah!`);
                fetchEmployees();
            } else {
                alert('❌ Gagal mengubah status');
            }
        } catch (err) {
            alert('❌ Terjadi kesalahan');
        } finally {
            setActionLoading(null);
        }
    };

    const openModal = (emp?: Employee) => {
        if (emp) {
            setEditingId(emp.id);
            setFormData({ id: emp.id, name: emp.name, whatsapp: emp.whatsapp });
        } else {
            setEditingId(null);
            setFormData({ id: '', name: '', whatsapp: '' });
        }
        setShowModal(true);
    };

    // --- ATTENDANCE FUNCTIONS ---
    const fetchAttendance = async () => {
        setIsAttLoading(true);
        try {
            const res = await fetch(`/api/admin/attendance?date=${attendanceDate}`);
            if (res.ok) setAttendanceRecords(await res.json());
        } catch (error) {
            console.error(error);
        } finally {
            setIsAttLoading(false);
        }
    };

    // --- SETTINGS FUNCTIONS ---
    const fetchSettings = async () => {
        setIsSettingsLoading(true);
        try {
            const res = await fetch('/api/admin/settings');
            const data = await res.json();
            if (data && !data.error) {
                setSettings({
                    officeLatitude: data.officeLatitude || '',
                    officeLongitude: data.officeLongitude || '',
                    maxRadius: data.maxRadius || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch settings');
        } finally {
            setIsSettingsLoading(false);
        }
    };

    const saveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSavingSettings(true);
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });
            if (res.ok) alert('Pengaturan tersimpan!');
            else alert('Gagal menyimpan.');
        } catch (error) {
            alert('Error saving settings.');
        } finally {
            setIsSavingSettings(false);
        }
    };

    const getGeoLocation = () => {
        if (!navigator.geolocation) return alert('Geolocation not supported');
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setSettings({
                    ...settings,
                    officeLatitude: pos.coords.latitude.toString(),
                    officeLongitude: pos.coords.longitude.toString()
                });
            },
            () => alert('Gagal ambil lokasi.')
        );
    };

    // --- RENDER HELPERS ---
    const filteredEmployees = employees.filter(emp =>
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.id.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF8E7] via-[#FFF5DC] to-[#F5F0E8] font-sans text-black p-3 lg:p-6">

            {/* --- HEADER --- */}
            <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-5 mb-6">
                <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4">
                    <div>
                        <h1 className="text-2xl lg:text-3xl font-black uppercase tracking-tighter flex items-center gap-2">
                            <Shield className="text-[#552CB7]" size={32} />
                            <span className="text-[#FD5A46] text-3xl">.</span>NOL <span className="text-[#552CB7]">ADMIN</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1 font-bold">
                            Kelola Karyawan, Absensi, & Pengaturan Kantor
                        </p>
                    </div>
                    <Link
                        href="/admin/dashboard"
                        className="bg-white text-gray-700 px-5 py-2.5 text-sm font-bold rounded-xl border-2 border-gray-200 hover:border-[#552CB7] transition-all flex items-center justify-center gap-2"
                    >
                        ← Back to Panel
                    </Link>
                </div>

                {/* --- TABS --- */}
                <div className="flex flex-wrap gap-2 mt-6 border-t-2 border-gray-100 pt-6">
                    <button
                        onClick={() => setActiveTab('employees')}
                        className={`px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide flex items-center gap-2 transition-all ${activeTab === 'employees'
                            ? 'bg-[#552CB7] text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Users size={16} /> Karyawan
                    </button>
                    <button
                        onClick={() => setActiveTab('attendance')}
                        className={`px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide flex items-center gap-2 transition-all ${activeTab === 'attendance'
                            ? 'bg-[#FD5A46] text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Calendar size={16} /> Data Absensi
                    </button>
                    <button
                        onClick={() => setActiveTab('settings')}
                        className={`px-5 py-2.5 rounded-xl font-black text-sm uppercase tracking-wide flex items-center gap-2 transition-all ${activeTab === 'settings'
                            ? 'bg-black text-white shadow-lg scale-105'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                            }`}
                    >
                        <Settings size={16} /> Pengaturan Lokasi
                    </button>
                </div>
            </div>

            {/* --- CONTENT: EMPLOYEES --- */}
            {activeTab === 'employees' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.04),0_6px_16px_rgba(0,0,0,0.06)] border-2 border-gray-200 p-4 mb-6 flex flex-col md:flex-row gap-4 justify-between">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Cari nama atau ID karyawan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#552CB7] focus:ring-2 focus:ring-[#552CB7]/20 transition-all text-sm font-bold text-black"
                            />
                        </div>
                        <button
                            onClick={() => openModal()}
                            className="bg-gradient-to-r from-[#552CB7] to-[#6B3FD9] text-white px-5 py-2.5 text-sm font-bold rounded-xl shadow-[0_4px_12px_rgba(85,44,183,0.3)] hover:shadow-[0_6px_16px_rgba(85,44,183,0.4)] transition-all active:scale-95 flex items-center gap-2 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            Tambah Karyawan
                        </button>
                    </div>

                    {isEmpLoading ? (
                        <EmployeeSkeleton />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredEmployees.map((emp) => (
                                <div key={emp.id} className={`group relative bg-white rounded-2xl overflow-hidden shadow-sm border-2 border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 hover:border-[#552CB7] ${!emp.isActive && 'opacity-60 grayscale'}`}>
                                    <div className="bg-gray-50 border-b-2 border-gray-100 p-4 flex justify-between items-center relative overflow-hidden">
                                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#552CB7] to-[#FD5A46]"></div>
                                        <div className="flex items-center gap-2">
                                            <IdCard size={16} className="text-gray-400" />
                                            <span className="font-mono font-black text-lg text-[#552CB7] tracking-wider">{emp.id}</span>
                                        </div>
                                        <div className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wide border ${emp.isActive ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                            {emp.isActive ? 'Active' : 'Inactive'}
                                        </div>
                                    </div>
                                    <div className="p-5">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-14 h-14 bg-gray-900 text-white rounded-xl flex items-center justify-center font-black text-xl shadow-lg">
                                                {emp.name.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="text-lg font-black text-black leading-tight mb-1">{emp.name}</h3>
                                                <p className="text-xs font-bold text-gray-500 flex items-center gap-1">
                                                    <Smartphone size={12} /> {emp.whatsapp}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Device Linked Indicator */}
                                        <div className={`mb-4 p-2.5 rounded-lg border-2 flex items-center gap-2 text-xs font-bold ${emp.deviceId
                                                ? 'bg-green-50 border-green-200 text-green-700'
                                                : 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                            }`}>
                                            {emp.deviceId ? (
                                                <>
                                                    <Link2 size={14} />
                                                    <span>Device Linked</span>
                                                    <Check size={12} className="ml-auto" />
                                                </>
                                            ) : (
                                                <>
                                                    <Link2Off size={14} />
                                                    <span>Belum Ada Device</span>
                                                </>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => openModal(emp)}
                                                className="py-2 rounded-lg border-2 border-gray-200 hover:border-[#552CB7] hover:bg-blue-50 text-[#552CB7] font-bold text-xs flex items-center justify-center gap-1"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => resetDevice(emp.id, emp.name)}
                                                disabled={actionLoading?.id === emp.id && actionLoading?.action === 'reset'}
                                                className="py-2 rounded-lg border-2 border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 text-yellow-600 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading?.id === emp.id && actionLoading?.action === 'reset' ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    'Reset Device'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => toggleStatus(emp.id, emp.isActive, emp.name)}
                                                disabled={actionLoading?.id === emp.id && actionLoading?.action === 'status'}
                                                className="py-2 rounded-lg border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {actionLoading?.id === emp.id && actionLoading?.action === 'status' ? (
                                                    <Loader2 size={14} className="animate-spin" />
                                                ) : (
                                                    emp.isActive ? 'Non-aktifkan' : 'Aktifkan'
                                                )}
                                            </button>
                                            <button
                                                onClick={() => deleteEmployee(emp.id)}
                                                className="py-2 rounded-lg border-2 border-gray-200 hover:border-red-500 hover:bg-red-50 text-red-600 font-bold text-xs flex items-center justify-center gap-1"
                                            >
                                                Hapus
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- CONTENT: ATTENDANCE --- */}
            {activeTab === 'attendance' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl shadow-sm border-2 border-gray-200 p-6 mb-6 flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black uppercase mb-1">Filter Tanggal</h2>
                            <p className="text-sm text-gray-500">Pilih tanggal untuk melihat rekap kehadiran</p>
                        </div>
                        <input
                            type="date"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                            className="border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-[#FD5A46] outline-none"
                        />
                    </div>

                    {isAttLoading ? (
                        <div className="text-center font-black text-xl animate-pulse text-gray-400 mt-10">MEMUAT ABSENSI...</div>
                    ) : (
                        <div className="space-y-4">
                            {attendanceRecords.length === 0 && (
                                <div className="text-center py-20 text-gray-400 font-bold bg-white rounded-2xl border-2 border-dashed border-gray-200">Tidak ada data absensi untuk tanggal ini.</div>
                            )}
                            {attendanceRecords.map((rec) => (
                                <div key={rec.id} className="bg-white rounded-xl shadow-sm border-2 border-gray-200 p-4 flex flex-col md:flex-row items-center gap-6 hover:shadow-md transition-all">
                                    <div className={`w-full md:w-24 text-center p-3 rounded-lg border-2 ${rec.type === 'CLOCK_IN' ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                        <p className="text-[10px] font-black uppercase mb-1">{rec.type === 'CLOCK_IN' ? 'MASUK' : 'PULANG'}</p>
                                        <p className="text-xl font-black font-mono leading-none">
                                            {new Date(rec.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-lg font-black uppercase">{rec.employee.name}</h3>
                                        <div className="flex gap-2 text-xs font-bold mt-1 text-gray-500">
                                            <span className="bg-gray-100 px-2 py-0.5 rounded">{rec.employee.role}</span>
                                            <span className={`${rec.status === 'APPROVED' ? 'text-green-600' : 'text-yellow-600'}`}>{rec.status}</span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => setSelectedPhoto(rec)} className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 font-bold text-xs flex items-center gap-2">
                                            <ImageIcon size={14} /> Foto
                                        </button>
                                        <button onClick={() => window.open(`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`, '_blank')} className="px-4 py-2 rounded-lg border-2 border-gray-200 hover:bg-gray-50 font-bold text-xs flex items-center gap-2">
                                            <MapPin size={14} /> Lokasi
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* --- CONTENT: SETTINGS --- */}
            {activeTab === 'settings' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-4xl mx-auto">
                    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-200 p-8">
                        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-8 rounded-r-xl">
                            <p className="font-bold text-blue-800 flex items-center gap-2 text-sm">
                                <Globe size={18} />
                                Atur titik pusat kantor. Karyawan hanya bisa absen jika berada dalam radius yang ditentukan.
                            </p>
                        </div>

                        {isSettingsLoading ? (
                            <div className="text-center font-black animate-pulse text-gray-400">Loading Settings...</div>
                        ) : (
                            <form onSubmit={saveSettings} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Latitude</label>
                                        <input
                                            required type="number" step="any"
                                            value={settings.officeLatitude}
                                            onChange={e => setSettings({ ...settings, officeLatitude: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-black outline-none transition-all"
                                            placeholder="-6.2088..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Longitude</label>
                                        <input
                                            required type="number" step="any"
                                            value={settings.officeLongitude}
                                            onChange={e => setSettings({ ...settings, officeLongitude: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-black outline-none transition-all"
                                            placeholder="106.8456..."
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2 uppercase">Max Radius (Meter)</label>
                                    <div className="relative">
                                        <input
                                            required type="number"
                                            value={settings.maxRadius}
                                            onChange={e => setSettings({ ...settings, maxRadius: e.target.value })}
                                            className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-black outline-none transition-all"
                                            placeholder="100"
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">Meter</span>
                                    </div>
                                </div>

                                <div className="flex gap-4 pt-6 border-t-2 border-gray-100">
                                    <button type="button" onClick={getGeoLocation} className="flex-1 bg-yellow-400 hover:bg-yellow-500 text-black font-black py-4 rounded-xl shadow-lg hover:-translate-y-1 transition-all flex justify-center gap-2">
                                        <MapPin size={20} /> AMBIL LOKASI SAYA
                                    </button>
                                    <button type="submit" disabled={isSavingSettings} className="flex-1 bg-black text-white font-black py-4 rounded-xl shadow-lg hover:-translate-y-1 transition-all flex justify-center gap-2">
                                        <Save size={20} /> {isSavingSettings ? 'MENYIMPAN...' : 'SIMPAN PENGATURAN'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {/* --- MODALS --- */}
            {showModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white border-2 border-gray-200 shadow-2xl rounded-2xl w-full max-w-md p-6 relative animate-in fade-in zoom-in duration-200">
                        <button onClick={() => setShowModal(false)} className="absolute top-4 right-4 text-gray-400 hover:text-black">
                            <X size={24} />
                        </button>
                        <div className="mb-6 text-center">
                            <h2 className="text-xl font-black uppercase text-black">{editingId ? 'Edit Karyawan' : 'Karyawan Baru'}</h2>
                        </div>
                        <form onSubmit={handleSaveEmployee} className="space-y-4">
                            {editingId && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">ID KARYAWAN</label>
                                    <input required value={formData.id} onChange={e => setFormData({ ...formData, id: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black font-mono focus:border-[#552CB7] outline-none" />
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">NAMA LENGKAP</label>
                                <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-[#552CB7] outline-none" placeholder="Nama..." />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">WHATSAPP</label>
                                <input required value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold text-black focus:border-[#552CB7] outline-none" placeholder="08..." />
                            </div>
                            <button disabled={isSubmitting} className="w-full bg-[#552CB7] text-white font-black py-4 rounded-xl mt-4 shadow-xl hover:-translate-y-1 transition-all">SIMPAN DATA</button>
                        </form>
                    </div>
                </div>
            )}

            {selectedPhoto && (
                <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
                    <div className="relative bg-white p-2 rounded-xl max-w-lg w-full scale-100 animate-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 text-white font-bold flex items-center gap-2">TUTUP <X /></button>
                        <img src={selectedPhoto.photoUrl} alt="Bukti" className="w-full rounded-lg" />
                        <div className="mt-4 text-center pb-2">
                            <p className="font-black uppercase text-lg">{selectedPhoto.employee.name}</p>
                            <p className="font-mono text-sm text-gray-500">{new Date(selectedPhoto.timestamp).toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
