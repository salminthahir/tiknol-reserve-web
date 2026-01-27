import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { customerName, whatsapp, totalAmount, items } = await request.json();

    // Validasi sederhana
    if (!customerName || !totalAmount || !items || items.length === 0) {
      return NextResponse.json({ error: "Data order tidak lengkap" }, { status: 400 });
    }

    const newOrder = await prisma.order.create({
      data: {
        customerName,
        whatsapp,
        totalAmount,
        items: JSON.stringify(items), // Konversi array JavaScript ke string JSON
        status: "PAID", // Pembayaran CASH langsung dianggap LUNAS
        orderSource: "CASHIER_POS",
        paymentType: "CASH",
        // snapToken tidak diperlukan untuk pembayaran tunai
      },
    });

    return NextResponse.json(newOrder);
  } catch (error) {
    console.error("Gagal membuat order CASH:", error);
    return NextResponse.json({ error: "Gagal memproses order tunai" }, { status: 500 });
  }
}