import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customAlphabet } from 'nanoid'; // Import customAlphabet

import { cookies } from "next/headers"; // Import cookies

// Buat generator ID dengan alphabet huruf besar (A-Z) dan angka (0-9)
const generateOrderId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 15);

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const { customerName, whatsapp, totalAmount, items, orderType, voucherId, subtotal, discountAmount } = await request.json();

    // 1. Get Branch from Session
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('staff_session');

    if (!sessionCookie) {
      return NextResponse.json({ error: "Unauthorized: No active session" }, { status: 401 });
    }

    const session = JSON.parse(sessionCookie.value);
    const branchId = session.branchId;

    if (!branchId) {
      return NextResponse.json({ error: "Unauthorized: No branch context" }, { status: 403 });
    }

    // Validation
    if (!customerName || !totalAmount || !items || items.length === 0) {
      return NextResponse.json({ error: "Data order tidak lengkap" }, { status: 400 });
    }

    // Generate custom ID for cash order
    const customOrderId = generateOrderId();

    const newOrder = await prisma.order.create({
      data: {
        id: customOrderId,
        branchId, // Enforce Branch
        customerName,
        whatsapp,
        orderType: orderType || 'DINE_IN',
        totalAmount,
        subtotal: subtotal || totalAmount,
        discountAmount: discountAmount || 0,
        items: JSON.stringify(items),
        status: "PAID",
        orderSource: "CASHIER_POS",
        paymentType: "CASH",
        voucherId: voucherId || null,
      },
    });

    // Increment voucher usage count if voucher was applied
    if (voucherId) {
      await prisma.voucher.update({
        where: { id: voucherId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });
    }

    return NextResponse.json(newOrder);
  } catch (error: any) { // Tangkap error sebagai 'any' agar bisa akses properti error
    console.error("Gagal membuat order CASH:", error);
    // Jika error adalah objek dengan properti message, gunakan itu
    const errorMessage = error instanceof Error ? error.message : "Gagal memproses order tunai";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
