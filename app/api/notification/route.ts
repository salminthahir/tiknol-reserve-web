// app/api/notification/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, transaction_status, fraud_status } = body;

    console.log(`🔔 NOTIFIKASI MASUK untuk Order ID: ${order_id}`);
    console.log(`📊 Status Midtrans: ${transaction_status}`);

    // 1. CEK DULU: APAKAH ORDER INI ADA DI DATABASE KITA?
    const existingOrder = await prisma.order.findUnique({
      where: { id: order_id },
    });

    if (!existingOrder) {
      console.warn(`⚠️ ORDER TIDAK DITEMUKAN: ${order_id}. Mungkin data lama yang sudah dihapus.`);
      
      // PENTING: Tetap return 200 OK agar Midtrans berhenti mengirim notifikasi hantu ini.
      return NextResponse.json({ message: "Order not found, but acknowledged to stop retry" });
    }

    // 2. TENTUKAN STATUS BARU
    let newStatus = '';
    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'PENDING';
      } else if (fraud_status === 'accept') {
        newStatus = 'PAID';
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'PAID';
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newStatus = 'FAILED';
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING';
    }

    // 3. UPDATE JIKA STATUS VALID
    if (newStatus) {
      await prisma.order.update({
        where: { id: order_id },
        data: { status: newStatus }
      });
      console.log(`✅ SUKSES UPDATE: Order ${order_id} jadi ${newStatus}`);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ ERROR WEBHOOK:", error);
    // Return 500 hanya jika error coding, agar kita tau di log Vercel
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
