// app/api/notification/route.ts
import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { snap } from "@/lib/midtrans"; // Pastikan import ini ada

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const notificationJson = await request.json();
    
    // 1. VERIFIKASI KEAMANAN (Wajib ada!)
    // Ini memastikan data benar-benar dari Midtrans, bukan hacker.
    const statusResponse = await snap.transaction.notification(notificationJson);

    const orderId = statusResponse.order_id;
    const transactionStatus = statusResponse.transaction_status;
    const fraudStatus = statusResponse.fraud_status;

    console.log(`🔒 SECURE WEBHOOK: ${orderId} | ${transactionStatus}`);

    // 2. Logic Mapping Status
    let newStatus = ""; // Kosongkan dulu

    if (transactionStatus == "capture") {
      if (fraudStatus == "challenge") {
        newStatus = "CHALLENGE";
      } else if (fraudStatus == "accept") {
        newStatus = "PAID";
      }
    } else if (transactionStatus == "settlement") {
      newStatus = "PAID";
    } else if (
      transactionStatus == "cancel" ||
      transactionStatus == "deny" ||
      transactionStatus == "expire"
    ) {
      newStatus = "FAILED"; // Atau 'CANCELLED' sesuai selera
    } else if (transactionStatus == "pending") {
      newStatus = "PENDING";
    }

    // 3. Update Database (Hanya jika status berubah)
    if (newStatus && newStatus !== "") {
        await prisma.order.update({
            where: { id: orderId },
            data: { status: newStatus }
        });
        console.log(`✅ DB UPDATED: ${newStatus}`);
    }

    return NextResponse.json({ status: "OK" });

  } catch (error) {
    console.error("❌ Webhook Error:", error);
    // Tetap return 200 agar Midtrans tidak spam error, tapi catat di log
    return NextResponse.json({ status: "Error" }, { status: 200 });
  }
}