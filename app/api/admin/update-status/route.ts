import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();
    
    // Update status di database (misal: dari PAID ke PREPARING)
    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status }
    });
    
    return NextResponse.json({ success: true, data: updatedOrder });
  } catch (error) {
    console.error("Gagal update status:", error);
    return NextResponse.json({ error: "Gagal update status" }, { status: 500 });
  }
}