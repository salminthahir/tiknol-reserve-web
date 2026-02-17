import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { duitku } from "@/lib/duitku";
import { sendWhatsAppNotification } from "@/lib/whatsapp";

// Base URL aplikasi untuk URL tiket
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    // Duitku sends data as x-www-form-urlencoded usually, but let's handle JSON too if configured
    const contentType = request.headers.get("content-type") || "";
    let body: any;

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const formData = await request.formData();
      body = Object.fromEntries(formData);
    } else {
      body = await request.json();
    }

    const {
      merchantCode,
      amount,
      merchantOrderId,
      signature,
      resultCode,
      reference
    } = body;

    // 1. VERIFIKASI SIGNATURE
    if (!duitku.validateCallbackSignature(merchantOrderId, String(amount || 0) as any, signature)) {
      console.error(`⛔ SIGNATURE INVALID! Request from: ${request.headers.get('x-forwarded-for')}`);
      return NextResponse.json({ message: "Invalid Signature" }, { status: 400 });
    }

    console.log(`🔔 DUITKU CALLBACK for Order ID: ${merchantOrderId}, Code: ${resultCode}`);

    // 2. CEK ORDER DI DB
    const existingOrder = await prisma.order.findUnique({
      where: { id: merchantOrderId },
    });

    if (!existingOrder) {
      console.warn(`⚠️ ORDER TIDAK DITEMUKAN: ${merchantOrderId}`);
      // Return 200 to satisfy Duitku retry mechanism if order is truly gone
      return NextResponse.json({ message: "Order not found" });
    }

    // 3. TENTUKAN STATUS BARU
    let newStatus = '';
    let notificationMessage = '';
    const ticketUrl = `${APP_BASE_URL}/ticket/${existingOrder.id}`;

    // Duitku Result Codes:
    // 00 = Success
    // 01 = Pending
    // 02 = Failed
    if (resultCode === '00') {
      newStatus = 'PAID';
      notificationMessage = `🎉 Halo ${existingOrder.customerName}! Pesanan *Titiknol Reserve* Anda (${existingOrder.id}) telah berhasil dibayar via Duitku. Pantau statusnya di sini: ${ticketUrl} ✨ Terima kasih!`;
    } else if (resultCode === '01') {
      newStatus = 'PENDING';
    } else {
      newStatus = 'FAILED';
    }

    // 4. UPDATE JIKA STATUS VALID & BERUBAH
    // Don't revert PAID status to PENDING/FAILED easily without manual check in real usage, 
    // but for now strict mapping is safer.
    if (newStatus && newStatus !== existingOrder.status) {
      // If it wants to change FROM PAID to something else, be careful. 
      // Usually typically only update if current is PENDING or FAILED.
      if (existingOrder.status === 'PAID' && newStatus !== 'PAID') {
        console.warn(`⚠️ IGNORED UPDATE: Order ${merchantOrderId} is already PAID. Incoming status: ${newStatus}`);
      } else {
        await prisma.order.update({
          where: { id: merchantOrderId },
          data: { status: newStatus as any } // Cast to enum
        });
        console.log(`✅ SUKSES UPDATE: Order ${merchantOrderId} jadi ${newStatus}`);

        // KIRIM NOTIFIKASI WHATSAPP
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
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("❌ ERROR WEBHOOK:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
