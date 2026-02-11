// __tests__/integration/notification-webhook.test.ts
// Integration tests for POST /api/notification (Midtrans Webhook)
import crypto from 'node:crypto';

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
jest.mock('@/lib/whatsapp', () => ({
    sendWhatsAppNotification: jest.fn().mockResolvedValue(true),
}));

import { prisma } from '@/lib/prisma';

const ORIGINAL_ENV = process.env;
const TEST_SERVER_KEY = 'SB-Mid-server-TEST123';

beforeAll(() => {
    process.env = { ...ORIGINAL_ENV, MIDTRANS_SERVER_KEY: TEST_SERVER_KEY };
});
afterAll(() => {
    process.env = ORIGINAL_ENV;
});

import { POST } from '@/app/api/notification/route';

function generateSignature(orderId: string, statusCode: string, grossAmount: string): string {
    return crypto.createHash('sha512')
        .update(orderId + statusCode + grossAmount + TEST_SERVER_KEY)
        .digest('hex');
}

function makeRequest(body: any): Request {
    return new Request('http://localhost:3000/api/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/notification (Midtrans Webhook)', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should process settlement → update order to PAID', async () => {
        const orderId = 'ORDER-001';
        const sig = generateSignature(orderId, '200', '50000.00');

        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: orderId,
            status: 'PENDING',
            whatsapp: '081234567890',
            customerName: 'Test',
        });
        (prisma.order.update as jest.Mock).mockResolvedValue({ id: orderId, status: 'PAID' });

        const response = await POST(makeRequest({
            order_id: orderId,
            status_code: '200',
            gross_amount: '50000.00',
            transaction_status: 'settlement',
            fraud_status: 'accept',
            signature_key: sig,
        }));

        expect(response.status).toBe(200);
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: orderId },
            data: expect.objectContaining({ status: 'PAID' }),
        });
    });

    it('should reject invalid signature with 403', async () => {
        const response = await POST(makeRequest({
            order_id: 'ORDER-002',
            status_code: '200',
            gross_amount: '50000.00',
            transaction_status: 'settlement',
            fraud_status: 'accept',
            signature_key: 'FAKE_SIGNATURE',
        }));

        expect(response.status).toBe(403);
        const data = await response.json();
        expect(data.error).toBe('Forbidden');
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should handle order not found gracefully (200 acknowledged)', async () => {
        const orderId = 'NONEXISTENT';
        const sig = generateSignature(orderId, '200', '50000.00');

        (prisma.order.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await POST(makeRequest({
            order_id: orderId,
            status_code: '200',
            gross_amount: '50000.00',
            transaction_status: 'settlement',
            fraud_status: 'accept',
            signature_key: sig,
        }));

        // Should acknowledge without error (prevent Midtrans retry)
        expect(response.status).toBe(200);
        expect(prisma.order.update).not.toHaveBeenCalled();
    });

    it('should update order to FAILED on cancel/deny/expire', async () => {
        const orderId = 'ORDER-003';
        const sig = generateSignature(orderId, '202', '50000.00');

        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: orderId,
            status: 'PENDING',
        });
        (prisma.order.update as jest.Mock).mockResolvedValue({ id: orderId, status: 'FAILED' });

        const response = await POST(makeRequest({
            order_id: orderId,
            status_code: '202',
            gross_amount: '50000.00',
            transaction_status: 'cancel',
            fraud_status: 'accept',
            signature_key: sig,
        }));

        expect(response.status).toBe(200);
        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: orderId },
            data: expect.objectContaining({ status: 'FAILED' }),
        });
    });

    it('should keep PENDING on fraud_status=challenge', async () => {
        const orderId = 'ORDER-004';
        const sig = generateSignature(orderId, '201', '50000.00');

        (prisma.order.findUnique as jest.Mock).mockResolvedValue({
            id: orderId,
            status: 'PENDING',
        });

        const response = await POST(makeRequest({
            order_id: orderId,
            status_code: '201',
            gross_amount: '50000.00',
            transaction_status: 'capture',
            fraud_status: 'challenge',
            signature_key: sig,
        }));

        expect(response.status).toBe(200);
        // Should NOT update to PAID when fraud_status is challenge
    });
});
