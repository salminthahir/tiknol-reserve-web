import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendWhatsAppNotification } from "@/lib/whatsapp"; // Import fungsi notifikasi

// Base URL aplikasi untuk URL tiket
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";

// Pastikan hanya ada satu deklarasi runtime dan dengan kutip
export const runtime = 'nodejs'; 

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
      return NextResponse.json({ message: "Order not found, but acknowledged to stop retry" });
    }

    // 2. TENTUKAN STATUS BARU
    let newStatus = '';
    let notificationMessage = '';
    const ticketUrl = `${APP_BASE_URL}/ticket/${existingOrder.id}`;

    if (transaction_status === 'capture') {
      if (fraud_status === 'challenge') {
        newStatus = 'PENDING';
      } else if (fraud_status === 'accept') {
        newStatus = 'PAID';
        notificationMessage = `🎉 Halo ${existingOrder.customerName}! Pesanan *Titiknol Reserve* Anda (${existingOrder.id}) telah berhasil dibayar dan sedang menunggu konfirmasi dapur kami. Pantau statusnya di sini: ${ticketUrl} ✨ Terima kasih telah memilih kami!`;
      }
    } else if (transaction_status === 'settlement') {
      newStatus = 'PAID';
      notificationMessage = `🎉 Halo ${existingOrder.customerName}! Pesanan *Titiknol Reserve* Anda (${existingOrder.id}) telah berhasil dibayar dan sedang menunggu konfirmasi dapur kami. Pantau statusnya di sini: ${ticketUrl} ✨ Terima kasih telah memilih kami!`;
    } else if (['cancel', 'deny', 'expire'].includes(transaction_status)) {
      newStatus = 'FAILED';
    } else if (transaction_status === 'pending') {
      newStatus = 'PENDING';
    }

    // 3. UPDATE JIKA STATUS VALID
    if (newStatus && newStatus !== existingOrder.status) { // Hanya update jika status berubah
      await prisma.order.update({
        where: { id: order_id },
        data: { status: newStatus }
      });
      console.log(`✅ SUKSES UPDATE: Order ${order_id} jadi ${newStatus}`);

      // KIRIM NOTIFIKASI WHATSAPP jika status PAID dan ada pesan
      if (newStatus === 'PAID' && notificationMessage) {
        await sendWhatsAppNotification({
          customerName: existingOrder.customerName,
          whatsapp: existingOrder.whatsapp,
          orderId: existingOrder.id,
          status: newStatus,
          message: notificationMessage
        });
      }
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ ERROR WEBHOOK:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}