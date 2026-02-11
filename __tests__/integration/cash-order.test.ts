// __tests__/integration/cash-order.test.ts
// Integration tests for POST /api/cash-order

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

// Mock nanoid
jest.mock('nanoid', () => ({
    customAlphabet: () => () => 'TESTORDERID1234',
}));

import { POST } from '@/app/api/cash-order/route';

function makeRequest(body: any): Request {
    return new Request('http://localhost:3000/api/cash-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const validOrderData = {
    customerName: 'Test Customer',
    whatsapp: '081234567890',
    totalAmount: 50000,
    subtotal: 50000,
    discountAmount: 0,
    orderType: 'DINE_IN',
    items: [
        { id: 'p1', name: 'Americano', price: 25000, qty: 2 },
    ],
    voucherId: null,
};

const staffSession = JSON.stringify({
    userId: 'EMP-001',
    name: 'Kasir',
    role: 'STAFF',
    branchId: 'branch-1',
    branchName: 'Jakarta',
});

describe('POST /api/cash-order', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        // Default: valid session
        mockCookieStore.get.mockReturnValue({ name: 'staff_session', value: staffSession });
    });

    it('should create cash order successfully', async () => {
        (prisma.order.create as jest.Mock).mockResolvedValue({
            id: 'TESTORDERID1234',
            ...validOrderData,
            branchId: 'branch-1',
            status: 'PAID',
            orderSource: 'CASHIER_POS',
            paymentType: 'CASH',
        });

        const response = await POST(makeRequest(validOrderData));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.id).toBe('TESTORDERID1234');
        expect(prisma.order.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                branchId: 'branch-1',
                status: 'PAID',
                orderSource: 'CASHIER_POS',
                paymentType: 'CASH',
                customerName: 'Test Customer',
            }),
        });
    });

    it('should return 401 when no session cookie', async () => {
        mockCookieStore.get.mockReturnValue(undefined);

        const response = await POST(makeRequest(validOrderData));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.error).toContain('Unauthorized');
    });

    it('should return 403 when session has no branchId', async () => {
        mockCookieStore.get.mockReturnValue({
            name: 'staff_session',
            value: JSON.stringify({ userId: 'EMP-001', name: 'Kasir' }),
        });

        const response = await POST(makeRequest(validOrderData));
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.error).toContain('branch');
    });

    it('should return 400 for missing required fields', async () => {
        const response = await POST(makeRequest({ customerName: 'Test' }));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('tidak lengkap');
    });

    it('should increment voucher usageCount when voucherId provided', async () => {
        (prisma.order.create as jest.Mock).mockResolvedValue({
            id: 'TESTORDERID1234',
            ...validOrderData,
            voucherId: 'vcr-001',
        });
        (prisma.voucher.update as jest.Mock).mockResolvedValue({});

        const orderWithVoucher = { ...validOrderData, voucherId: 'vcr-001' };
        await POST(makeRequest(orderWithVoucher));

        expect(prisma.voucher.update).toHaveBeenCalledWith({
            where: { id: 'vcr-001' },
            data: { usageCount: { increment: 1 } },
        });
    });

    it('should NOT increment voucher when no voucherId', async () => {
        (prisma.order.create as jest.Mock).mockResolvedValue({
            id: 'TESTORDERID1234',
            ...validOrderData,
        });

        await POST(makeRequest(validOrderData));

        expect(prisma.voucher.update).not.toHaveBeenCalled();
    });

    it('should use DINE_IN as default orderType', async () => {
        (prisma.order.create as jest.Mock).mockResolvedValue({ id: 'TESTORDERID1234' });

        const { orderType, ...withoutType } = validOrderData;
        await POST(makeRequest(withoutType));

        expect(prisma.order.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                orderType: 'DINE_IN',
            }),
        });
    });
});
