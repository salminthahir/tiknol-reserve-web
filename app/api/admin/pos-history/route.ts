import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
      where: {
        orderSource: "CASHIER_POS" // Filter hanya order dari POS
      },
      orderBy: {
        createdAt: 'desc' // Yang terbaru di atas
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal mengambil riwayat POS:", error);
    return NextResponse.json({ error: "Gagal mengambil data riwayat POS" }, { status: 500 });
  }
}
