'use client';

import Link from 'next/link';
import { Users, Clock, ChevronRight } from 'lucide-react';

const teamItems = [
    {
        href: '/super-admin/employees',
        label: 'Employees & Access',
        description: 'Kelola staff, role & akses multi-cabang',
        icon: <Users size={24} />,
        color: 'bg-emerald-500',
        glow: 'shadow-emerald-500/20',
    },
    {
        href: '/super-admin/attendance',
        label: 'Attendance Log',
        description: 'Riwayat absensi, clock in/out & foto',
        icon: <Clock size={24} />,
        color: 'bg-violet-500',
        glow: 'shadow-violet-500/20',
    },
];

export default function TeamHubPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10">
            <header className="mb-8">
                <h1 className="text-4xl font-black tracking-tight mb-2">Team</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Kelola karyawan dan pantau kehadiran
                </p>
            </header>

            <div className="grid gap-4">
                {teamItems.map((item) => (
                    <Link
                        key={item.href}
                        href={item.href}
                        className="group bg-white dark:bg-[#111] rounded-2xl border border-gray-100 dark:border-[#222] p-5 flex items-center gap-4 hover:border-[#FFBF00]/50 transition-all shadow-sm hover:shadow-lg active:scale-[0.98]"
                    >
                        <div className={`w-12 h-12 rounded-xl ${item.color} flex items-center justify-center text-white shadow-lg ${item.glow} group-hover:scale-110 transition-transform`}>
                            {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-black text-lg dark:text-white">{item.label}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{item.description}</p>
                        </div>
                        <ChevronRight size={20} className="text-gray-300 dark:text-gray-600 group-hover:text-[#FFBF00] transition-colors" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
