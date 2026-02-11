// app/api/admin/vouchers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - List all vouchers with optional filters
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const active = searchParams.get('active');
        const type = searchParams.get('type');

        const where: any = {};

        if (active !== null) {
            where.active = active === 'true';
        }

        if (type) {
            where.type = type;
        }

        const vouchers = await prisma.voucher.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(vouchers);
    } catch (error: any) {
        console.error('Error fetching vouchers:', error);
        return NextResponse.json(
            { error: 'Failed to fetch vouchers', details: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new voucher
export async function POST(req: NextRequest) {
    try {
        const data = await req.json();

        // Validate required fields
        if (!data.code || !data.name || !data.type || data.value === undefined) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existing = await prisma.voucher.findUnique({
            where: { code: data.code.toUpperCase() }
        });

        if (existing) {
            return NextResponse.json(
                { error: 'Kode voucher sudah digunakan' },
                { status: 400 }
            );
        }

        const voucher = await prisma.voucher.create({
            data: {
                code: data.code.toUpperCase(),
                name: data.name,
                description: data.description || null,
                type: data.type,
                value: parseFloat(data.value),
                minPurchase: data.minPurchase ? parseFloat(data.minPurchase) : 0,
                maxDiscount: data.maxDiscount ? parseFloat(data.maxDiscount) : null,
                usageLimit: data.usageLimit ? parseInt(data.usageLimit) : null,
                perUserLimit: data.perUserLimit ? parseInt(data.perUserLimit) : null,
                validFrom: new Date(data.validFrom),
                validUntil: new Date(data.validUntil),
                active: data.active !== undefined ? data.active : true,
                applicableItems: data.applicableItems || null,
                applicableBranches: data.applicableBranches || null // NEW: Multi-branch
            }
        });

        return NextResponse.json(voucher, { status: 201 });
    } catch (error) {
        console.error('Error creating voucher:', error);
        return NextResponse.json(
            { error: 'Failed to create voucher' },
            { status: 500 }
        );
    }
}
