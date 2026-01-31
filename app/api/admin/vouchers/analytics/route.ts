import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

export async function GET() {
  try {
    // 1. Basic Stats
    const stats = await (prisma.order as any).aggregate({
      where: {
        NOT: { voucherId: null },
        orderSource: "CASHIER_POS"
      },
      _sum: {
        discountAmount: true,
        totalAmount: true
      },
      _count: {
        id: true
      }
    });

    const totalOrdersCount = await prisma.order.count({
      where: { orderSource: "CASHIER_POS" }
    });

    // 2. Usage per day (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailyUsage = await (prisma.order as any).groupBy({
      by: ['createdAt'],
      where: {
        NOT: { voucherId: null },
        orderSource: "CASHIER_POS",
        createdAt: { gte: sevenDaysAgo }
      },
      _count: {
        id: true
      }
    });

    // Process dailyUsage to group by date string
    const processedDailyUsage = dailyUsage.reduce((acc: any, curr: any) => {
      const date = curr.createdAt.toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + curr._count.id;
      return acc;
    }, {});

    const chartData = Object.keys(processedDailyUsage).map(date => ({
      date,
      count: processedDailyUsage[date]
    })).sort((a, b) => a.date.localeCompare(b.date));

    // 3. Most Popular Vouchers
    const popularVouchers = await (prisma.order as any).groupBy({
      by: ['voucherId'],
      where: {
        NOT: { voucherId: null },
        orderSource: "CASHIER_POS"
      },
      _count: {
        id: true
      },
      _sum: {
        discountAmount: true,
        totalAmount: true
      },
      orderBy: {
        _count: {
          id: 'desc'
        }
      },
      take: 5
    });

    // Fetch voucher details for popular vouchers
    const popularVouchersWithDetails = await Promise.all(
      popularVouchers.map(async (v: any) => {
        const detail = await (prisma.voucher as any).findUnique({
          where: { id: v.voucherId }
        });
        return {
          ...v,
          code: detail?.code || 'Unknown',
          name: detail?.name || 'Unknown'
        };
      })
    );

    return NextResponse.json({
      summary: {
        totalDiscountAmount: stats._sum.discountAmount || 0,
        totalVoucherRevenue: stats._sum.totalAmount || 0,
        totalVoucherOrders: stats._count.id || 0,
        conversionRate: totalOrdersCount > 0 ? (stats._count.id / totalOrdersCount) * 100 : 0
      },
      chartData,
      popularVouchers: popularVouchersWithDetails
    });

  } catch (error: any) {
    console.error("Error fetching voucher analytics:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data analitik voucher", details: error.message },
      { status: 500 }
    );
  }
}
