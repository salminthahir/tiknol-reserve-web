'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    Building2,
    Users,
    Settings
} from 'lucide-react';

export default function SuperAdminMobileNav() {
    const pathname = usePathname();

    const links = [
        { href: '/super-admin/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { href: '/super-admin/revenue', label: 'Revenue', icon: <TrendingUp size={20} /> },
        { href: '/super-admin/manage', label: 'Manage', icon: <Building2 size={20} /> },
        { href: '/super-admin/team', label: 'Team', icon: <Users size={20} /> },
        { href: '/super-admin/settings', label: 'Config', icon: <Settings size={20} /> },
    ];

    // Check if a nav link is active — supports sub-pages for hub tabs
    const isLinkActive = (href: string) => {
        if (href === '/super-admin/dashboard') return pathname === href;
        if (href === '/super-admin/manage') {
            return pathname === href ||
                pathname.startsWith('/super-admin/branches') ||
                pathname.startsWith('/super-admin/vouchers');
        }
        if (href === '/super-admin/team') {
            return pathname === href ||
                pathname.startsWith('/super-admin/employees') ||
                pathname.startsWith('/super-admin/attendance');
        }
        return pathname === href || pathname.startsWith(href + '/');
    };

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            <div className="bg-[#111] border-t border-[#333] px-2 pb-5 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <nav className="flex justify-between items-center sm:justify-around">
                    {links.map((link) => {
                        const isActive = isLinkActive(link.href);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="relative flex-1 group"
                            >
                                <motion.div
                                    className="flex flex-col items-center justify-center p-2 rounded-xl transition-colors"
                                    whileTap={{ scale: 0.8 }}
                                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                                >
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavIndicator"
                                            className="absolute inset-0 bg-[#FFBF00]/10 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    <div className={`relative z-10 ${isActive ? 'text-[#FFBF00]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {link.icon}
                                    </div>

                                    <span className={`relative z-10 text-[9px] font-black uppercase tracking-wider mt-1 ${isActive ? 'text-[#FFBF00]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {link.label}
                                    </span>
                                </motion.div>
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}
