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

    // 1. Prioritize Staff Session (for users logged in as Staff, even if they have Super Admin cookie)
    if (staffSession) {
      const session = JSON.parse(staffSession.value);

      if (session.isGlobalAccess) {
        // Global Access Staff (e.g. Head Office / Owner)
        // Can see ALL, or filter by specific branch if requested
        if (queryBranchId) {
          branchFilter = { branchId: queryBranchId };
        }
      } else {
        // Regular Staff: STRICTLY restricted to their assigned branch
        if (!session.branchId) {
          return NextResponse.json({ error: "Unauthorized: No branch context" }, { status: 403 });
        }
        branchFilter = { branchId: session.branchId };
      }
    }
    // 2. Fallback to Super Admin Session (if no Staff Session)
    else if (superAdminSession) {
      // Super Admin: Full Access
      if (queryBranchId) {
        branchFilter = { branchId: queryBranchId };
      }
    }
    // 3. No Session
    else {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Ambil order yang BUKAN 'PENDING'
    const orders = await prisma.order.findMany({
      where: {
        status: { not: 'PENDING' },
        ...branchFilter
      },
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        branch: { // Include branch info for Super Admin context
          select: { name: true, code: true }
        }
      }
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error("Gagal ambil order:", error);
    return NextResponse.json({ error: "Gagal mengambil data" }, { status: 500 });
  }
}