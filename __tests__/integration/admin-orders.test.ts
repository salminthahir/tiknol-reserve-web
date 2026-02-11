// __tests__/integration/admin-orders.test.ts
// Integration tests for GET /api/admin/orders

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

import { GET } from '@/app/api/admin/orders/route';

function makeRequest(params: Record<string, string> = {}): Request {
    const url = new URL('http://localhost:3000/api/admin/orders');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new Request(url.toString(), { method: 'GET' });
}

const mockOrders = [
    { id: 'ORD-1', branchId: 'branch-1', status: 'PAID', totalAmount: 50000, branch: { name: 'Jakarta', code: 'JKT' } },
    { id: 'ORD-2', branchId: 'branch-2', status: 'COMPLETED', totalAmount: 30000, branch: { name: 'Bandung', code: 'BDG' } },
];

describe('GET /api/admin/orders', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.order.findMany as jest.Mock).mockResolvedValue(mockOrders);
    });

    it('should return all orders for super admin', async () => {
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'super_admin_session') return { name, value: 'authenticated' };
            return undefined;
        });

        const response = await GET(makeRequest());
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(Array.isArray(data)).toBe(true);
        // Route always excludes PENDING
        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    status: { not: 'PENDING' },
                }),
            })
        );
    });

    it('should filter by branchId for staff', async () => {
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'staff_session') return {
                name,
                value: JSON.stringify({ userId: 'EMP-001', branchId: 'branch-1' }),
            };
            if (name === 'super_admin_session') return undefined;
            return undefined;
        });

        (prisma.order.findMany as jest.Mock).mockResolvedValue([mockOrders[0]]);

        const response = await GET(makeRequest());

        expect(response.status).toBe(200);
        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    branchId: 'branch-1',
                    status: { not: 'PENDING' },
                }),
            })
        );
    });

    it('should return 401 when no session cookies present', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        const response = await GET(makeRequest());
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain('Unauthorized');
    });

    it('should return 403 when staff session has no branchId', async () => {
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'staff_session') return {
                name,
                value: JSON.stringify({ userId: 'EMP-001' }), // No branchId
            };
            if (name === 'super_admin_session') return undefined;
            return undefined;
        });

        const response = await GET(makeRequest());
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('branch');
    });

    it('should filter by branchId query param for super admin', async () => {
        mockCookieStore.get.mockImplementation((name: string) => {
            if (name === 'super_admin_session') return { name, value: 'authenticated' };
            return undefined;
        });

        await GET(makeRequest({ branchId: 'branch-1' }));

        expect(prisma.order.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    branchId: 'branch-1',
                }),
            })
        );
    });
});
