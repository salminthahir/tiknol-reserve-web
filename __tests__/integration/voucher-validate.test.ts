// __tests__/integration/voucher-validate.test.ts
// Integration tests for POST /api/vouchers/validate

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
import { prisma } from '@/lib/prisma';

import { POST } from '@/app/api/vouchers/validate/route';
import { NextRequest } from 'next/server';

function makeRequest(body: any): NextRequest {
    return new NextRequest('http://localhost:3000/api/vouchers/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// Base valid voucher mock — must include ALL fields the route accesses
const baseVoucher = {
    id: 'vcr-001',
    code: 'DISCOUNT20',
    name: 'Diskon 20%',
    description: 'Diskon 20 persen',
    type: 'PERCENTAGE',
    value: 20,
    minPurchase: 0,
    maxDiscount: null,
    usageLimit: null,
    usageCount: 0,
    perUserLimit: null,
    validFrom: new Date('2025-01-01'),
    validUntil: new Date('2027-12-31'),
    active: true,
    applicableItems: null,
    applicableCategories: null,
    applicableBranches: null,
    happyHourStart: null,
    happyHourEnd: null,
};

describe('POST /api/vouchers/validate', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============= POSITIVE TESTS =============
    describe('Valid Voucher Scenarios', () => {

        it('should validate PERCENTAGE voucher and calculate discount', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({ ...baseVoucher });

            const response = await POST(makeRequest({ code: 'discount20', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(true);
            expect(data.discount).toBe(20000); // 20% of 100,000
            expect(data.voucher.code).toBe('DISCOUNT20');
        });

        it('should validate FIXED_AMOUNT voucher', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                type: 'FIXED_AMOUNT',
                value: 15000,
            });

            const response = await POST(makeRequest({ code: 'FIXED15', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(true);
            expect(data.discount).toBe(15000);
        });

        it('should cap PERCENTAGE discount at maxDiscount', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                value: 50, // 50%
                maxDiscount: 30000,
            });

            const response = await POST(makeRequest({ code: 'BIG50', cartTotal: 200000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(true);
            expect(data.discount).toBe(30000); // Capped, not 100,000
        });

        it('should cap FIXED_AMOUNT to cartTotal', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                type: 'FIXED_AMOUNT',
                value: 100000,
            });

            const response = await POST(makeRequest({ code: 'BIGFIX', cartTotal: 30000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(true);
            expect(data.discount).toBe(30000); // Capped to cart
        });
    });

    // ============= NEGATIVE TESTS =============
    describe('Invalid Voucher Scenarios', () => {

        it('should reject missing code (400)', async () => {
            const response = await POST(makeRequest({ cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.valid).toBe(false);
        });

        it('should reject missing cartTotal (400)', async () => {
            const response = await POST(makeRequest({ code: 'TEST' }));
            const data = await response.json();

            expect(response.status).toBe(400);
        });

        it('should reject non-existent voucher code', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await POST(makeRequest({ code: 'NOTEXIST', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('tidak valid');
        });

        it('should reject inactive voucher', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                active: false,
            });

            const response = await POST(makeRequest({ code: 'INACTIVE', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('tidak aktif');
        });

        it('should reject expired voucher', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                validUntil: new Date('2020-01-01'),
            });

            const response = await POST(makeRequest({ code: 'EXPIRED', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('kadaluarsa');
        });

        it('should reject voucher not yet valid', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                validFrom: new Date('2099-01-01'),
            });

            const response = await POST(makeRequest({ code: 'FUTURE', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('belum berlaku');
        });

        it('should reject voucher when usage limit reached', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                usageLimit: 10,
                usageCount: 10,
            });

            const response = await POST(makeRequest({ code: 'MAXED', cartTotal: 100000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('habis digunakan');
        });

        it('should reject when minimum purchase not met', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                minPurchase: 100000,
            });

            const response = await POST(makeRequest({ code: 'MINPUR', cartTotal: 30000, items: [] }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('Minimum pembelian');
        });
    });

    // ============= CATEGORY & ITEM VALIDATION =============
    describe('Category & Item Rules', () => {

        it('should reject when category does not match', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                applicableCategories: ['Coffee'],
            });

            const items = [{ id: 'p1', name: 'Croissant', category: 'Snack' }];
            const response = await POST(makeRequest({ code: 'CATONLY', cartTotal: 100000, items }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('kategori');
        });

        it('should accept when cart has matching category item', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                applicableCategories: ['Coffee'],
            });

            const items = [
                { id: 'p1', name: 'Americano', category: 'Coffee' },
                { id: 'p2', name: 'Croissant', category: 'Snack' },
            ];
            const response = await POST(makeRequest({ code: 'CATMATCH', cartTotal: 100000, items }));
            const data = await response.json();

            expect(data.valid).toBe(true);
        });

        it('should reject when applicable items do not match', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                applicableItems: ['product-A', 'product-B'],
            });

            const items = [{ id: 'product-C', name: 'Other Item' }];
            const response = await POST(makeRequest({ code: 'ITEMONLY', cartTotal: 100000, items }));
            const data = await response.json();

            expect(data.valid).toBe(false);
            expect(data.message).toContain('item yang dipilih');
        });

        it('should accept when cart has matching applicable item', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({
                ...baseVoucher,
                applicableItems: ['product-A', 'product-B'],
            });

            const items = [{ id: 'product-A', name: 'Item A' }];
            const response = await POST(makeRequest({ code: 'ITEMMATCH', cartTotal: 100000, items }));
            const data = await response.json();

            expect(data.valid).toBe(true);
        });
    });

    // ============= CASE SENSITIVITY =============
    describe('Code Case Sensitivity', () => {
        it('should match voucher regardless of input case (uppercase conversion)', async () => {
            (prisma.voucher.findUnique as jest.Mock).mockResolvedValue({ ...baseVoucher });

            await POST(makeRequest({ code: 'discount20', cartTotal: 100000, items: [] }));

            expect(prisma.voucher.findUnique).toHaveBeenCalledWith({
                where: { code: 'DISCOUNT20' },
            });
        });
    });
});
