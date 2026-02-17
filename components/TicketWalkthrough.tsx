
"use client";

import { useEffect } from "react";
import { driver } from "driver.js";
import "driver.js/dist/driver.css";

export default function TicketWalkthrough() {
    useEffect(() => {
        // Check if user has already seen the walkthrough
        const hasSeen = localStorage.getItem("hasSeenTicketWalkthrough");
        if (hasSeen) return;

        const driverObj = driver({
            showProgress: true,
            animate: true,
            allowClose: true,
            steps: [
                {
                    element: "#ticket-status-tracker",
                    popover: {
                        title: "Live Order Tracker",
                        description: "Pantau status pesananmu di sini. Ada 3 tahap utama:\n\n1. **PAID**: Pembayaran berhasil diterima.\n2. **PREPARING**: Pesanan sedang disiapkan di dapur.\n3. **COMPLETED**: Pesanan selesai dan siap diambil/diantar.",
                        side: "bottom",
                        align: "start",
                    },
                },
                {
                    element: "#ticket-qr-code",
                    popover: {
                        title: "Tiket Digital & QR Code",
                        description: "Tunjukkan QR Code ini kepada staff atau kasir saat pengambilan pesanan sebagai bukti pemesanan yang valid.",
                        side: "left",
                        align: "center",
                    },
                },
                {
                    element: "#ticket-order-id",
                    popover: {
                        title: "Simpan Order ID",
                        description: "Catat Order ID ini jika kamu memerlukan bantuan terkait pesananmu.",
                        side: "top",
                        align: "start",
                    },
                },
            ],
            onDestroyStarted: () => {
                localStorage.setItem("hasSeenTicketWalkthrough", "true");
                driverObj.destroy();
            },
        });

        // Delay slightly to ensure elements are rendered
        setTimeout(() => {
            driverObj.drive();
        }, 1000);

        return () => {
            if (driverObj.isActive()) {
                driverObj.destroy();
            }
        };
    }, []);

    return null;
}
