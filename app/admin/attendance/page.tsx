'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Eye, Clock, User, X, Image as ImageIcon } from 'lucide-react';

interface AttendanceRecord {
    id: string;
    type: 'CLOCK_IN' | 'CLOCK_OUT';
    timestamp: string; // ISO string
    photoUrl: string;
    latitude: number;
    longitude: number;
    status: string;
    employee: {
        name: string;
        role: string;
    };
}

export default function AdminAttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedPhoto, setSelectedPhoto] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const fetchAttendance = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/attendance?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const openMap = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    return (
        <div className="p-6 md:p-10 bg-[#E0F7FA] min-h-screen font-sans">
            <div className="max-w-6xl mx-auto">

                {/* Header & Filter */}
                <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-black tracking-tight uppercase mb-2">Rekap Absensi</h1>
                        <p className="font-bold text-black">Pantau kehadiran karyawan harian</p>
                    </div>

                    <div className="flex items-center gap-2 bg-white p-2 rounded-lg border-4 border-black shadow-[4px_4px_0px_black]">
                        <Calendar className="text-black" />
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="font-bold outline-none bg-transparent uppercase"
                        />
                    </div>
                </div>

                {/* Content */}
                {isLoading ? (
                    <div className="text-center font-black text-xl animate-pulse py-20">MEMUAT DATA...</div>
                ) : records.length === 0 ? (
                    <div className="text-center py-20 border-4 border-dashed border-black rounded-xl">
                        <p className="text-2xl font-black text-black uppercase">Belum ada data absensi</p>
                        <p className="font-bold text-black">Pilih tanggal lain atau tunggu karyawan absen.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {records.map((rec) => (
                            <div key={rec.id} className="bg-white border-4 border-black rounded-xl p-4 shadow-[8px_8px_0px_black] flex flex-col md:flex-row items-center gap-6 transition-all hover:bg-gray-50">

                                {/* Time & Type */}
                                <div className={`w-full md:w-32 text-center p-3 rounded-lg border-2 border-black ${rec.type === 'CLOCK_IN' ? 'bg-[#CCFF90]' : 'bg-[#FF8A80]'}`}>
                                    <p className="text-xs font-black uppercase mb-1">{rec.type === 'CLOCK_IN' ? 'MASUK' : 'PULANG'}</p>
                                    <p className="text-2xl font-black font-mono leading-none">
                                        {new Date(rec.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                {/* Employee Info */}
                                <div className="flex-1 text-center md:text-left">
                                    <h3 className="text-xl font-black uppercase">{rec.employee.name}</h3>
                                    <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                        <span className="bg-black text-white text-[10px] px-2 py-0.5 rounded font-bold uppercase">{rec.employee.role}</span>
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded border border-black ${rec.status === 'APPROVED' ? 'bg-blue-100' : 'bg-yellow-100'}`}>
                                            {rec.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => setSelectedPhoto(rec)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border-2 border-black rounded-lg font-bold shadow-[2px_2px_0px_black] active:shadow-none hover:bg-gray-100"
                                    >
                                        <ImageIcon size={18} /> Foto
                                    </button>
                                    <button
                                        onClick={() => openMap(rec.latitude, rec.longitude)}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-yellow-300 border-2 border-black rounded-lg font-bold shadow-[2px_2px_0px_black] active:shadow-none hover:bg-yellow-400"
                                    >
                                        <MapPin size={18} /> Lokasi
                                    </button>
                                </div>

                            </div>
                        ))}
                    </div>
                )}

                {/* Photo Modal */}
                {selectedPhoto && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4" onClick={() => setSelectedPhoto(null)}>
                        <div className="relative bg-white p-2 rounded-xl max-w-lg w-full" onClick={e => e.stopPropagation()}>
                            <button
                                onClick={() => setSelectedPhoto(null)}
                                className="absolute -top-12 right-0 text-white hover:text-red-500 font-bold flex items-center gap-2"
                            >
                                TUTUP <X className="bg-white text-black rounded-full" />
                            </button>
                            <img
                                src={selectedPhoto.photoUrl}
                                alt="Bukti Absen"
                                className="w-full rounded-lg border-2 border-black"
                            />
                            <div className="mt-4 text-center">
                                <p className="font-black uppercase text-xl text-black">{selectedPhoto.employee.name}</p>
                                <p className="font-mono font-bold text-black">
                                    {new Date(selectedPhoto.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
