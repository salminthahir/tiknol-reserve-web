
"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface MenuWalkthroughProps {
    setIsCartOpen: (isOpen: boolean) => void;
}

export default function MenuWalkthrough({ setIsCartOpen }: MenuWalkthroughProps) {
    useEffect(() => {
        // Check if user has already seen the walkthrough
        const hasSeen = localStorage.getItem("hasSeenMenuWalkthrough");
        if (hasSeen) return;

        const driverObj = driver({
            showProgress: true,
            animate: true,

            // Allow closing by clicking outside or pressing escape
            allowClose: true,

            // Steps configuration
            steps: [
                {
                    element: "#menu-search-bar",
                    popover: {
                        title: "Cari Makanan Favoritmu!",
                        description: "Gunakan kolom pencarian atau filter kategori untuk menemukan menu yang kamu inginkan dengan cepat.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#menu-product-card-0",
                    popover: {
                        title: "Pilih Menu",
                        description: "Klik pada kartu menu atau tombol tambah untuk memasukkan pesanan ke keranjang.",
                        side: "top",
                        align: "start",
                    },
                },
                {
                    element: "#menu-cart-btn",
                    popover: {
                        title: "Cek Keranjang",
                        description: "Lihat ringkasan pesananmu di sini sebelum melanjutkan ke pembayaran.",
                        side: "bottom",
                        align: "end",
                    },
                },
                {
                    element: "#cart-checkout-btn",
                    popover: {
                        title: "Selesaikan Pesanan",
                        description: "Klik tombol checkout untuk memproses pesanan dan menunggu makananmu datang!",
                        side: "top",
                        align: "center",
                    },
                    // Hook specific logic: Open cart before showing this step
                    onHighlightStarted: () => {
                        setIsCartOpen(true);
                    },
                    // Close cart if they move away from this step (e.g. back) - tricky but let's try
                    onDeselected: () => {
                        // Optional: Close cart if needed, but keeping it open might be better UX
                    }
                },
            ],
            // Callback when tour is finished or closed
            onDestroyStarted: () => {
                localStorage.setItem("hasSeenMenuWalkthrough", "true");
                driverObj.destroy();
            },
        });

        // Start the drive
        driverObj.drive();

        // Cleanup
        return () => {
            if (driverObj.isActive()) {
                driverObj.destroy();
            }
        };
    }, [setIsCartOpen]);

    return null; // This component doesn't render anything visible directly
}
