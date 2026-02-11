// __tests__/integration/admin-employees.test.ts
// Integration tests for /api/admin/employees (GET, POST, PATCH)

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
import { prisma } from '@/lib/prisma';

import { GET, POST, PATCH } from '@/app/api/admin/employees/route';

function makeGetRequest(params: Record<string, string> = {}): Request {
    const url = new URL('http://localhost:3000/api/admin/employees');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new Request(url.toString(), { method: 'GET' });
}

function makeBodyRequest(method: string, body: any): Request {
    return new Request('http://localhost:3000/api/admin/employees', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('/api/admin/employees', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============= GET =============
    describe('GET — List Employees', () => {
        it('should return all employees', async () => {
            (prisma.employee.findMany as jest.Mock).mockResolvedValue([
                { id: 'EMP-001', name: 'John', role: 'STAFF', branch: { id: 'b1', name: 'JKT' } },
                { id: 'EMP-002', name: 'Jane', role: 'MANAGER', branch: { id: 'b1', name: 'JKT' } },
            ]);

            const response = await GET(makeGetRequest());
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
        });

        it('should filter by branchId', async () => {
            (prisma.employee.findMany as jest.Mock).mockResolvedValue([
                { id: 'EMP-001', name: 'John', branchId: 'branch-1' },
            ]);

            await GET(makeGetRequest({ branchId: 'branch-1' }));

            expect(prisma.employee.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: expect.objectContaining({ branchId: 'branch-1' }),
                })
            );
        });
    });

    // ============= POST =============
    describe('POST — Create Employee', () => {
        it('should create employee with sequential ID (EMP-001)', async () => {
            (prisma.employee.findFirst as jest.Mock).mockResolvedValue(null); // No existing
            (prisma.branch.findUnique as jest.Mock).mockResolvedValue({ id: 'branch-1', name: 'Jakarta' });
            (prisma.employee.create as jest.Mock).mockResolvedValue({
                id: 'EMP-001',
                name: 'New Employee',
                role: 'STAFF',
                branch: { id: 'branch-1', name: 'Jakarta' },
            });

            const response = await POST(makeBodyRequest('POST', {
                name: 'New Employee',
                role: 'STAFF',
                branchId: 'branch-1',
                whatsapp: '081200001111',
            }));
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(prisma.employee.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({
                        id: 'EMP-001',
                        name: 'New Employee',
                        branchId: 'branch-1',
                    }),
                })
            );
        });

        it('should auto-increment from last employee (EMP-005 → EMP-006)', async () => {
            (prisma.employee.findFirst as jest.Mock).mockResolvedValue({ id: 'EMP-005' });
            (prisma.branch.findUnique as jest.Mock).mockResolvedValue({ id: 'branch-1' });
            (prisma.employee.create as jest.Mock).mockResolvedValue({
                id: 'EMP-006',
                branch: { id: 'branch-1' },
            });

            await POST(makeBodyRequest('POST', {
                name: 'Next Employee',
                role: 'STAFF',
                branchId: 'branch-1',
                whatsapp: '081200002222',
            }));

            expect(prisma.employee.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.objectContaining({ id: 'EMP-006' }),
                })
            );
        });

        it('should return 400 when branchId is missing', async () => {
            const response = await POST(makeBodyRequest('POST', {
                name: 'No Branch',
                role: 'STAFF',
            }));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Branch');
        });

        it('should return 400 when branch does not exist', async () => {
            (prisma.branch.findUnique as jest.Mock).mockResolvedValue(null);

            const response = await POST(makeBodyRequest('POST', {
                name: 'Bad Branch',
                role: 'STAFF',
                branchId: 'nonexistent',
            }));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('Invalid');
        });
    });

    // ============= PATCH =============
    describe('PATCH — Update Employee', () => {
        it('should reset device (RESET_DEVICE action)', async () => {
            (prisma.employee.update as jest.Mock).mockResolvedValue({
                id: 'EMP-001',
                deviceId: null,
                branch: { id: 'b1' },
                accessibleBranches: [],
            });

            const response = await PATCH(makeBodyRequest('PATCH', {
                id: 'EMP-001',
                action: 'RESET_DEVICE',
            }));

            expect(response.status).toBe(200);
            expect(prisma.employee.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'EMP-001' },
                    data: { deviceId: null },
                })
            );
        });

        it('should toggle status (TOGGLE_STATUS action)', async () => {
            (prisma.employee.findUnique as jest.Mock).mockResolvedValue({
                id: 'EMP-001',
                isActive: true,
            });
            (prisma.employee.update as jest.Mock).mockResolvedValue({
                id: 'EMP-001',
                isActive: false,
                branch: { id: 'b1' },
                accessibleBranches: [],
            });

            await PATCH(makeBodyRequest('PATCH', {
                id: 'EMP-001',
                action: 'TOGGLE_STATUS',
            }));

            expect(prisma.employee.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'EMP-001' },
                    data: { isActive: false },
                })
            );
        });

        it('should return 400 for missing ID', async () => {
            const response = await PATCH(makeBodyRequest('PATCH', { action: 'TOGGLE_STATUS' }));
            const data = await response.json();

            expect(response.status).toBe(400);
        });
    });
});
