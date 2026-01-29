// app/api/admin/vouchers/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - Get single voucher
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const voucher = await prisma.voucher.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        if (!voucher) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        return NextResponse.json(voucher);
    } catch (error) {
        console.error('Error fetching voucher:', error);
        return NextResponse.json(
            { error: 'Failed to fetch voucher' },
            { status: 500 }
        );
    }
}

// PUT - Update voucher
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const data = await req.json();

        const voucher = await prisma.voucher.update({
            where: { id: params.id },
            data: {
                code: data.code ? data.code.toUpperCase() : undefined,
                name: data.name,
                description: data.description,
                type: data.type,
                value: data.value !== undefined ? parseFloat(data.value) : undefined,
                minPurchase: data.minPurchase !== undefined ? parseFloat(data.minPurchase) : undefined,
                maxDiscount: data.maxDiscount !== undefined ? parseFloat(data.maxDiscount) : undefined,
                usageLimit: data.usageLimit !== undefined ? parseInt(data.usageLimit) : undefined,
                perUserLimit: data.perUserLimit !== undefined ? parseInt(data.perUserLimit) : undefined,
                validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
                validUntil: data.validUntil ? new Date(data.validUntil) : undefined,
                active: data.active,
                applicableItems: data.applicableItems
            }
        });

        return NextResponse.json(voucher);
    } catch (error) {
        console.error('Error updating voucher:', error);
        return NextResponse.json(
            { error: 'Failed to update voucher' },
            { status: 500 }
        );
    }
}

// DELETE - Delete voucher
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Check if voucher has been used
        const voucher = await prisma.voucher.findUnique({
            where: { id: params.id },
            include: {
                _count: {
                    select: { orders: true }
                }
            }
        });

        if (!voucher) {
            return NextResponse.json(
                { error: 'Voucher not found' },
                { status: 404 }
            );
        }

        // If voucher has been used, deactivate instead of delete
        if (voucher._count.orders > 0) {
            const updated = await prisma.voucher.update({
                where: { id: params.id },
                data: { active: false }
            });

            return NextResponse.json({
                message: 'Voucher deactivated (has been used)',
                voucher: updated
            });
        }

        // If never used, safe to delete
        await prisma.voucher.delete({
            where: { id: params.id }
        });

        return NextResponse.json({
            message: 'Voucher deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting voucher:', error);
        return NextResponse.json(
            { error: 'Failed to delete voucher' },
            { status: 500 }
        );
    }
}
