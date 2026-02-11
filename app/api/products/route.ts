import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    if (!branchId) {
        return NextResponse.json({ error: "Branch ID required" }, { status: 400 });
    }

    try {
        const products = await prisma.product.findMany({
            where: {
                productBranches: {
                    some: {
                        branchId: branchId,
                        isAvailable: true
                    }
                }
            },
            include: {
                productBranches: {
                    where: { branchId: branchId },
                    select: { branchPrice: true, isAvailable: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform price if branchPrice exists
        const mappedProducts = products.map(p => {
            const pb = p.productBranches[0];
            return {
                ...p,
                price: pb?.branchPrice ?? p.price,
                isAvailable: true, // Always true because we filtered above
                productBranches: undefined // Clean up response
            };
        });

        return NextResponse.json(mappedProducts);
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json({ error: "Error fetching menu" }, { status: 500 });
    }
}
