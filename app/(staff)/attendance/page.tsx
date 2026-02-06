'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getDeviceFingerprint } from '@/lib/fingerprint';
import CameraCapture from '@/app/components/CameraCapture';
import { MapPin, Clock, LogOut, Loader2 } from 'lucide-react';

type AttendanceStatus = 'LOADING' | 'NOT_CLOCKED_IN' | 'CLOCKED_IN' | 'CLOCKED_OUT';

export default function AttendancePage() {
    const router = useRouter();

    // State
    const [employeeId, setEmployeeId] = useState<string>(''); // Should be persistent
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [status, setStatus] = useState<AttendanceStatus>('LOADING');
    const [serverTime, setServerTime] = useState<Date>(new Date());
    const [showCamera, setShowCamera] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Load Employee ID from LocalStorage on mount
    useEffect(() => {
        const savedId = localStorage.getItem('tiknol_employee_id');
        if (savedId) {
            setEmployeeId(savedId);
            setIsLoggedIn(true);
            fetchStatus(savedId);
        } else {
            setStatus('NOT_CLOCKED_IN'); // Just to stop loading spinner
        }
    }, []);

    // Timer for Clock
    useEffect(() => {
        const timer = setInterval(() => {
            setServerTime(new Date()); //Ideally strictly synced with server, but this is visual only
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
                // Handle invalid ID (e.g. clear storage)
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

        // Visual Feedback Loading could be added here
        try {
            const res = await fetch(`/api/attendance/status?employeeId=${employeeId}`);
            if (res.ok) {
                const data = await res.json();
                localStorage.setItem('tiknol_employee_id', employeeId);
                setStatus(data.status);
                if (data.serverTime) setServerTime(new Date(data.serverTime));
                setIsLoggedIn(true);
            } else {
                alert('ID Karyawan tidak ditemukan atau tidak aktif.');
                setEmployeeId(''); // Clear input on failure
            }
        } catch (error) {
            console.error('Login error', error);
            alert('Gagal terhubung ke server.');
        }
    };

    const getMaxAttempts = () => {
        // If you want to limit attempts of getting GPS
        return 3;
    }

    const handleClockAction = async (photoBase64: string) => {
        setIsSubmitting(true);
        setMessage(null);

        try {
            // 1. Get Fingerprint
            const deviceId = await getDeviceFingerprint();

            // 2. Get GPS
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            // 3. Send API Request
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
                setMessage({ type: 'success', text: data.message });
                setShowCamera(false);
                fetchStatus(employeeId); // Refresh status
            } else {
                setMessage({ type: 'error', text: data.error || 'Terjadi kesalahan' });
                setShowCamera(false); // Close camera to show error
            }

        } catch (error: any) {
            console.error('Clock action error:', error);
            let errorMsg = 'Gagal melakukan absensi.';
            if (error.code === 1) errorMsg = 'Izin lokasi (GPS) ditolak. Mohon aktifkan GPS.';
            else if (error.message) errorMsg = error.message;

            setMessage({ type: 'error', text: errorMsg });
            setShowCamera(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- RENDERING ---

    // 1. Login View
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-[#FFF8E1] flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-xl border-4 border-black shadow-[8px_8px_0px_black] w-full max-w-sm">
                    <h1 className="text-3xl font-black text-center mb-8 uppercase tracking-tighter text-black">Absensi<br />Tiknol</h1>
                    <form onSubmit={handleLogin} className="space-y-6">
                        <div>
                            <label className="block text-sm font-black mb-2 uppercase tracking-wide text-black">ID Karyawan</label>
                            <input
                                type="text"
                                value={employeeId}
                                onChange={(e) => setEmployeeId(e.target.value.toUpperCase())}
                                className="w-full border-4 border-black rounded-lg p-4 font-mono text-center text-xl font-bold uppercase focus:outline-none focus:shadow-[4px_4px_0px_black] transition-all text-black placeholder:text-gray-400"
                                placeholder="EMP-XXX"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-[#00E676] text-black font-black text-xl py-4 rounded-lg border-4 border-black shadow-[4px_4px_0px_black] active:shadow-none active:translate-y-1 transition-all hover:bg-[#00C853] uppercase tracking-wide"
                        >
                            MASUK
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    // 2. Camera View
    if (showCamera) {
        return (
            <div className="fixed inset-0 bg-black z-50 flex flex-col">
                <div className="flex-1 relative">
                    <CameraCapture
                        onCapture={handleClockAction}
                        label={status === 'CLOCKED_IN' ? 'FOTO OUTLET (PULANG)' : 'FOTO KASIR (MASUK)'}
                    />
                </div>
                <button
                    onClick={() => setShowCamera(false)}
                    className="absolute top-6 right-6 bg-white border-2 border-black px-4 py-2 rounded-full font-bold shadow-[4px_4px_0px_black] active:translate-y-1 active:shadow-none transition-all z-50 text-black"
                >
                    BATAL
                </button>
            </div>
        );
    }

    // 3. Main Dashboard View
    const isWorking = status === 'CLOCKED_IN';

    return (
        <div className={`min-h-screen flex flex-col p-4 md:p-8 transition-colors duration-500 overflow-y-auto ${isWorking ? 'bg-[#E0F7FA]' : 'bg-[#FFF8E1]'}`}>

            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3 bg-white p-3 pr-5 rounded-xl border-4 border-black shadow-[4px_4px_0px_black]">
                    <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center font-black text-xl border-2 border-transparent">
                        {employeeId.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <p className="text-[10px] uppercase font-black text-black leading-none mb-1 tracking-widest">ID Karyawan</p>
                        <p className="font-mono font-black text-2xl leading-none tracking-wider text-black">{employeeId}</p>
                    </div>
                </div>
                <button
                    onClick={() => {
                        localStorage.removeItem('tiknol_employee_id');
                        setIsLoggedIn(false);
                    }}
                    className="p-3 bg-[#FF1744] border-4 border-black rounded-lg text-white hover:bg-red-600 shadow-[4px_4px_0px_black] active:shadow-none active:translate-y-1 transition-all"
                >
                    <LogOut size={24} className="stroke-[3]" />
                </button>
            </div>

            {/* Clock Display */}
            <div className="text-center mb-10 mt-8">
                <div className="inline-block bg-white border-2 border-black px-6 py-2 rounded-full shadow-[4px_4px_0px_black] mb-4">
                    <p className="text-black font-black uppercase tracking-widest text-sm">
                        {serverTime.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <h1 className="text-7xl font-black tracking-tighter text-black font-mono drop-shadow-sm">
                    {serverTime.toLocaleTimeString('id-ID', { hour12: false, hour: '2-digit', minute: '2-digit' })}
                    <span className="text-2xl text-gray-500 ml-2 font-bold">
                        {serverTime.toLocaleTimeString('id-ID', { second: '2-digit' })}
                    </span>
                </h1>
            </div>

            {/* BIG BUTTON */}
            <div className="flex-1 flex flex-col justify-center items-center pb-10 min-h-[400px]">
                {isSubmitting ? (
                    <div className="w-56 h-56 md:w-64 md:h-64 rounded-full bg-white border-4 border-black flex flex-col items-center justify-center animate-pulse shadow-[8px_8px_0px_black]">
                        <Loader2 className="animate-spin text-black mb-2" size={48} />
                        <span className="font-black text-black uppercase tracking-widest text-sm md:text-base">MEMPROSES...</span>
                    </div>
                ) : (
                    <button
                        onClick={() => setShowCamera(true)}
                        disabled={status === 'CLOCKED_OUT' || status === 'LOADING'}
                        className={`
              relative w-64 h-64 md:w-80 md:h-80 rounded-full flex flex-col items-center justify-center transition-all duration-200
              border-4 border-black
              active:scale-95 active:shadow-none active:translate-y-2 active:translate-x-2
              ${status === 'LOADING' ? 'bg-gray-200 cursor-wait shadow-[8px_8px_0px_gray]' : ''}
              ${status === 'NOT_CLOCKED_IN' ? 'bg-[#00E676] hover:bg-[#00C853] text-black shadow-[10px_10px_0px_black] md:shadow-[14px_14px_0px_black]' : ''}
              ${status === 'CLOCKED_IN' ? 'bg-[#FF1744] hover:bg-[#D50000] text-white shadow-[10px_10px_0px_black] md:shadow-[14px_14px_0px_black]' : ''}
              ${status === 'CLOCKED_OUT' ? 'bg-gray-800 text-gray-400 border-gray-600 cursor-not-allowed shadow-[8px_8px_0px_gray]' : ''}
            `}
                    >
                        {status === 'NOT_CLOCKED_IN' && (
                            <>
                                <MapPin size={64} className="mb-2 stroke-[2.5]" />
                                <span className="text-4xl font-black tracking-tight">MASUK</span>
                                <span className="text-sm font-bold uppercase tracking-widest mt-2 border-2 border-black px-3 py-1 rounded-full bg-white">MULAI SHIFT</span>
                            </>
                        )}
                        {status === 'CLOCKED_IN' && (
                            <>
                                <Clock size={64} className="mb-2 stroke-[2.5]" />
                                <span className="text-4xl font-black tracking-tight">PULANG</span>
                                <span className="text-sm font-bold uppercase tracking-widest mt-2 border-2 border-white px-3 py-1 rounded-full bg-black text-white">AKHIRI SHIFT</span>
                            </>
                        )}
                        {status === 'CLOCKED_OUT' && (
                            <>
                                <span className="text-2xl font-black uppercase">SELESAI</span>
                                <span className="text-xs mt-2 text-center px-8 font-bold opacity-70">Sampai jumpa besok!</span>
                            </>
                        )}
                    </button>
                )}

                {/* Status Message */}
                {message && (
                    <div className={`mt-10 px-6 py-4 rounded-xl border-2 border-black shadow-[4px_4px_0px_black] font-black text-center uppercase tracking-wide animate-in fade-in slide-in-from-bottom-4 ${message.type === 'success' ? 'bg-[#00E676] text-black' : 'bg-[#FF1744] text-white'}`}>
                        {message.text}
                    </div>
                )}
            </div>

        </div>
    );
}
