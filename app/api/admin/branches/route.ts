import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = 'nodejs';

// GET: List all branches
export async function GET() {
    try {
        const branches = await prisma.branch.findMany({
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(branches);
    } catch (error) {
        return NextResponse.json({ error: "Gagal mengambil data branch" }, { status: 500 });
    }
}

// POST: Create new branch (Super Admin only - check middleware or here)
export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const superAdminSession = cookieStore.get('super_admin_session');

        // Optional: Strict check for super admin
        if (!superAdminSession) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Basic validation
        if (!body.code || !body.name) {
            return NextResponse.json({ error: "Code and Name are required" }, { status: 400 });
        }

        const newBranch = await prisma.branch.create({
            data: {
                code: body.code,
                name: body.name,
                address: body.address,
                phone: body.phone,
                latitude: body.latitude || 0,
                longitude: body.longitude || 0,
                maxRadius: body.maxRadius || 100,
                isActive: body.isActive ?? true,
                openingHours: body.openingHours || null
            }
        });

        return NextResponse.json(newBranch);
    } catch (error: any) {
        console.error("Error creating branch:", error);
        if (error.code === 'P2002') {
            return NextResponse.json({ error: "Branch code already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Gagal membuat branch" }, { status: 500 });
    }
}
