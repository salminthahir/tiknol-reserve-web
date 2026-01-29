
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDateParam = searchParams.get('startDate');
        const endDateParam = searchParams.get('endDate');

        // Default: Hari ini
        let startDate = startDateParam ? new Date(startDateParam) : new Date();
        startDate.setHours(0, 0, 0, 0);

        let endDate = endDateParam ? new Date(endDateParam) : new Date();
        endDate.setHours(23, 59, 59, 999);

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
        // Utk simpel, kita group by Date dulu. Kalau rentang cuma 1 hari, group by Hour.
        const isSingleDay = startDate.toDateString() === endDate.toDateString();

        // Gunakan Map untuk grouping
        const salesMap = new Map<string, { value: number, dateStr: string }>();

        orders.forEach(order => {
            let key = '';
            let dateStr = ''; // ISO Date string (YYYY-MM-DD) or similar for querying later

            const orderDate = new Date(order.createdAt);

            if (isSingleDay) {
                // Format Jam: "14:00"
                key = `${orderDate.getHours().toString().padStart(2, '0')}:00`;
                dateStr = orderDate.toISOString();
            } else {
                // Format Tanggal: "28 Jan"
                key = orderDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                // FIX: Ensure dateStr matches the Key's day (Local Time)
                // toLocaleDateString returning "YYYY-MM-DD" format for uniformity
                // Hack: We want YYYY-MM-DD that represents the Local ID Date.
                // Since we don't know server TZ for sure, best effort: match parts.
                const year = orderDate.getFullYear();
                const month = String(orderDate.getMonth() + 1).padStart(2, '0');
                const day = String(orderDate.getDate()).padStart(2, '0');
                dateStr = `${year}-${month}-${day}`;
                // NOTE: calculate this based on local parts derived from orderDate (which follows local TZ of server)
            }

            const current = salesMap.get(key) || { value: 0, dateStr };
            salesMap.set(key, { value: current.value + order.totalAmount, dateStr });
        });

        // Konversi Map ke Array, sort by key (secara kasar)
        const chartData = Array.from(salesMap.entries())
            .map(([name, data]) => ({ name, value: data.value, date: data.dateStr }))
            .reverse(); // Krn order desc, kita reverse biar dari pagi -> malam

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
