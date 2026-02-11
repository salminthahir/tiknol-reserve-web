// app/api/vouchers/validate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const { code, cartTotal, items, branchId } = await req.json();

        if (!code || cartTotal === undefined) {
            return NextResponse.json(
                { valid: false, message: 'Kode voucher dan total belanja diperlukan' },
                { status: 400 }
            );
        }

        // Find voucher by code
        const voucher = await prisma.voucher.findUnique({
            where: { code: code.toUpperCase() }
        });

        if (!voucher) {
            return NextResponse.json({
                valid: false,
                message: 'Kode voucher tidak valid'
            });
        }

        // Check if active
        if (!voucher.active) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher tidak aktif'
            });
        }

        // Check date validity
        const now = new Date();
        const validFrom = new Date(voucher.validFrom);
        const validUntil = new Date(voucher.validUntil);

        if (now < validFrom) {
            return NextResponse.json({
                valid: false,
                message: `Voucher belum berlaku. Mulai: ${validFrom.toLocaleDateString('id-ID')}`
            });
        }

        if (now > validUntil) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher sudah kadaluarsa'
            });
        }

        // --- ADVANCED RULES (Phase 4) ---

        // 1. Happy Hour Validation
        if (voucher.happyHourStart && voucher.happyHourEnd) {
            const currentTimeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            if (currentTimeStr < voucher.happyHourStart || currentTimeStr > voucher.happyHourEnd) {
                return NextResponse.json({
                    valid: false,
                    message: `Voucher hanya berlaku pada jam happy hour: ${voucher.happyHourStart} - ${voucher.happyHourEnd}`
                });
            }
        }

        // 2. Category-specific Validation
        if (voucher.applicableCategories && Array.isArray(voucher.applicableCategories) && (voucher.applicableCategories as string[]).length > 0) {
            const allowedCategories = voucher.applicableCategories as string[];
            const hasItemsFromCategories = items?.some((item: any) =>
                allowedCategories.includes(item.category)
            );

            if (!hasItemsFromCategories) {
                return NextResponse.json({
                    valid: false,
                    message: `Voucher ini hanya berlaku untuk kategori: ${allowedCategories.join(', ')}`
                });
            }
        }

        // Check usage limit
        if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
            return NextResponse.json({
                valid: false,
                message: 'Voucher sudah habis digunakan'
            });
        }

        // Check minimum purchase
        if (cartTotal < voucher.minPurchase) {
            return NextResponse.json({
                valid: false,
                message: `Minimum pembelian Rp ${voucher.minPurchase.toLocaleString()} belum terpenuhi`
            });
        }

        // Check applicable items (if specified)
        if (voucher.applicableItems && Array.isArray(voucher.applicableItems) && (voucher.applicableItems as string[]).length > 0) {
            const applicableIds = voucher.applicableItems as string[];
            const hasApplicableItem = items?.some((item: any) =>
                applicableIds.includes(item.id)
            );

            if (!hasApplicableItem) {
                return NextResponse.json({
                    valid: false,
                    message: 'Voucher tidak berlaku untuk item yang dipilih'
                });
            }
        }

        // NEW: Check applicable Branches (if specified)
        // branchId already extracted from first req.json() call at line 7

        if (voucher.applicableBranches && Array.isArray(voucher.applicableBranches) && (voucher.applicableBranches as string[]).length > 0) {
            const allowedBranches = voucher.applicableBranches as string[];

            if (!branchId) {
                // If voucher depends on branch, but branchId not allowed/provided
                // Assuming strict mode: if branch specific, must provide branchId
                return NextResponse.json({
                    valid: false,
                    message: 'Voucher ini butuh informasi cabang'
                });
            }

            if (!allowedBranches.includes(branchId)) {
                // Fetch branch name for better error message (Optional, skip for performance)
                return NextResponse.json({
                    valid: false,
                    message: 'Voucher tidak berlaku di cabang ini'
                });
            }
        }

        // Calculate discount
        let discount = 0;

        switch (voucher.type) {
            case 'PERCENTAGE':
                discount = (cartTotal * voucher.value) / 100;
                if (voucher.maxDiscount && discount > voucher.maxDiscount) {
                    discount = voucher.maxDiscount;
                }
                break;

            case 'FIXED_AMOUNT':
                discount = voucher.value;
                if (discount > cartTotal) {
                    discount = cartTotal; // Can't discount more than total
                }
                break;

            case 'FREE_ITEM':
                // For free item, discount is the price of the free item
                // This would need item price lookup
                discount = voucher.value;
                break;

            case 'BUY_X_GET_Y':
                // Complex logic - would need item analysis
                // For now, use value as discount
                discount = voucher.value;
                break;
        }

        return NextResponse.json({
            valid: true,
            message: 'Voucher berhasil divalidasi',
            discount: Math.round(discount),
            voucher: {
                id: voucher.id,
                code: voucher.code,
                name: voucher.name,
                description: voucher.description,
                type: voucher.type,
                value: voucher.value
            }
        });

    } catch (error) {
        console.error('Voucher validation error:', error);
        return NextResponse.json(
            { valid: false, message: 'Terjadi kesalahan saat validasi voucher' },
            { status: 500 }
        );
    }
}
