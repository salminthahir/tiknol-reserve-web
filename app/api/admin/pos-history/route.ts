import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export const runtime = 'nodejs';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const staffSession = cookieStore.get('staff_session');
    const superAdminSession = cookieStore.get('super_admin_session');

    const { searchParams } = new URL(request.url);
    const queryBranchId = searchParams.get('branchId');
    let branchFilter: any = {};

    // 1. Prioritize Staff Session
    if (staffSession) {
      const session = JSON.parse(staffSession.value);

      if (session.isGlobalAccess) {
        if (queryBranchId) {
          branchFilter = { branchId: queryBranchId };
        }
      } else {
        if (!session.branchId) {
          return NextResponse.json({ error: "Unauthorized: No branch context" }, { status: 403 });
        }
        branchFilter = { branchId: session.branchId };
      }
    }
    // 2. Fallback to Super Admin
    else if (superAdminSession) {
      if (queryBranchId) {
        branchFilter = { branchId: queryBranchId };
      }
    }
    // 3. Unauthorized
    else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: {
        orderSource: "CASHIER_POS",
        ...branchFilter // Staff hanya lihat branch-nya, Super Admin lihat semua
      },
      include: {
        voucher: true,
        branch: {
          select: { name: true, code: true }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal mengambil riwayat POS:", error);
    return NextResponse.json({ error: "Gagal mengambil data riwayat POS" }, { status: 500 });
  }
}
