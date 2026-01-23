// app/api/tokenizer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // <--- PERUBAHAN 1: Import dari lib/prisma
import { snap } from "@/lib/midtrans";

// HAPUS BARIS INI: const prisma = new PrismaClient(); <--- PERUBAHAN 2: Hapus ini

// Di dalam file api/tokenizer/route.js

export async function POST(request) {
  try {
    const body = await request.json();
    const { customerName, whatsapp, items } = body;

    // 1. Hitung totalAmount dari array items
    const calculatedTotalAmount = items.reduce((total, item) => {
      return total + (item.price * item.qty);
    }, 0);

    // 2. Masukkan totalAmount ke dalam perintah Prisma create
    const order = await prisma.order.create({
      data: {
        customerName: customerName,
        whatsapp: whatsapp,
        items: items, // Asumsi ini disimpan sebagai tipe data JSON di Prisma
        status: "PENDING",
        totalAmount: calculatedTotalAmount, // <-- TAMBAHKAN BARIS INI
      },
    });

    return Response.json({ success: true, order });

  } catch (error) {
    console.error("Error creating transaction:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

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
