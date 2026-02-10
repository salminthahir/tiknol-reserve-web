'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import CameraCapture from '@/app/components/CameraCapture';
import PWAInstallPrompt from '@/app/components/PWAInstallPrompt';
import { MapPin, Clock, LogOut, Loader2, CheckCircle2, XCircle } from 'lucide-react';

type AttendanceStatus = 'LOADING' | 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';

export default function AttendancePage() {
    const router = useRouter();

    // State
    const [employeeId, setEmployeeId] = useState<string>('');
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [status, setStatus] = useState<AttendanceStatus>('LOADING');
    const [serverTime, setServerTime] = useState<Date>(new Date());
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [progressMessage, setProgressMessage] = useState<string>('');
    const [progressSteps, setProgressSteps] = useState<Array<{ label: string, status: 'pending' | 'loading' | 'done' | 'error' }>>([]);
    const [deviceWarning, setDeviceWarning] = useState<string | null>(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Load Employee ID from LocalStorage on mount
    useEffect(() => {
        const savedId = localStorage.getItem('tiknol_employee_id');
        if (savedId) {
            setEmployeeId(savedId);
            setIsLoggedIn(true);
            fetchStatus(savedId);
        } else {
            setStatus('NOT_CLOCKED_IN');
        }
    }, []);

    // Timer for Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setServerTime(new Date());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchStatus = async (id: string) => {
        try {
            const res = await fetch(`/api/attendance/status?employeeId=${id}`);
            const data = await res.json();
            if (res.ok) {
                setStatus(data.status);
                if (data.serverTime) setServerTime(new Date(data.serverTime));
            } else {
                localStorage.removeItem('tiknol_employee_id');
                setIsLoggedIn(false);
            }
        } catch (error) {
            console.error('Fetch status error:', error);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!employeeId.trim()) return;

        setProgressMessage('Memverifikasi ID...');
        try {
            const res = await fetch(`/api/attendance/status?employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('tiknol_employee_id', employeeId);
                setStatus(data.status);
                if (data.serverTime) setServerTime(new Date(data.serverTime));
                setIsLoggedIn(true);
                setProgressMessage('');
            } else {
                alert('ID Karyawan tidak ditemukan atau tidak aktif.');
                setEmployeeId('');
            }
        } catch (error) {
            console.error('Login error', error);
            alert('Gagal terhubung ke server.');
        }
    };

    const handleClockAction = async (photoBase64: string) => {
        setIsSubmitting(true);
        setMessage(null);
        setShowCamera(false);

        // Initialize progress steps
        setProgressSteps([
            { label: 'Verifikasi Perangkat', status: 'loading' },
            { label: 'Ambil Lokasi GPS', status: 'pending' },
            { label: 'Simpan Data Absensi', status: 'pending' }
        ]);

        try {
            // Step 1: Device Fingerprint
            setProgressMessage('Memverifikasi perangkat...');
            await new Promise(r => setTimeout(r, 500));
            const deviceId = await getDeviceFingerprint();
            setProgressSteps(prev => [
                { ...prev[0], status: 'done' },
                { ...prev[1], status: 'loading' },
                { ...prev[2], status: 'pending' }
            ]);

            // Step 2: GPS
            setProgressMessage('Mengambil lokasi GPS...');
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                    timeout: 10000,
                    enableHighAccuracy: true
                });
            });
            setProgressSteps(prev => [
                { ...prev[0], status: 'done' },
                { ...prev[1], status: 'done' },
                { ...prev[2], status: 'loading' }
            ]);

            // Step 3: API Request
            setProgressMessage('Menyimpan data absensi...');
            const type = status === 'CLOCKED_IN' ? 'CLOCK_OUT' : 'CLOCK_IN';

            const res = await fetch('/api/attendance/clock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    employeeId,
                    type,
                    photoBase64,
                    deviceId,
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                })
            });

            const data = await res.json();

            if (res.ok) {
                setProgressSteps(prev => [
                    { ...prev[0], status: 'done' },
                    { ...prev[1], status: 'done' },
                    { ...prev[2], status: 'done' }
                ]);
                setProgressMessage('Berhasil!');
                await new Promise(r => setTimeout(r, 800));
                setMessage({ type: 'success', text: data.message });

                // Check for device warning
                if (data.warning) {
                    setDeviceWarning(data.warning);
                    setTimeout(() => setDeviceWarning(null), 10000); // Hide after 10s
                }

                fetchStatus(employeeId);
            } else {
                setProgressSteps(prev => [
                    { ...prev[0], status: 'done' },
                    { ...prev[1], status: 'done' },
                    { ...prev[2], status: 'error' }
                ]);
                setMessage({ type: 'error', text: data.error || 'Terjadi kesalahan' });
            }

        } catch (error: any) {
            console.error('Clock action error:', error);
            let errorMsg = 'Gagal melakukan absensi.';
            if (error.code === 1) errorMsg = 'Izin lokasi (GPS) ditolak. Mohon aktifkan GPS.';
            else if (error.code === 3) errorMsg = 'GPS timeout. Pastikan sinyal GPS kuat.';
            else if (error.message) errorMsg = error.message;

            setMessage({ type: 'error', text: errorMsg });
            // Mark current step as error
            const currentStepIndex = progressSteps.findIndex(s => s.status === 'loading');
            if (currentStepIndex !== -1) {
                setProgressSteps(prev => prev.map((step, idx) =>
                    idx === currentStepIndex ? { ...step, status: 'error' as const } : step
                ));
            }
        } finally {
            setIsSubmitting(false);
            setTimeout(() => {
                setProgressMessage('');
                setProgressSteps([]);
            }, 2000);
        }
    };

    // --- RENDERING ---

    // 1. Login View
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-[#1E1E1E] border border-[#333] shadow-2xl relative">
                    {/* Yellow accent bar */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-[#FBC02D]"></div>

                    <div className="p-8">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl font-black text-white uppercase tracking-tight mb-2">
                                Absensi <span className="text-[#FBC02D]">Tiknol</span>
                            </h1>
                            <p className="text-gray-500 text-xs uppercase tracking-widest">Attendance System</p>
                        </div>

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                                    Employee ID
                                </label>
                                <input
                                    type="text"
                                    value={employeeId}
                                    onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                    className="w-full bg-black border border-gray-700 text-white text-center text-xl font-mono tracking-widest py-4 focus:border-[#FBC02D] focus:outline-none transition-colors uppercase placeholder-gray-700"
                                    placeholder="EMP-XXX"
                                    required
                                />
                                <p className="text-xs text-gray-600 mt-2">Masukkan ID karyawan Anda</p>
                            </div>

                            <button
                                type="submit"
                                disabled={!!progressMessage}
                                className="w-full bg-[#FBC02D] text-black font-black py-4 uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-wait"
                            >
                                {progressMessage || 'Login to System'}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Camera View
    if (showCamera) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                {/* Progress Overlay */}
                {isSubmitting && (
                    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center p-8">
                        <div className="w-full max-w-md space-y-6">
                            {/* Main Progress Indicator */}
                            <div className="text-center mb-8">
                                <Loader2 className="animate-spin text-[#FBC02D] mx-auto mb-4" size={64} />
                                <p className="text-white font-black text-xl mb-2">{progressMessage || 'Memproses...'}</p>
                                <p className="text-gray-500 text-sm">Mohon tunggu, jangan tutup halaman</p>
                            </div>

                            {/* Step-by-Step Progress */}
                            <div className="space-y-3">
                                {progressSteps.map((step, index) => (
                                    <div
                                        key={index}
                                        className={`flex items-center gap-3 p-4 border ${step.status === 'done' ? 'border-green-500/30 bg-green-500/10' :
                                            step.status === 'loading' ? 'border-[#FBC02D]/30 bg-[#FBC02D]/10' :
                                                step.status === 'error' ? 'border-red-500/30 bg-red-500/10' :
                                                    'border-gray-700 bg-gray-900/50'
                                            } transition-all duration-300`}
                                    >
                                        {step.status === 'done' && <CheckCircle2 className="text-green-500 flex-shrink-0" size={20} />}
                                        {step.status === 'loading' && <Loader2 className="animate-spin text-[#FBC02D] flex-shrink-0" size={20} />}
                                        {step.status === 'error' && <XCircle className="text-red-500 flex-shrink-0" size={20} />}
                                        {step.status === 'pending' && <div className="w-5 h-5 border-2 border-gray-600 rounded-full flex-shrink-0"></div>}

                                        <span className={`font-bold text-sm ${step.status === 'done' ? 'text-green-400' :
                                            step.status === 'loading' ? 'text-[#FBC02D]' :
                                                step.status === 'error' ? 'text-red-400' :
                                                    'text-gray-500'
                                            }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative">
                    <CameraCapture
                        onCapture={handleClockAction}
                        label={status === 'CLOCKED_IN' ? 'FOTO OUTLET (PULANG)' : 'FOTO KASIR (MASUK)'}
                        isProcessing={isSubmitting}
                    />
                </div>
                {!isSubmitting && (
                    <button
                        onClick={() => setShowCamera(false)}
                        className="absolute top-6 right-6 bg-white border-2 border-black px-4 py-2 font-bold uppercase tracking-wide hover:bg-[#FBC02D] transition-colors z-50 text-black text-sm"
                    >
                        BATAL
                    </button>
                )}
            </div>
        );
    }

    // 3. Main Dashboard View
    const isWorking = status === 'CLOCKED_IN';

    return (
        <div className="min-h-screen bg-[#121212] text-white flex flex-col p-4 md:p-8 overflow-y-auto">

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 bg-[#1E1E1E] border border-[#333] px-4 py-3">
                    <div className="w-12 h-12 bg-[#FBC02D] flex items-center justify-center font-black text-xl text-black">
                        {employeeId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-bold text-gray-500 leading-none mb-1 tracking-widest">Employee ID</p>
                        <p className="font-mono font-black text-xl leading-none tracking-wider text-white">{employeeId}</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="p-3 bg-[#1E1E1E] border border-[#333] text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
                >
                    <LogOut size={24} />
                </button>
            </div>

            {/* Clock Display */}
            <div className="text-center mb-10 mt-8">
                <div className="inline-block bg-[#1E1E1E] border border-[#333] px-6 py-2 mb-4">
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">
                        {serverTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <h1 className="text-7xl font-black tracking-tighter text-white font-mono">
                    {serverTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    <span className="text-2xl text-gray-600 ml-2 font-bold">
                        {serverTime.toLocaleTimeString('id-ID', { second: '2-digit' })}
                    </span>
                </h1>
            </div>

            {/* BIG BUTTON */}
            <div className="flex-1 flex flex-col justify-center items-center pb-10 min-h-[400px]">
                {isSubmitting ? (
                    <div className="w-56 h-56 md:w-64 md:h-64 bg-[#1E1E1E] border-4 border-[#333] flex flex-col items-center justify-center">
                        <Loader2 className="animate-spin text-[#FBC02D] mb-2" size={48} />
                        <span className="font-black text-white uppercase tracking-widest text-sm md:text-base">MEMPROSES...</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCamera(true)}
                        disabled={status === 'CLOCKED_OUT' || status === 'LOADING'}
                        className={`
              relative w-64 h-64 md:w-80 md:h-80 flex flex-col items-center justify-center transition-all duration-200 border-4
              ${status === 'LOADING' ? 'bg-[#1E1E1E] border-gray-600 cursor-wait' : ''}
              ${status === 'NOT_CLOCKED_IN' ? 'bg-[#FBC02D] border-[#FBC02D] hover:bg-white active:scale-95' : ''}
              ${status === 'CLOCKED_IN' ? 'bg-[#333] border-[#333] hover:bg-[#444] active:scale-95' : ''}
              ${status === 'CLOCKED_OUT' ? 'bg-[#1E1E1E] border-gray-700 cursor-not-allowed' : ''}
            `}
                    >
                        {status === 'NOT_CLOCKED_IN' && (
                            <>
                                <MapPin size={64} className="mb-2 text-black" />
                                <span className="text-4xl font-black tracking-tight text-black">MASUK</span>
                                <span className="text-xs font-bold uppercase tracking-widest mt-2 border-2 border-black px-3 py-1 bg-black text-[#FBC02D]">MULAI SHIFT</span>
                            </>
                        )}
                        {status === 'CLOCKED_IN' && (
                            <>
                                <Clock size={64} className="mb-2 text-white" />
                                <span className="text-4xl font-black tracking-tight text-white">PULANG</span>
                                <span className="text-xs font-bold uppercase tracking-widest mt-2 border-2 border-white px-3 py-1 bg-white text-black">AKHIRI SHIFT</span>
                            </>
                        )}
                        {status === 'CLOCKED_OUT' && (
                            <>
                                <span className="text-2xl font-black uppercase text-gray-600">SELESAI</span>
                                <span className="text-xs mt-2 text-center px-8 font-bold text-gray-700">Sampai jumpa besok!</span>
                            </>
                        )}
                    </button>
                )}

                {/* Status Message */}
                {message && (
                    <div className={`mt-10 px-6 py-4 border-2 font-black text-center uppercase tracking-wide ${message.type === 'success'
                        ? 'bg-green-500/20 border-green-500/50 text-green-400'
                        : 'bg-red-500/20 border-red-500/50 text-red-400'
                        }`}>
                        {message.text}
                    </div>
                )}
            </div>

            {/* Device Warning Toast */}
            {deviceWarning && (
                <div className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-yellow-500/20 border-2 border-yellow-500 text-yellow-100 p-4 z-50 animate-in slide-in-from-top-4">
                    <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center text-black font-black text-xs">!</div>
                        <div className="flex-1">
                            <p className="font-bold text-sm mb-1">Peringatan Keamanan</p>
                            <p className="text-xs">{deviceWarning}</p>
                        </div>
                        <button onClick={() => setDeviceWarning(null)} className="text-yellow-300 hover:text-white">
                            <XCircle size={20} />
                        </button>
                    </div>
                </div>
            )}

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-[#1E1E1E] border-2 border-[#333] max-w-sm w-full p-6">
                        <h3 className="text-xl font-black text-white mb-2">Konfirmasi Logout</h3>
                        <p className="text-gray-400 text-sm mb-6">Apakah Anda yakin ingin keluar dari sistem absensi?</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 bg-[#333] text-white font-bold py-3 uppercase text-sm hover:bg-[#444] transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('tiknol_employee_id');
                                    setIsLoggedIn(false);
                                    setShowLogoutConfirm(false);
                                }}
                                className="flex-1 bg-[#FBC02D] text-black font-bold py-3 uppercase text-sm hover:bg-white transition-colors"
                            >
                                Ya, Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

        </div>
    );
}
