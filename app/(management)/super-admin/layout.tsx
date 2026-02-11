'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import SuperAdminMobileNav from '@/app/components/SuperAdminMobileNav';
import {
    LayoutDashboard,
    TrendingUp,
    Ticket,
    Users,
    Settings,
    Clock,
    LogOut,
    Building2
} from 'lucide-react';
import { useState } from 'react';

export default function SuperAdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();
    const router = useRouter();

    // Hide sidebar/mobile nav on login page
    if (pathname === '/super-admin/login') {
        return <>{children}</>;
    }

    const menuItems = [
        { href: '/super-admin/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
        { href: '/super-admin/revenue', label: 'Revenue Analytics', icon: <TrendingUp size={20} /> },
        { href: '/super-admin/branches', label: 'Branch Management', icon: <Building2 size={20} /> },
        { href: '/super-admin/vouchers', label: 'Voucher Manager', icon: <Ticket size={20} /> },
        { href: '/super-admin/employees', label: 'Employee & Access', icon: <Users size={20} /> },
        { href: '/super-admin/attendance', label: 'Attendance Log', icon: <Clock size={20} /> },
        { href: '/super-admin/settings', label: 'System Settings', icon: <Settings size={20} /> },
    ];

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/super-admin/logout', { method: 'POST' });
            router.push('/super-admin/login');
        } catch (error) {
            console.error('Logout failed', error);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] dark:bg-black font-sans flex">
            {/* SIDEBAR - Desktop Only */}
            <aside className={`
                fixed inset-y-0 left-0 z-50 w-64 bg-black text-white transform transition-transform duration-300 ease-in-out border-r border-[#333]
                hidden md:flex flex-col
            `}>
                {/* Brand */}
                <div className="p-8 pb-4 flex justify-between items-center">
                    <h1 className="text-3xl font-black italic tracking-tighter uppercase">
                        <span className="text-[#FFBF00]">.</span>NOL
                        <span className="block text-xs font-bold not-italic tracking-widest text-gray-500 mt-1">SUPER ADMIN</span>
                    </h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`
                                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-[#FFBF00] text-black shadow-[0_0_20px_rgba(255,191,0,0.3)] font-bold'
                                        : 'text-gray-400 hover:bg-[#1A1A1A] hover:text-white'
                                    }
                                `}
                            >
                                <span className={isActive ? 'text-black' : 'text-gray-500 group-hover:text-white'}>
                                    {item.icon}
                                </span>
                                <span className="text-sm tracking-wide">{item.label}</span>
                                {isActive && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-black/50"></div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {/* User Profile */}
                <div className="p-4 border-t border-[#333]">
                    <div className="bg-[#1A1A1A] rounded-xl p-3 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#333] flex items-center justify-center font-bold text-[#FFBF00]">
                            AD
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate">Admin User</p>
                            <p className="text-xs text-gray-500 truncate">Super Access</p>
                        </div>
                        <button onClick={handleLogout} className="text-gray-500 hover:text-white transition-colors" title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* MOBILE NAV - Bottom Fixed */}
            <SuperAdminMobileNav />

            {/* MAIN CONTENT */}
            <main className="flex-1 min-w-0 overflow-x-hidden mb-20 md:mb-0 md:ml-64">
                {/* Mobile Header Trigger */}
                <div className="md:hidden p-4 bg-white dark:bg-[#111] flex justify-between items-center sticky top-0 z-40 border-b border-gray-100 dark:border-[#222]">
                    <h1 className="font-black italic text-xl dark:text-white">
                        <span className="text-[#FFBF00]">.</span>NOL <span className="text-xs font-normal tracking-widest text-gray-400">ADMIN</span>
                    </h1>
                </div>

                {children}
            </main>
        </div>
    );
}
