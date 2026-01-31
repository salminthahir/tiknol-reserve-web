import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: "Order ID required" }, { status: 400 });
        }

        // 1. Cancel transaction di Midtrans (jika ada)
        try {
            await snap.transaction.cancel(orderId);
        } catch (midtransError: any) {
            // Abaikan error 404/412 jika transaksi memang belum ada/sudah cancel
            console.warn("Midtrans cancel warning:", midtransError?.message);
        }

        // 2. Clear Snap Token di Database
        await prisma.order.update({
            where: { id: orderId },
            data: { snapToken: null }
        });

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error("Reset Payment Error:", error);
        return NextResponse.json(
            { error: "Gagal reset pembayaran", details: error.message },
            { status: 500 }
        );
    }
}
