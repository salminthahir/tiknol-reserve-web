
"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

interface MenuWalkthroughProps {
    setIsCartOpen: (isOpen: boolean) => void;
    branchSelected: boolean; // Walkthrough hanya muncul jika branch sudah dipilih
}

export default function MenuWalkthrough({ setIsCartOpen, branchSelected }: MenuWalkthroughProps) {
    useEffect(() => {
        // GUARD: Jangan mulai walkthrough jika branch belum dipilih (consent popup masih tampil)
        if (!branchSelected) return;

        // Check if user has already seen the walkthrough
        const hasSeen = localStorage.getItem("hasSeenMenuWalkthrough");
        if (hasSeen) return;

        // Delay sedikit agar UI menu selesai render setelah branch dipilih
        const timeout = setTimeout(() => {
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
                        onDeselected: () => {
                            // Optional: Close cart if needed
                        }
                    },
                ],
                // Callback when tour is finished or closed
                onDestroyStarted: () => {
                    localStorage.setItem("hasSeenMenuWalkthrough", "true");
                    setIsCartOpen(false); // Tutup keranjang saat walkthrough selesai
                    driverObj.destroy();
                },
            });

            // Start the drive
            driverObj.drive();
        }, 800); // Delay 800ms agar produk sempat di-render

        // Cleanup
        return () => {
            clearTimeout(timeout);
        };
    }, [setIsCartOpen, branchSelected]);

    return null; // This component doesn't render anything visible directly
}
