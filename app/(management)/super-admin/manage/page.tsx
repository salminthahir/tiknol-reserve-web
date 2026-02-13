'use client';

import Link from 'next/link';
import { Building2, Ticket, Settings, ChevronRight } from 'lucide-react';

const manageItems = [
    {
        href: '/super-admin/branches',
        label: 'Branch Management',
        description: 'Kelola cabang, lokasi & jam operasional',
        icon: <Building2 size={24} />,
        color: 'bg-blue-500',
        glow: 'shadow-blue-500/20',
    },
    {
        href: '/super-admin/vouchers',
        label: 'Voucher & Promo',
        description: 'Kelola diskon, kupon & happy hour',
        icon: <Ticket size={24} />,
        color: 'bg-[#FFBF00]',
        glow: 'shadow-[#FFBF00]/20',
    },
    {
        href: '/super-admin/settings',
        label: 'System Settings',
        description: 'Pengaturan global aplikasi',
        icon: <Settings size={24} />,
        color: 'bg-gray-500',
        glow: 'shadow-gray-500/20',
    },
];

export default function ManageHubPage() {
    return (
        <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#0A0A0A] text-slate-900 dark:text-white font-sans p-6 lg:p-10">
            <header className="mb-8">
                <h1 className="text-4xl font-black tracking-tight mb-2">Manage</h1>
                <p className="text-gray-500 dark:text-gray-400">
                    Kelola cabang, promosi, dan pengaturan sistem
                </p>
            </header>

            <div className="grid gap-4">
                {manageItems.map((item) => (
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
