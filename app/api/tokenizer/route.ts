// app/api/tokenizer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // <--- PERUBAHAN 1: Import dari lib/prisma
import { snap } from "@/lib/midtrans";

// HAPUS BARIS INI: const prisma = new PrismaClient(); <--- PERUBAHAN 2: Hapus ini

export async function POST(request: Request) {
  try {
    // 1. Baca Data CUMA SEKALI
    const body = await request.json();
    const { customerName, whatsapp, items, total } = body; 

    // 2. Buat Order Baru di Database
    // (Sekarang menggunakan 'prisma' yang di-import, bukan variabel lokal)
    const newOrder = await prisma.order.create({
      data: {
        customerName,
        whatsapp,
        totalAmount: total,
        items: items, 
        status: "PENDING",
      },
    });

    // 3. Siapkan Parameter Midtrans
    const parameter = {
      transaction_details: {
        order_id: newOrder.id,
        gross_amount: total,
      },
      customer_details: {
        first_name: customerName,
        phone: whatsapp,
      },
    };

    // 4. Minta Token
    const transaction = await snap.createTransaction(parameter);

    // 5. Simpan Token
    await prisma.order.update({
      where: { id: newOrder.id },
      data: { snapToken: transaction.token },
    });

    // 6. Return
    return NextResponse.json({ 
      token: transaction.token,
      orderId: newOrder.id 
    });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return NextResponse.json({ error: "Gagal memproses order" }, { status: 500 });
  }
}