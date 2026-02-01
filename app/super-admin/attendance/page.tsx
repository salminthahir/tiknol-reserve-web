'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Image as ImageIcon, X, Clock, User } from 'lucide-react';
import TableSkeleton from '@/app/components/skeletons/TableSkeleton';

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

export default function AttendancePage() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPhoto, setSelectedPhoto] = useState<AttendanceRecord | null>(null);

    useEffect(() => {
        fetchAttendance();
    }, [date]);

    const fetchAttendance = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/attendance?date=${date}`);
            if (res.ok) {
                const data = await res.json();
                setRecords(data);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <TableSkeleton />;
    }

    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10 transition-colors">

            {/* Header */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2">Attendance Recap</h1>
                    <p className="text-gray-500 dark:text-gray-400">Daily employee presence log</p>
                </div>

                <div className="flex items-center gap-4 bg-white dark:bg-[#111] p-2 rounded-xl border border-gray-100 dark:border-[#222] shadow-sm">
                    <Calendar className="text-gray-400 ml-2" size={18} />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="bg-transparent border-none outline-none font-bold text-sm uppercase dark:text-white"
                    />
                </div>
            </header>

            {records.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-gray-200 dark:border-[#222] rounded-2xl">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-[#111] rounded-full flex items-center justify-center mb-4 text-gray-400">
                        <Clock size={24} />
                    </div>
                    <h3 className="text-lg font-black dark:text-white">No Records Found</h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Try selecting another date</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {records.map((rec) => (
                        <div key={rec.id} className="group bg-white dark:bg-[#111] p-4 rounded-xl border border-gray-100 dark:border-[#222] hover:border-[#FFBF00]/50 transition-all shadow-sm flex flex-col md:flex-row items-center gap-6">

                            {/* Time Badge */}
                            <div className={`w-full md:w-28 text-center p-3 rounded-lg ${rec.type === 'CLOCK_IN'
                                ? 'bg-green-50 dark:bg-green-900/20 text-green-600'
                                : 'bg-red-50 dark:bg-red-900/20 text-red-600'
                                }`}>
                                <p className="text-[10px] font-black uppercase mb-1 tracking-widest">{rec.type === 'CLOCK_IN' ? 'IN' : 'OUT'}</p>
                                <p className="text-xl font-black font-mono leading-none">
                                    {new Date(rec.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            </div>

                            {/* Employee Info */}
                            <div className="flex-1 text-center md:text-left">
                                <h3 className="text-lg font-black dark:text-white">{rec.employee.name}</h3>
                                <div className="flex items-center justify-center md:justify-start gap-2 mt-1">
                                    <span className="text-xs font-bold text-gray-400 flex items-center gap-1">
                                        <User size={12} /> {rec.employee.role || 'Staff'}
                                    </span>
                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${rec.status === 'APPROVED'
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                                        : 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600'
                                        }`}>
                                        {rec.status}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 w-full md:w-auto">
                                <button
                                    onClick={() => setSelectedPhoto(rec)}
                                    className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#222] text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <ImageIcon size={14} /> Photo
                                </button>
                                <button
                                    onClick={() => window.open(`https://www.google.com/maps?q=${rec.latitude},${rec.longitude}`, '_blank')}
                                    className="flex-1 md:flex-none py-2 px-4 rounded-lg bg-gray-50 dark:bg-[#1A1A1A] hover:bg-gray-100 dark:hover:bg-[#222] text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <MapPin size={14} /> Location
                                </button>
                            </div>

                        </div>
                    ))}
                </div>
            )}

            {/* Photo Modal */}
            {selectedPhoto && (
                <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedPhoto(null)}>
                    <div className="bg-white dark:bg-[#111] p-2 rounded-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedPhoto(null)} className="absolute -top-12 right-0 text-white flex items-center gap-2 font-bold text-sm hover:opacity-80">
                            CLOSE <div className="bg-white text-black p-1 rounded-full"><X size={14} /></div>
                        </button>
                        <img
                            src={selectedPhoto.photoUrl}
                            alt="Evidence"
                            className="w-full rounded-xl"
                        />
                        <div className="p-4 text-center">
                            <h3 className="font-black text-lg dark:text-white uppercase">{selectedPhoto.employee.name}</h3>
                            <p className="text-xs font-mono font-bold text-gray-500">
                                {new Date(selectedPhoto.timestamp).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' })}
                            </p>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
