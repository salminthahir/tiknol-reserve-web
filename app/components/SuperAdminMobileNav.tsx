'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    TrendingUp,
    Ticket,
    Users,
    Settings
} from 'lucide-react';

export default function SuperAdminMobileNav() {
    const pathname = usePathname();

    const links = [
        { href: '/super-admin/dashboard', label: 'Home', icon: <LayoutDashboard size={20} /> },
        { href: '/super-admin/revenue', label: 'Revenue', icon: <TrendingUp size={20} /> },
        { href: '/super-admin/vouchers', label: 'Promo', icon: <Ticket size={20} /> },
        { href: '/super-admin/employees', label: 'Team', icon: <Users size={20} /> },
        { href: '/super-admin/settings', label: 'Config', icon: <Settings size={20} /> },
    ];

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden pb-safe">
            {/* Safe Area for iPhone Home Indicator is handled by pb-safe if using viewport-fit=cover, but standard padding works too */}
            <div className="bg-[#111] border-t border-[#333] px-2 pb-5 pt-2 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
                <nav className="flex justify-between items-center sm:justify-around">
                    {links.map((link) => {
                        const isActive = pathname === link.href;

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
                                    {/* Active Background Indicator */}
                                    {isActive && (
                                        <motion.div
                                            layoutId="mobileNavIndicator"
                                            className="absolute inset-0 bg-[#FFBF00]/10 rounded-xl"
                                            initial={false}
                                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon */}
                                    <div className={`relative z-10 ${isActive ? 'text-[#FFBF00]' : 'text-gray-500 group-hover:text-gray-300'}`}>
                                        {link.icon}
                                    </div>

                                    {/* Label */}
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
