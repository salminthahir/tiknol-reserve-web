import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Params di Next.js 13+ diakses seperti ini
type Context = {
    params: {
        id: string
    }
}

export async function GET(request: Request, context: Context) {
  try {
    const { id } = context.params;

    const order = await prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      return NextResponse.json({ error: "Order tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Gagal ambil detail order:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}