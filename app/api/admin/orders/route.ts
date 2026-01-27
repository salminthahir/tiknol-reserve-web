import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // Ambil order yang BUKAN 'PENDING' (artinya sudah bayar/lunas/gagal)
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'PENDING' }
      },
      orderBy: {
        createdAt: 'desc' // Yang terbaru di atas
      }
    });
    
    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal ambil order:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}