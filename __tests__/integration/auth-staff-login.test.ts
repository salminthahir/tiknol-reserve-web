// __tests__/integration/auth-staff-login.test.ts
// Integration tests for POST /api/auth/staff/login

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));

import { prisma } from '@/lib/prisma';

// Mock next/headers cookies()
const mockCookieStore = {
    get: jest.fn(),
    set: jest.fn(),
    delete: jest.fn(),
    has: jest.fn(),
};
jest.mock('next/headers', () => ({
    cookies: jest.fn(() => Promise.resolve(mockCookieStore)),
}));

// Import the handler AFTER mocks are set up
import { POST } from '@/app/api/auth/staff/login/route';

function makeRequest(body: any): Request {
    return new Request('http://localhost:3000/api/auth/staff/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('POST /api/auth/staff/login', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should login successfully with valid Employee ID', async () => {
        const mockEmployee = {
            id: 'EMP-001',
            name: 'John Doe',
            role: 'STAFF',
            isActive: true,
            branchId: 'branch-1',
            branch: { name: 'Jakarta Pusat' },
            isGlobalAccess: false,
            accessibleBranches: [],
        };

        (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);

        const response = await POST(makeRequest({ employeeId: 'emp-001' }));
        const data = await response.json();

        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
        expect(data.user.userId).toBe('EMP-001');
        expect(data.user.name).toBe('John Doe');
        expect(data.user.role).toBe('STAFF');
        expect(data.user.branchId).toBe('branch-1');
        expect(data.user.branchName).toBe('Jakarta Pusat');
        expect(mockCookieStore.set).toHaveBeenCalledWith(
            'staff_session',
            expect.any(String),
            expect.objectContaining({ httpOnly: true, path: '/' })
        );
    });

    it('should return 401 for non-existent Employee ID', async () => {
        (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

        const response = await POST(makeRequest({ employeeId: 'EMP-999' }));
        const data = await response.json();

        expect(response.status).toBe(401);
        expect(data.message).toBe('Employee ID not found');
    });

    it('should return 403 for inactive employee', async () => {
        (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
            id: 'EMP-002',
            name: 'Jane',
            isActive: false,
            branchId: 'branch-1',
            branch: { name: 'Jakarta' },
            accessibleBranches: [],
        });

        const response = await POST(makeRequest({ employeeId: 'EMP-002' }));
        const data = await response.json();

        expect(response.status).toBe(403);
        expect(data.message).toContain('inactive');
    });

    it('should return 400 for missing Employee ID', async () => {
        const response = await POST(makeRequest({}));
        const data = await response.json();

        expect(response.status).toBe(400);
        expect(data.message).toBe('Employee ID is required');
    });

    it('should normalize Employee ID to uppercase', async () => {
        (prisma.employee.findUnique as jest.Mock).mockResolvedValue(null);

        await POST(makeRequest({ employeeId: 'emp-001' }));

        expect(prisma.employee.findUnique).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 'EMP-001' },
            })
        );
    });

    it('should include additionalAccess in session for multi-branch employees', async () => {
        const mockEmployee = {
            id: 'EMP-003',
            name: 'Manager',
            role: 'MANAGER',
            isActive: true,
            branchId: 'branch-1',
            branch: { name: 'Jakarta' },
            isGlobalAccess: false,
            accessibleBranches: [
                { branchId: 'branch-2', branch: { name: 'Bandung' } },
                { branchId: 'branch-3', branch: { name: 'Surabaya' } },
            ],
        };

        (prisma.employee.findUnique as jest.Mock).mockResolvedValue(mockEmployee);

        const response = await POST(makeRequest({ employeeId: 'EMP-003' }));
        const data = await response.json();

        expect(data.user.additionalAccess).toHaveLength(2);
        expect(data.user.additionalAccess[0].branchId).toBe('branch-2');
        expect(data.user.additionalAccess[1].branchName).toBe('Surabaya');
    });
});
