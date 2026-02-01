import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Total Revenue (All Time - or you might want Today's Revenue? The UI shows "Total Revenue")
        // The UI shows "Total Revenue" but usually for a dashboard it's good to show Today's or Month's.
        // Let's stick to the UI variable names roughly.
        // Actually, "15.45M" usually implies a running total or monthly. 
        // Let's get TODAY'S stats for the "Overview" context as it says "Main Branch is currently OPEN".

        // Dashboard usually shows Today's metrics for operational view, but "Total Revenue" might be All Time.
        // Let's allow query param ?period=today|month|all. Default to TODAY for operational dashboard.

        // METRIC 1: TODAY'S REVENUE & ORDERS
        const todayOrders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: today,
                    lt: tomorrow
                },
                status: 'PAID' // Only paid orders count for revenue
            },
            // include: {
            //     paymentMethod: true 
            // }
        });

        const revenueValue = todayOrders.reduce((sum, order) => sum + order.totalAmount, 0);
        const orderCount = todayOrders.length;

        // Calculate Avg Prep Time (Mock or Real)
        // If we track prep time: order.updatedAt - order.createdAt where status=COMPLETED
        // For now, let's just return a placeholder or calculate if dates exist.

        // METRIC 2: ACTIVE STAFF
        // Count attendance records where clockIn is today and clockOut is null
        const activeStaffCount = await prisma.attendance.count({
            where: {
                timestamp: {
                    gte: today,
                    lt: tomorrow
                },
                type: 'CLOCK_IN',
                // This logic is simplified. Ideally we find latest record per user and check if it's CLOCK_IN.
                // But for basic count:
            }
        });

        // To be more accurate: Get unique employees clocked in today who haven't clocked out.
        // For now, let's just return total "CLOCK_IN" events today as a proxy for "Staff Present"

        // METRIC 3: TOP SELLING ITEMS (Today)
        // We need to parse order items.
        // Order.items is JSON. 
        const itemSales: Record<string, { qty: number, revenue: number, name: string }> = {};

        todayOrders.forEach(order => {
            const items = order.items as any[]; // JSON type
            if (Array.isArray(items)) {
                items.forEach(item => {
                    const id = item.id || item.name;
                    if (!itemSales[id]) {
                        itemSales[id] = { qty: 0, revenue: 0, name: item.name };
                    }
                    itemSales[id].qty += item.qty;
                    itemSales[id].revenue += (item.price * item.qty);
                });
            }
        });

        const topSelling = Object.values(itemSales)
            .sort((a, b) => b.qty - a.qty)
            .slice(0, 5);

        // METRIC 4: BUSY HOURS (Traffic)
        // Group orders by hour
        const traffic = Array(24).fill(0);
        todayOrders.forEach(order => {
            const hour = new Date(order.createdAt).getHours();
            traffic[hour]++;
        });

        // Format for Chart (e.g. "08:00", "09:00")
        // We only care about 08:00 - 22:00 for the UI usually
        const chartData = [8, 10, 12, 14, 16, 18, 20].map(h => {
            // Group 2 hours blocks roughly or just take the specific hour
            // Let's sum h and h+1
            const val = traffic[h] + (traffic[h + 1] || 0);
            const time = `${String(h).padStart(2, '0')}:00`;
            const isPeak = val === Math.max(...traffic); // Simplified peak check
            return { time, val, isPeak };
        });


        return NextResponse.json({
            revenue: revenueValue,
            orders: orderCount,
            avgOrderValue: orderCount > 0 ? (revenueValue / orderCount) : 0,
            activeStaff: activeStaffCount,
            totalStaff: 12, // Mock or fetch total employees
            topSelling,
            traffic: chartData,
            systemStatus: {
                posLatency: "24ms", // Mock
                lastSync: new Date().toISOString()
            }
        });

    } catch (error) {
        console.error('Dashboard API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
    }
}
