// __tests__/integration/auth-superadmin-login.test.ts
// Integration tests for POST /api/auth/super-admin/login

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

// Set env before importing handler
const ORIGINAL_ENV = process.env;
beforeAll(() => {
    process.env = { ...ORIGINAL_ENV, SUPER_ADMIN_PIN: '123456' };
});
afterAll(() => {
    process.env = ORIGINAL_ENV;
});

import { POST } from '@/app/api/auth/super-admin/login/route';

function makeRequest(body: any): Request {
    return new Request('http://localhost:3000/api/auth/super-admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/super-admin/login', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should login with valid Master PIN', async () => {
        const response = await POST(makeRequest({ pin: '123456' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(mockCookieStore.set).toHaveBeenCalledWith(
            'super_admin_session',
            'authenticated',
            expect.objectContaining({ httpOnly: true })
        );
    });

    it('should login with valid Admin Employee PIN', async () => {
        (prisma.employee.findFirst as jest.Mock).mockResolvedValue({
            id: 'EMP-ADMIN',
            name: 'Admin User',
            role: 'ADMIN',
            pin: '654321',
            isActive: true,
        });

        const response = await POST(makeRequest({ pin: '654321' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
    });

    it('should return 401 for invalid PIN', async () => {
        (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

        const response = await POST(makeRequest({ pin: '000000' }));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.message).toBe('Invalid Credentials');
    });

    it('should return 400 for missing PIN', async () => {
        const response = await POST(makeRequest({}));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('PIN is required');
    });

    it('should check Employee table only if Master PIN does not match', async () => {
        (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null);

        await POST(makeRequest({ pin: 'wrong_pin' }));

        expect(prisma.employee.findFirst).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    pin: 'wrong_pin',
                    role: 'ADMIN',
                    isActive: true,
                }),
            })
        );
    });
});
