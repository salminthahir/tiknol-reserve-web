'use client';

import { useState, useEffect } from 'react';
import {
    Plus, Search, User, Smartphone, Shield, Check, X,
    MoreHorizontal, SmartphoneNfc, Trash2, Edit, AlertTriangle
} from 'lucide-react';
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

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    // Modal & Form State
    const [showModal, setShowModal] = useState(false);
    // Tab State
    const [activeTab, setActiveTab] = useState<'STAFF' | 'ADMIN'>('STAFF');

    // Form Data with PIN support
    const [formData, setFormData] = useState<{ id: string, name: string, whatsapp: string, role: string, pin?: string }>({
        id: '', name: '', whatsapp: '', role: 'STAFF', pin: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Confirmation Modal State
    const [confirmState, setConfirmState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => Promise<void> | void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'info',
        onConfirm: () => { }
    });
    const [isConfirming, setIsConfirming] = useState(false);


    // --- FETCH DATA ---
    const fetchEmployees = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/employees');
            const data = await res.json();
            setEmployees(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error(err);
            setEmployees([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // --- HANDLES ---
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const url = '/api/admin/employees';
            const method = editingId ? 'PATCH' : 'POST';
            const body = editingId
                ? { ...formData, oldId: editingId, action: 'UPDATE_PROFILE' }
                : formData;

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            if (res.ok) {
                setShowModal(false);
                setFormData({ id: '', name: '', whatsapp: '', role: 'STAFF', pin: '' });
                setEditingId(null);
                fetchEmployees();
            } else {
                alert('Failed to save employee.');
            }
        } catch (err) {
            alert('Error occurred.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Generic Action Runner
    const runConfirmAction = async () => {
        if (!confirmState.onConfirm) return;
        setIsConfirming(true);
        try {
            await confirmState.onConfirm();
            setConfirmState(prev => ({ ...prev, isOpen: false }));
        } catch (error) {
            console.error(error);
        } finally {
            setIsConfirming(false);
        }
    };

    // Actions triggering Confirmation
    const triggerDelete = (id: string, name: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Remove Employee?',
            message: `Are you sure you want to remove ${name}? This action cannot be undone and will delete their attendance records.`,
            type: 'danger',
            onConfirm: async () => {
                const res = await fetch(`/api/admin/employees?id=${id}`, { method: 'DELETE' });
                if (res.ok) fetchEmployees();
            }
        });
    };

    const triggerToggleStatus = (id: string, isActive: boolean, name: string) => {
        const actionText = isActive ? 'Deactivate' : 'Activate';
        setConfirmState({
            isOpen: true,
            title: `${actionText} Account?`,
            message: `Are you sure you want to ${actionText.toLowerCase()} access for ${name}?`,
            type: isActive ? 'danger' : 'info',
            onConfirm: async () => {
                const res = await fetch('/api/admin/employees', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action: 'TOGGLE_STATUS' })
                });
                if (res.ok) fetchEmployees();
            }
        });
    };

    const triggerResetDevice = (id: string, name: string) => {
        setConfirmState({
            isOpen: true,
            title: 'Reset Device Binding?',
            message: `This will unlink the current device for ${name}. They will need to register a new device to clock in.`,
            type: 'warning',
            onConfirm: async () => {
                const res = await fetch('/api/admin/employees', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id, action: 'RESET_DEVICE' })
                });
                if (res.ok) fetchEmployees();
            }
        });
    };

    // Filter by Tab AND Search
    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            emp.id.toLowerCase().includes(searchQuery.toLowerCase());
        const isSuperAdmin = emp.role === 'ADMIN' || emp.role === 'MANAGER';

        if (activeTab === 'ADMIN') return isSuperAdmin && matchesSearch;
        return !isSuperAdmin && matchesSearch; // Staff Tab
    });

    const openModal = (emp?: Employee) => {
        if (emp) {
            setEditingId(emp.id);
            // Don't pre-fill PIN for security, leave blank to keep unchanged
            setFormData({
                id: emp.id,
                name: emp.name,
                whatsapp: emp.whatsapp,
                role: emp.role || 'STAFF',
                pin: ''
            });
            // If editing an admin, switch tab to admin context if not already
            if (emp.role === 'ADMIN' || emp.role === 'MANAGER') setActiveTab('ADMIN');
        } else {
            console.log("Opening New Member modal");
            setEditingId(null);
            // Default Role based on Active Tab
            const defaultRole = activeTab === 'ADMIN' ? 'ADMIN' : 'STAFF';
            setFormData({ id: '', name: '', whatsapp: '', role: defaultRole, pin: '' });
        }
        setShowModal(true);
    };

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10 transition-colors">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">
                        {activeTab === 'ADMIN' ? 'Super Admins' : 'Team Members'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        {activeTab === 'ADMIN' ? 'Manage system administrators' : 'Manage staff access and details'}
                    </p>
                </div>
                <button
                    onClick={() => openModal()}
                    className="bg-black text-white dark:bg-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-6 py-3 text-sm font-bold rounded-xl shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                >
                    <Plus size={18} />
                    {activeTab === 'ADMIN' ? 'ADD ADMIN' : 'ADD MEMBER'}
                </button>
            </header>

            {/* TABS */}
            <div className="flex gap-4 mb-8 border-b border-gray-200 dark:border-[#222]">
                <button
                    onClick={() => setActiveTab('STAFF')}
                    className={`pb-4 px-4 text-sm font-bold transition-all relative ${activeTab === 'STAFF' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    All Staff
                    {activeTab === 'STAFF' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFBF00] rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('ADMIN')}
                    className={`pb-4 px-4 text-sm font-bold transition-all relative ${activeTab === 'ADMIN' ? 'text-black dark:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Super Admins & Managers
                    {activeTab === 'ADMIN' && <div className="absolute bottom-0 left-0 w-full h-1 bg-[#FFBF00] rounded-t-full"></div>}
                </button>
            </div>

            {loading ? (
                <EmployeeSkeleton />
            ) : (
                <>
                    {/* Search Bar */}
                    <div className="bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] shadow-sm mb-8 relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder={activeTab === 'ADMIN' ? "Search admins..." : "Search employees..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-transparent border-none outline-none font-bold text-sm dark:text-white"
                        />
                    </div>

                    {/* Employee Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredEmployees.map((emp) => (
                            <div key={emp.id} className="group bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] overflow-hidden hover:border-[#FFBF00]/50 transition-all shadow-sm hover:shadow-md relative">

                                {/* Status Indicator Badge */}
                                <div className={`absolute top-4 right-4 px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${emp.isActive
                                    ? 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400'
                                    : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                    }`}>
                                    {emp.isActive ? 'ACTIVE' : 'INACTIVE'}
                                </div>

                                <div className="p-6">
                                    <div className="flex items-start gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-xl bg-[#F5F5F5] dark:bg-[#1A1A1A] flex items-center justify-center text-lg font-black text-gray-400 group-hover:bg-[#FFBF00] group-hover:text-black transition-colors">
                                            {emp.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-lg leading-tight dark:text-white mb-1 flex items-center gap-2">
                                                {emp.name}
                                                {emp.role === 'ADMIN' && <Shield size={14} className="text-[#FFBF00]" fill="#FFBF00" />}
                                            </h3>
                                            <p className="text-xs font-mono text-gray-400">ID: {emp.id}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                            <Smartphone size={14} />
                                            <span>{emp.whatsapp}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                            <Shield size={14} />
                                            <span className={emp.role === 'ADMIN' ? 'font-bold text-[#FFBF00]' : ''}>{emp.role || 'Staff'}</span>
                                        </div>
                                        <div className={`flex items-center gap-3 text-xs font-bold ${emp.deviceId ? 'text-green-600' : 'text-orange-500'}`}>
                                            <SmartphoneNfc size={14} />
                                            <span>{emp.deviceId ? 'Device Linked' : 'No Device Linked'}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 pt-4 border-t border-gray-100 dark:border-[#222]">
                                        <button
                                            onClick={() => openModal(emp)}
                                            className="flex-1 py-2 rounded-lg bg-gray-50 dark:bg-[#1A1A1A] text-xs font-bold hover:bg-gray-100 dark:hover:bg-[#222] transition-colors flex items-center justify-center gap-2"
                                        >
                                            <Edit size={14} /> Edit
                                        </button>
                                        <button
                                            onClick={() => triggerToggleStatus(emp.id, emp.isActive, emp.name)}
                                            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2 ${emp.isActive ? 'bg-red-50 dark:bg-red-900/10 text-red-500 hover:bg-red-100' : 'bg-green-50 dark:bg-green-900/10 text-green-500 hover:bg-green-100'}`}
                                        >
                                            {emp.isActive ? 'Deactivate' : 'Activate'}
                                        </button>
                                        <button
                                            onClick={() => triggerResetDevice(emp.id, emp.name)}
                                            className="w-8 flex items-center justify-center rounded-lg bg-orange-50 dark:bg-orange-900/10 text-orange-500 hover:bg-orange-100"
                                            title="Reset Device"
                                        >
                                            <SmartphoneNfc size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}

            {/* FORM MODAL */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111] w-full max-w-md rounded-3xl p-8 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#222]">
                        <button onClick={() => setShowModal(false)} className="absolute top-6 right-6 text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                            <X size={24} />
                        </button>

                        <h2 className="text-2xl font-black mb-1 dark:text-white">{editingId ? 'Edit Profile' : (activeTab === 'ADMIN' ? 'New Admin' : 'New Member')}</h2>
                        <p className="text-sm text-gray-500 mb-8">Fill in the details below.</p>

                        <form onSubmit={handleSave} className="space-y-6">
                            {editingId && (
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Employee ID</label>
                                    <input
                                        required
                                        value={formData.id}
                                        onChange={e => setFormData({ ...formData, id: e.target.value.toUpperCase() })}
                                        className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFBF00] dark:text-white uppercase"
                                    />
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                                <input
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFBF00] dark:text-white"
                                    placeholder="e.g. John Doe"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">WhatsApp Number</label>
                                <input
                                    required
                                    value={formData.whatsapp}
                                    onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFBF00] dark:text-white"
                                    placeholder="08..."
                                />
                            </div>

                            {/* Role Selection */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Role / Position</label>
                                <select
                                    required
                                    value={formData.role}
                                    onChange={e => setFormData({ ...formData, role: e.target.value })}
                                    className="w-full bg-gray-50 dark:bg-[#1A1A1A] border-none rounded-xl p-4 font-bold text-sm outline-none focus:ring-2 focus:ring-[#FFBF00] dark:text-white appearance-none cursor-pointer"
                                >
                                    <option value="STAFF">STAFF</option>
                                    <option value="MANAGER">MANAGER</option>
                                    <option value="ADMIN">ADMIN (Super Access)</option>
                                </select>
                            </div>

                            {/* PIN Input - Only for Admin/Manager */}
                            {(formData.role === 'ADMIN' || formData.role === 'MANAGER') && (
                                <div className="space-y-2 animate-in slide-in-from-top-2">
                                    <label className="text-xs font-bold uppercase tracking-widest text-[#FFBF00]">Security PIN</label>
                                    <input
                                        type="text" // Using text to see validation, usually password type
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={formData.pin || ''}
                                        onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                        className="w-full bg-[#FFBF00]/10 border border-[#FFBF00]/30 rounded-xl p-4 font-mono text-lg font-bold outline-none focus:ring-2 focus:ring-[#FFBF00] dark:text-white tracking-widest text-center"
                                        placeholder={editingId ? "Leave empty to keep current PIN" : "6 Digit PIN"}
                                        required={!editingId} // Required only for new admins
                                    />
                                    <p className="text-[10px] text-gray-400 text-center">Used for Super Admin Login</p>
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full bg-[#FFBF00] text-black font-black py-4 rounded-xl text-sm hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,191,0,0.3)] disabled:opacity-50"
                            >
                                {isSubmitting ? 'SAVING...' : 'SAVE CHANGES'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* CONFIRMATION MODAL */}
            {confirmState.isOpen && (
                <div className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-[#111] w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-[#222]">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${confirmState.type === 'danger' ? 'bg-red-50 dark:bg-red-900/20 text-red-500' :
                                confirmState.type === 'warning' ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-500' :
                                    'bg-blue-50 dark:bg-blue-900/20 text-blue-500'
                                }`}>
                                <AlertTriangle size={32} />
                            </div>

                            <h3 className="text-xl font-black mb-2 dark:text-white">{confirmState.title}</h3>
                            <p className="text-sm text-gray-500 mb-8">{confirmState.message}</p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                                    className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#222] text-gray-700 dark:text-gray-300 font-bold text-sm hover:bg-gray-200 dark:hover:bg-[#333] transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={runConfirmAction}
                                    disabled={isConfirming}
                                    className={`flex-1 py-3 rounded-xl font-bold text-sm transition-all shadow-lg flex items-center justify-center gap-2 ${confirmState.type === 'danger'
                                        ? 'bg-red-500 text-white hover:bg-red-600 shadow-red-500/20'
                                        : confirmState.type === 'warning'
                                            ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-orange-500/20'
                                            : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/20'
                                        }`}
                                >
                                    {isConfirming ? 'Processing...' : 'Confirm'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
