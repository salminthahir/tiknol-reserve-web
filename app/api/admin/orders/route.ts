// app/api/admin/orders/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Supabase/Next.js butuh ini agar tidak men-cache data (Biar Realtime)
export const dynamic = 'force-dynamic';

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