// __tests__/unit/webhook-signature.test.ts
// Unit tests for Midtrans Webhook SHA-512 signature verification
import crypto from 'node:crypto';

/**
 * Extracted signature verification logic from /api/notification/route.ts
 */
function generateSignature(orderId: string, statusCode: string, grossAmount: string, serverKey: string): string {
    const hashInput = orderId + statusCode + grossAmount + serverKey;
    return crypto.createHash('sha512').update(hashInput).digest('hex');
}

function verifySignature(
    orderId: string, statusCode: string, grossAmount: string,
    serverKey: string, signatureKey: string
): boolean {
    const expected = generateSignature(orderId, statusCode, grossAmount, serverKey);
    return signatureKey === expected;
}

describe('Midtrans Webhook Signature', () => {

    const SERVER_KEY = 'SB-Mid-server-TEST123456';

    describe('generateSignature()', () => {
        it('should produce consistent SHA-512 hash', () => {
            const sig1 = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            const sig2 = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(sig1).toBe(sig2);
        });

        it('should produce 128-character hex string (SHA-512)', () => {
            const sig = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(sig).toHaveLength(128);
            expect(sig).toMatch(/^[a-f0-9]{128}$/);
        });

        it('should produce different hashes for different order IDs', () => {
            const sig1 = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            const sig2 = generateSignature('ORDER-002', '200', '50000.00', SERVER_KEY);
            expect(sig1).not.toBe(sig2);
        });

        it('should produce different hashes for different amounts', () => {
            const sig1 = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            const sig2 = generateSignature('ORDER-001', '200', '60000.00', SERVER_KEY);
            expect(sig1).not.toBe(sig2);
        });

        it('should produce different hashes for different server keys', () => {
            const sig1 = generateSignature('ORDER-001', '200', '50000.00', 'KEY-A');
            const sig2 = generateSignature('ORDER-001', '200', '50000.00', 'KEY-B');
            expect(sig1).not.toBe(sig2);
        });
    });

    describe('verifySignature()', () => {
        it('should return true for valid signature', () => {
            const validSig = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(verifySignature('ORDER-001', '200', '50000.00', SERVER_KEY, validSig)).toBe(true);
        });

        it('should return false for tampered order_id', () => {
            const validSig = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(verifySignature('ORDER-HACKED', '200', '50000.00', SERVER_KEY, validSig)).toBe(false);
        });

        it('should return false for tampered amount', () => {
            const validSig = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(verifySignature('ORDER-001', '200', '1.00', SERVER_KEY, validSig)).toBe(false);
        });

        it('should return false for tampered status code', () => {
            const validSig = generateSignature('ORDER-001', '200', '50000.00', SERVER_KEY);
            expect(verifySignature('ORDER-001', '500', '50000.00', SERVER_KEY, validSig)).toBe(false);
        });

        it('should return false for completely fake signature', () => {
            expect(verifySignature('ORDER-001', '200', '50000.00', SERVER_KEY, 'FAKE_SIGNATURE')).toBe(false);
        });

        it('should return false for empty signature', () => {
            expect(verifySignature('ORDER-001', '200', '50000.00', SERVER_KEY, '')).toBe(false);
        });

        it('should handle special characters in order_id', () => {
            const orderId = 'ABC123XYZ456789';
            const sig = generateSignature(orderId, '200', '40000.00', SERVER_KEY);
            expect(verifySignature(orderId, '200', '40000.00', SERVER_KEY, sig)).toBe(true);
        });
    });
});
