import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { duitku } from "@/lib/duitku";
import { customAlphabet } from 'nanoid';

// Buat generator ID dengan alphabet huruf besar (A-Z) dan angka (0-9)
const generateOrderId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 15);

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, whatsapp, items, orderType, voucherId, subtotal, discountAmount, branchId } = body;
    const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";

    // Validation
    if (!branchId) {
      return NextResponse.json({ error: "Branch ID is required" }, { status: 400 });
    }

    // Calculate totalAmount from items
    const calculatedTotal = items.reduce((acc: number, item: any) => {
      const price = item.price || 0;
      const qty = item.qty || 1;
      return acc + (price * qty);
    }, 0);

    // Use provided subtotal/discount if voucher applied, otherwise use calculated total
    const finalSubtotal = subtotal || calculatedTotal;
    const finalDiscount = discountAmount || 0;
    const finalTotal = finalSubtotal - finalDiscount;

    // Generate custom Order ID
    const customOrderId = generateOrderId();

    // Create Order in Database
    const newOrder = await prisma.order.create({
      data: {
        id: customOrderId,
        branchId, // Enforce Branch
        customerName,
        whatsapp,
        orderType: orderType || 'DINE_IN',
        totalAmount: finalTotal,
        subtotal: finalSubtotal,
        discountAmount: finalDiscount,
        items: items,
        status: "PENDING",
        paymentType: "QRIS", // Default type, can be updated by callback
        voucherId: voucherId || null,
        orderSource: "WEB_CUSTOMER",
      },
    });

    // Prepare Product Details String for Duitku
    const productDetails = items.map((item: any) =>
      `${item.name} x${item.qty}`
    ).join(', ');

    // Call Duitku API
    const paymentResponse = await duitku.requestPayment({
      merchantOrderId: newOrder.id,
      amount: finalTotal,
      paymentMethod: body.paymentMethod || '', // Use selected method from frontend
      productDetails: productDetails,
      customerVaName: customerName,
      email: 'customer@example.com', // Dummy email if not collected
      phoneNumber: whatsapp,
      callbackUrl: `${APP_BASE_URL}/api/notification`,
      returnUrl: `${APP_BASE_URL}/ticket/${newOrder.id}`,
    });

    if (!paymentResponse.paymentUrl) {
      throw new Error(paymentResponse.statusMessage || "Failed to get payment URL");
    }

    // Update Order with Payment Reference (reusing snapToken field for now or can add new field)
    // Using snapToken field temporarily to store paymentUrl or Reference
    await prisma.order.update({
      where: { id: newOrder.id },
      data: { snapToken: paymentResponse.reference || paymentResponse.paymentUrl },
    });

    // Return Payment URL
    return NextResponse.json({
      paymentUrl: paymentResponse.paymentUrl,
      orderId: newOrder.id
    });

  } catch (error: any) {
    console.error("Error creating Duitku transaction:", error);
    return NextResponse.json(
      { error: "Gagal memproses order", details: error.message },
      { status: 500 }
    );
  }
}