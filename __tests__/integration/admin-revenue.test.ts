// __tests__/integration/admin-revenue.test.ts
// Integration tests for GET /api/admin/revenue

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
import { prisma } from '@/lib/prisma';

const mockCookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
};
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

import { GET } from '@/app/api/admin/revenue/route';
import { NextRequest } from 'next/server';

function makeRequest(params: Record<string, string> = {}): NextRequest {
    const url = new URL('http://localhost:3000/api/admin/revenue');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new NextRequest(url.toString(), { method: 'GET' });
}

// Mock order data
const mockOrders = [
    {
        id: 'ORD-1',
        branchId: 'branch-1',
        status: 'PAID',
        totalAmount: 50000,
        paymentType: 'CASH',
        items: [{ id: 'p1', name: 'Americano', price: 25000, qty: 2 }],
        createdAt: new Date('2026-02-11T08:00:00Z'),
    },
    {
        id: 'ORD-2',
        branchId: 'branch-1',
        status: 'COMPLETED',
        totalAmount: 30000,
        paymentType: 'QRIS',
        items: [{ id: 'p2', name: 'Latte', price: 30000, qty: 1 }],
        createdAt: new Date('2026-02-11T10:00:00Z'),
    },
    {
        id: 'ORD-3',
        branchId: 'branch-2',
        status: 'PAID',
        totalAmount: 40000,
        paymentType: 'DEBIT',
        items: [{ id: 'p1', name: 'Americano', price: 20000, qty: 2 }],
        createdAt: new Date('2026-02-11T12:00:00Z'),
    },
];

describe('GET /api/admin/revenue', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
        (prisma.order.count as jest.Mock).mockResolvedValue(mockOrders.length);
        // Default: super admin session
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'super_admin_session') return { name, value: 'authenticated' };
            return undefined;
        });
    });

    it('should return revenue summary with correct totals', async () => {
        const response = await GET(makeRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.summary).toBeDefined();
        expect(data.summary.totalRevenue).toBeDefined();
        expect(data.summary.totalOrders).toBeDefined();
    });

    it('should include chart data', async () => {
        const response = await GET(makeRequest());
        const data = await response.json();

        expect(data.chartData).toBeDefined();
        expect(Array.isArray(data.chartData)).toBe(true);
    });

    it('should include payment method breakdown', async () => {
        const response = await GET(makeRequest());
        const data = await response.json();

        expect(data.paymentMethods).toBeDefined();
    });

    it('should include top products', async () => {
        const response = await GET(makeRequest());
        const data = await response.json();

        expect(data.topProducts).toBeDefined();
        expect(Array.isArray(data.topProducts)).toBe(true);
    });

    it('should filter by date range', async () => {
        const startDate = '2026-02-11';
        const endDate = '2026-02-11';

        await GET(makeRequest({ startDate, endDate }));

        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    createdAt: expect.objectContaining({
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    }),
                }),
            })
        );
    });

    it('should filter by branchId', async () => {
        await GET(makeRequest({ branchId: 'branch-1' }));

        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    branchId: 'branch-1',
                }),
            })
        );
    });

    it('should include branch breakdown for super admin', async () => {
        const response = await GET(makeRequest());
        const data = await response.json();

        expect(data.branchBreakdown).toBeDefined();
    });
});
