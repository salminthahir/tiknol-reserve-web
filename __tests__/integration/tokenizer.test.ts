// __tests__/integration/tokenizer.test.ts
// Integration tests for POST /api/tokenizer (Online Order + Midtrans)

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
jest.mock('@/lib/midtrans', () => ({
    snap: {
        createTransaction: jest.fn().mockResolvedValue({ token: 'mock_snap_token_123' }),
    },
}));
jest.mock('nanoid', () => ({
    customAlphabet: () => () => 'ONLINEORDER12345',
}));

import { prisma } from '@/lib/prisma';
import { snap } from '@/lib/midtrans';

import { POST } from '@/app/api/tokenizer/route';

function makeRequest(body: any): Request {
    return new Request('http://localhost:3000/api/tokenizer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

const validPayload = {
    customerName: 'Test Customer',
    whatsapp: '081234567890',
    items: [
        { id: 'p1', name: 'Americano', price: 25000, qty: 2 },
    ],
    orderType: 'DINE_IN',
    branchId: 'branch-1',
    subtotal: 50000,
    discountAmount: 0,
    voucherId: null,
};

describe('POST /api/tokenizer', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        (prisma.order.create as jest.Mock).mockResolvedValue({
            id: 'ONLINEORDER12345',
            status: 'PENDING',
        });
        (prisma.order.update as jest.Mock).mockResolvedValue({ id: 'ONLINEORDER12345' });
        (snap.createTransaction as jest.Mock).mockResolvedValue({ token: 'mock_snap_token_123' });
    });

    it('should create order and return Midtrans snap token', async () => {
        const response = await POST(makeRequest(validPayload));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.token).toBe('mock_snap_token_123');
        expect(data.orderId).toBe('ONLINEORDER12345');

        // Verify order created in DB as PENDING
        expect(prisma.order.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                status: 'PENDING',
                branchId: 'branch-1',
                customerName: 'Test Customer',
                paymentType: 'QRIS',
                orderSource: 'WEB_CUSTOMER',
            }),
        });

        // Verify Midtrans called
        expect(snap.createTransaction).toHaveBeenCalled();

        // Verify snapToken saved
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'ONLINEORDER12345' },
            data: { snapToken: 'mock_snap_token_123' },
        });
    });

    it('should return 400 when branchId is missing', async () => {
        const { branchId, ...missingBranch } = validPayload;

        const response = await POST(makeRequest(missingBranch));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.error).toContain('Branch');
    });

    it('should include discount as negative line item when voucher applied', async () => {
        const payloadWithVoucher = {
            ...validPayload,
            voucherId: 'vcr-001',
            discountAmount: 10000,
        };

        const response = await POST(makeRequest(payloadWithVoucher));

        // Verify Midtrans parameters include discount
        const midtransCall = (snap.createTransaction as jest.Mock).mock.calls[0][0];
        const discountItem = midtransCall.item_details.find((i: any) => i.id === 'DISCOUNT');

        expect(discountItem).toBeDefined();
        expect(discountItem.price).toBe(-10000);
        expect(discountItem.quantity).toBe(1);
        expect(discountItem.name).toContain('Discount');
    });

    it('should handle Midtrans API failure gracefully', async () => {
        (snap.createTransaction as jest.Mock).mockRejectedValue(new Error('Midtrans Error'));

        const response = await POST(makeRequest(validPayload));

        expect(response.status).toBe(500);
    });

    it('should use calculated total when subtotal not provided', async () => {
        const { subtotal, ...noSubtotal } = validPayload;
        await POST(makeRequest(noSubtotal));

        // Items: 25000 * 2 = 50000 calculated total
        expect(prisma.order.create).toHaveBeenCalledWith({
            data: expect.objectContaining({
                totalAmount: 50000,
            }),
        });
    });
});
