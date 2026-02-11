import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = 'nodejs';

// PUT: Update branch
export async function PUT(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies();
        const superAdminSession = cookieStore.get('super_admin_session');
        if (!superAdminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = params;
        const body = await request.json();

        const updatedBranch = await prisma.branch.update({
            where: { id },
            data: {
                code: body.code,
                name: body.name,
                address: body.address,
                phone: body.phone,
                latitude: body.latitude,
                longitude: body.longitude,
                maxRadius: body.maxRadius,
                isActive: body.isActive,
                openingHours: body.openingHours
            }
        });

        return NextResponse.json(updatedBranch);
    } catch (error: any) {
        console.error("Error updating branch:", error);
        return NextResponse.json({ error: "Gagal update branch" }, { status: 500 });
    }
}

// DELETE: Delete branch (Soft delete / Hard delete check constraints)
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
    try {
        const cookieStore = await cookies();
        const superAdminSession = cookieStore.get('super_admin_session');
        if (!superAdminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = params;

        // Check orders constraint?
        // Prisma will throw error if foreign keys exist and on delete RESTRICT.
        // Better handle it gracefully.

        await prisma.branch.delete({ where: { id } });
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting branch:", error);
        if (error.code === 'P2003') {
            return NextResponse.json({ error: "Cannot delete branch with existing orders/employees" }, { status: 400 });
        }
        return NextResponse.json({ error: "Gagal hapus branch" }, { status: 500 });
    }
}
