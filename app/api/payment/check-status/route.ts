import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { duitku } from "@/lib/duitku";

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
        }

        // 1. Check current status in DB
        const order = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!order) {
            return NextResponse.json({ error: "Order not found" }, { status: 404 });
        }

        // 2. Check status from Duitku
        const duitkuStatus = await duitku.checkTransaction(orderId);

        if (!duitkuStatus || !duitkuStatus.statusCode) {
            return NextResponse.json({ status: order.status, message: "Transaction not found Duitku" });
        }

        const { statusCode } = duitkuStatus;
        let newStatus = order.status;

        // Duitku Status Codes: 00=Success, 01=Pending, 02=Failed
        if (statusCode === "00") {
            newStatus = 'PAID';
        } else if (statusCode === "01") {
            newStatus = 'PENDING';
        } else if (statusCode === "02") {
            newStatus = 'FAILED';
        }

        // 3. Update DB if changed
        if (newStatus !== order.status) {
            await prisma.order.update({
                where: { id: orderId },
                data: { status: newStatus as any }
            });
            return NextResponse.json({ status: newStatus, updated: true });
        }

        return NextResponse.json({ status: order.status, updated: false });

    } catch (error: any) {
        console.error("Check Status Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
