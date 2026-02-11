import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// GET: List active branches for public selection
export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            where: {
                isActive: true
            },
            select: {
                id: true,
                code: true,
                name: true,
                address: true,
                phone: true,
                latitude: true,
                longitude: true,
                openingHours: true
            },
            orderBy: {
                name: 'asc'
            }
        });
        return NextResponse.json(branches);
    } catch (error) {
        return NextResponse.json({ error: "Gagal mengambil data cabang" }, { status: 500 });
    }
}
