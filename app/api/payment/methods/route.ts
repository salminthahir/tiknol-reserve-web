import { NextResponse } from "next/server";
import { duitku } from "@/lib/duitku";

export const runtime = 'nodejs';

export async function POST(request: Request) {
    try {
        const { amount } = await request.json();

        // Default amount check
        if (!amount) {
            return NextResponse.json({ error: "Amount is required" }, { status: 400 });
        }

        const methods = await duitku.getPaymentMethods(Number(amount));

        return NextResponse.json({ methods });
    } catch (error: any) {
        console.error("Error fetching payment methods:", error);
        return NextResponse.json({ error: "Failed to fetch payment methods" }, { status: 500 });
    }
}
