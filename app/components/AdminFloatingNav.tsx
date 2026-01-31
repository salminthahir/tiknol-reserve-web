'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ShoppingBag,
    History,
    UtensilsCrossed,
    TrendingUp,
    ChevronRight,
    ChefHat,
    X,
    Menu as MenuIcon,
    Ticket,
    Users
} from 'lucide-react';

export default function AdminFloatingNav() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    // Auto-close on route change
    useEffect(() => {
        setIsOpen(false);
    }, [pathname]);

    const links = [
        { href: '/admin/dashboard', label: 'Kitchen', icon: <ChefHat size={20} /> },
        { href: '/admin/pos', label: 'POS', icon: <ShoppingBag size={20} /> },
        { href: '/admin/pos-history', label: 'History', icon: <History size={20} /> },
        { href: '/admin/menu', label: 'Menu', icon: <UtensilsCrossed size={20} /> },
        { href: '/admin/employees', label: 'Employees', icon: <Users size={20} /> },
        { href: '/admin/vouchers', label: 'Vouchers', icon: <Ticket size={20} /> },
        { href: '/admin/revenue', label: 'Revenue', icon: <TrendingUp size={20} /> },
    ];

    return (
        <>
            {/* BACKDROP (Close on click outside) */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black/20 z-[90] backdrop-blur-[1px]"
                    onClick={() => setIsOpen(false)}
                />
            )}

            <div className="fixed left-0 top-1/2 -translate-y-1/2 z-[100] flex items-center font-sans pointer-events-none">
                <div className="relative pointer-events-auto">

                    {/* TRIGGER BUTTON (Visible when CLOSED) */}
                    {/* Reverted to Yellow, but with Thick Black Border for contrast */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className={`
                            absolute left-0 top-1/2 -translate-y-1/2 
                            flex items-center justify-center
                            bg-[#FFDE59] text-black
                            border-y-4 border-r-4 border-black 
                            shadow-[4px_8px_0px_rgba(0,0,0,0.5)]
                            transition-all duration-300 cubic-bezier(0.34, 1.56, 0.64, 1)
                            h-16 w-14 rounded-r-2xl
                            active:scale-90 active:shadow-none hover:w-16
                            ${isOpen ? 'opacity-0 translate-x-[-100%] pointer-events-none' : 'opacity-100 translate-x-0'}
                        `}
                        aria-label="Open Navigation"
                    >
                        {/* Black Icon on Yellow = High Contrast */}
                        <ChevronRight size={32} strokeWidth={3} />
                    </button>

                    {/* MENU DRAWER (Visible when OPEN) */}
                    <div
                        className={`
                            absolute left-0 top-1/2 -translate-y-1/2
                            flex flex-col gap-3
                            bg-[#FFDE59] border-4 border-black 
                            rounded-r-2xl shadow-[10px_20px_0px_rgba(0,0,0,0.5)] 
                            p-4 min-w-[200px]
                            transition-all duration-500 cubic-bezier(0.34, 1.56, 0.64, 1)
                            origin-left z-20
                            ${isOpen
                                ? 'scale-100 opacity-100 translate-x-0 pointer-events-auto'
                                : 'scale-75 opacity-0 -translate-x-full pointer-events-none'
                            }
                        `}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-center border-b-2 border-black pb-3 mb-1">
                            <span className="font-black text-black text-xl italic tracking-tighter uppercase flex items-center gap-2">
                                <MenuIcon size={18} /> MENU
                            </span>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="bg-black text-[#FFDE59] p-1.5 rounded-lg border-2 border-transparent hover:bg-red-500 hover:text-white hover:border-black transition-all active:scale-90"
                            >
                                <X size={18} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Links */}
                        <nav className="flex flex-col gap-2">
                            {links.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`
                                            flex items-center gap-3 p-3 rounded-xl 
                                            border-2 transition-all duration-200 active:scale-95
                                            ${isActive
                                                ? 'bg-black text-[#FFDE59] border-black shadow-[2px_2px_0px_rgba(0,0,0,0.2)]'
                                                : 'bg-white text-black border-black hover:bg-orange-100 shadow-[4px_4px_0px_black]'
                                            }
                                        `}
                                    >
                                        <div className="shrink-0">
                                            {link.icon}
                                        </div>
                                        <span className="font-bold text-sm uppercase tracking-wide">
                                            {link.label}
                                        </span>
                                    </Link>
                                );
                            })}
                        </nav>

                        {/* Footer Tick */}
                        <div className="mt-2 text-center">
                            <div className="h-1 w-10 bg-black/20 rounded-full mx-auto"></div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
