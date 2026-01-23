// app/api/tokenizer/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { snap } from "@/lib/midtrans";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, whatsapp, items } = body; 

    // --- PERBAIKAN: Hitung totalAmount di backend agar lebih aman ---
    const calculatedTotal = items.reduce((acc: number, item: any) => {
      return acc + (item.price * item.qty);
    }, 0);

    // 2. Buat Order Baru di Database
    const newOrder = await prisma.order.create({
      data: {
        customerName,
        whatsapp,
        totalAmount: calculatedTotal, // Gunakan hasil hitungan backend
        items: items, 
        status: "PENDING",
        paymentType: "QRIS", // Tambahkan paymentType untuk Midtrans
      },
    });

    // 3. Siapkan Parameter Midtrans
    const parameter = {
      transaction_details: {
        // Gunakan ID dari database dan total yang sudah dihitung
        order_id: String(newOrder.id), 
        gross_amount: calculatedTotal,
      },
      item_details: items.map((item: any) => ({
        id: String(item.id),
        price: item.price,
        quantity: item.qty,
        name: item.name,
      })),
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

  } catch (error: any) {
    console.error("Error creating transaction:", error);
    return NextResponse.json(
      { error: "Gagal memproses order", details: error.message }, 
      { status: 500 }
    );
  }
}
