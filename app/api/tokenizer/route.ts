import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { snap } from "@/lib/midtrans";
import { customAlphabet } from 'nanoid'; // Import customAlphabet

// Buat generator ID dengan alphabet huruf besar (A-Z) dan angka (0-9)
const generateOrderId = customAlphabet('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', 15);

export const runtime = 'nodejs';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerName, whatsapp, items, orderType, voucherId, subtotal, discountAmount } = body;

    // Calculate totalAmount from items
    const calculatedTotal = items.reduce((acc: number, item: any) => {
      return acc + (item.price * item.qty);
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
        customerName,
        whatsapp,
        orderType: orderType || 'DINE_IN',
        totalAmount: finalTotal,
        subtotal: finalSubtotal,
        discountAmount: finalDiscount,
        items: items,
        status: "PENDING",
        paymentType: "QRIS",
        voucherId: voucherId || null,
      },
    });

    // Prepare Midtrans Parameters
    const itemDetails = items.map((item: any) => ({
      id: String(item.id),
      price: item.price,
      quantity: item.qty,
      name: `${item.name}${item.custom ? ` (${item.custom.temp}/${item.custom.size})` : ''}`,
    }));

    // Add discount as negative line item if voucher applied
    if (finalDiscount > 0) {
      itemDetails.push({
        id: 'DISCOUNT',
        price: -finalDiscount,
        quantity: 1,
        name: `Voucher Discount (${voucherId})`,
      });
    }

    const parameter = {
      transaction_details: {
        order_id: String(newOrder.id),
        gross_amount: finalTotal,
      },
      item_details: itemDetails,
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