
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Default: Hari ini (Logic: Use param if exists, else Default Today 00:00 - 23:59)
        let startDate = startDateParam ? new Date(startDateParam) : new Date();
        if (!startDateParam) startDate.setHours(0, 0, 0, 0);

        let endDate = endDateParam ? new Date(endDateParam) : new Date();
        if (!endDateParam) endDate.setHours(23, 59, 59, 999);

        console.log(`📊 Generating Revenue Data: ${startDate.toISOString()} - ${endDate.toISOString()}`);

        // Fetch Completed Orders
        const orders = await prisma.order.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                },
                status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] }
            },
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                totalAmount: true,
                createdAt: true,
                paymentType: true,
                items: true // Needed for product analysis
            }
        });

        // 1. Summary Metrics
        const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
        const totalOrders = orders.length;
        const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

        // 2. Chart Data (GroupBy Date/Hour)
        const isSingleDay = startDate.toDateString() === endDate.toDateString();
        const salesMap = new Map<string, { value: number, dateStr: string }>();

        // PRE-FILL BUCKETS (Agar graph tidak bolong/kosong)
        if (isSingleDay) {
            // Fill 00:00 - 23:00
            for (let i = 0; i < 24; i++) {
                const hourKey = `${i.toString().padStart(2, '0')}:00`;
                const d = new Date(startDate);
                d.setHours(i, 0, 0, 0);
                salesMap.set(hourKey, { value: 0, dateStr: d.toISOString() });
            }
        } else {
            // Fill Each Date in Range
            let curr = new Date(startDate);
            // Safety limit to avoid infinite loop if dates wrong
            const limit = new Date(endDate);
            limit.setDate(limit.getDate() + 1); // include end date safety

            while (curr <= endDate) {
                const dayKey = curr.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                // Use ISO String YYYY-MM-DD for consistency
                salesMap.set(dayKey, { value: 0, dateStr: curr.toISOString().split('T')[0] });

                // Next day
                curr.setDate(curr.getDate() + 1);
            }
        }

        // MERGE DATA
        orders.forEach(order => {
            let key = '';
            let dateStr = '';

            const orderDate = new Date(order.createdAt);

            if (isSingleDay) {
                key = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
                dateStr = orderDate.toISOString();
            } else {
                key = orderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                dateStr = orderDate.toISOString().split('T')[0];
            }

            const current = salesMap.get(key);
            if (current) {
                salesMap.set(key, { value: current.value + order.totalAmount, dateStr: current.dateStr });
            } else {
                salesMap.set(key, { value: order.totalAmount, dateStr });
            }
        });

        // Konversi Map ke Array
        const chartData = Array.from(salesMap.entries())
            .map(([name, data]) => ({ name, value: data.value, date: data.dateStr }));
        // Removed reverse() because pre-fill ensures chronological order



        // 3. Payment Method Split
        // Hitung frekuensi payment type
        const paymentMap = new Map<string, number>();
        orders.forEach(order => {
            // Normalisasi payment type (karena ada midtrans type)
            let type = order.paymentType || 'QRIS';
            if (type === 'gopay' || type === 'qris') type = 'QRIS';
            type = type.toUpperCase();

            const current = paymentMap.get(type) || 0;
            paymentMap.set(type, current + 1); // Hitung jumlah transaksi, bukan value
        });

        const paymentMethods = Array.from(paymentMap.entries()).map(([name, value]) => ({ name, value }));

        // 4. Top Products Analysis (Target Penjualan)
        // Parse JSON items dan hitung
        const productMap = new Map<string, { qty: number, revenue: number }>();

        orders.forEach(order => {
            let items: any[] = [];
            if (typeof order.items === 'string') {
                try { items = JSON.parse(order.items); } catch (e) { }
            } else if (Array.isArray(order.items)) {
                items = order.items;
            }

            items.forEach(item => {
                const name = item.name || 'Unknown';
                const qty = item.qty || 0;
                const price = item.price || 0;

                const current = productMap.get(name) || { qty: 0, revenue: 0 };
                productMap.set(name, {
                    qty: current.qty + qty,
                    revenue: current.revenue + (price * qty)
                });
            });
        });

        const topProducts = Array.from(productMap.entries())
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.qty - a.qty) // Sort by Quantity terjual
            .slice(0, 5); // Ambil Top 5

        // 5. Transaction List Logic
        // If Single Day (Drill-down), return ALL transactions for that day.
        // If Overview (Range), return only top 10 recent.
        const recentOrders = isSingleDay ? orders : orders.slice(0, 10);

        const recentTransactions = recentOrders.map(o => {
            // Parse items safely for receipt viewer
            let parsedItems = [];
            if (typeof o.items === 'string') {
                try { parsedItems = JSON.parse(o.items); } catch (e) { }
            } else if (Array.isArray(o.items)) {
                parsedItems = o.items;
            }

            return {
                ...o,
                items: parsedItems
            };
        });

        return NextResponse.json({
            summary: {
                totalRevenue,
                totalOrders,
                avgOrderValue
            },
            chartData,
            paymentMethods,
            topProducts,
            recentTransactions
        });

    } catch (error) {
        console.error("Revenue API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
