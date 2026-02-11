// __tests__/integration/admin-products.test.ts
// Integration tests for /api/admin/products (GET, POST, PUT, DELETE)

jest.mock('@/lib/prisma', () => require('../../__mocks__/prisma'));
import { prisma } from '@/lib/prisma';

import { GET, POST, PUT, DELETE as DELETE_HANDLER } from '@/app/api/admin/products/route';

function makeGetRequest(params: Record<string, string> = {}): Request {
    const url = new URL('http://localhost:3000/api/admin/products');
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    return new Request(url.toString(), { method: 'GET' });
}

function makeBodyRequest(method: string, body: any): Request {
    return new Request('http://localhost:3000/api/admin/products', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

describe('/api/admin/products', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    });

    // ============= GET =============
    describe('GET — List Products', () => {
        it('should return products with branch-specific pricing when branchId provided', async () => {
            const products = [
                {
                    id: 'prod-1',
                    name: 'Americano',
                    price: 25000,
                    category: 'Coffee',
                    productBranches: [
                        { branchId: 'branch-1', isAvailable: true, branchPrice: 22000 },
                    ],
                },
            ];
            (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

            const response = await GET(makeGetRequest({ branchId: 'branch-1' }));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(1);
            // Should use branch-specific price override
            expect(data[0].price).toBe(22000);
        });

        it('should return all products without branch filter', async () => {
            (prisma.product.findMany as jest.Mock).mockResolvedValue([
                { id: 'p1', name: 'Americano', price: 25000, productBranches: [] },
                { id: 'p2', name: 'Latte', price: 30000, productBranches: [] },
            ]);

            const response = await GET(makeGetRequest());
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data).toHaveLength(2);
        });

        it('should fall back to base price when no branchPrice override', async () => {
            const products = [
                {
                    id: 'prod-1',
                    name: 'Americano',
                    price: 25000,
                    productBranches: [
                        { branchId: 'branch-1', isAvailable: true, branchPrice: null },
                    ],
                },
            ];
            (prisma.product.findMany as jest.Mock).mockResolvedValue(products);

            const response = await GET(makeGetRequest({ branchId: 'branch-1' }));
            const data = await response.json();

            expect(data[0].price).toBe(25000); // Fallback to base price
        });
    });

    // ============= POST =============
    describe('POST — Create Product', () => {
        it('should create product and auto-assign to all active branches', async () => {
            const newProd = { id: 'new-prod', name: 'New Coffee', price: 30000 };
            (prisma.product.create as jest.Mock).mockResolvedValue(newProd);
            (prisma.branch.findMany as jest.Mock).mockResolvedValue([
                { id: 'branch-1' },
                { id: 'branch-2' },
            ]);
            (prisma.productBranch.createMany as jest.Mock).mockResolvedValue({ count: 2 });

            const response = await POST(makeBodyRequest('POST', {
                name: 'New Coffee',
                price: 30000,
                category: 'Coffee',
            }));
            const data = await response.json();

            expect(response.status).toBe(200); // Route returns 200, not 201
            expect(data.name).toBe('New Coffee');
            expect(prisma.product.create).toHaveBeenCalled();
            expect(prisma.productBranch.createMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    data: expect.arrayContaining([
                        expect.objectContaining({ branchId: 'branch-1', productId: 'new-prod' }),
                        expect.objectContaining({ branchId: 'branch-2', productId: 'new-prod' }),
                    ]),
                })
            );
        });

        it('should return 400 for missing name or price', async () => {
            const response = await POST(makeBodyRequest('POST', { name: 'Incomplete' }));
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toContain('wajib');
        });
    });

    // ============= PUT =============
    describe('PUT — Update Product', () => {
        it('should update base product fields when no branchId', async () => {
            (prisma.product.update as jest.Mock).mockResolvedValue({
                id: 'prod-1',
                name: 'Updated Americano',
                price: 28000,
            });

            const response = await PUT(makeBodyRequest('PUT', {
                id: 'prod-1',
                name: 'Updated Americano',
                price: 28000,
            }));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(prisma.product.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { id: 'prod-1' },
                })
            );
        });

        it('should upsert ProductBranch when branchId provided', async () => {
            (prisma.productBranch.upsert as jest.Mock).mockResolvedValue({
                productId: 'prod-1',
                branchId: 'branch-1',
                branchPrice: 22000,
                isAvailable: true,
            });
            (prisma.product.findUnique as jest.Mock).mockResolvedValue({
                id: 'prod-1',
                name: 'Americano',
                productBranches: [{ branchId: 'branch-1', branchPrice: 22000, isAvailable: true }],
            });

            const response = await PUT(makeBodyRequest('PUT', {
                id: 'prod-1',
                branchId: 'branch-1',
                branchPrice: 22000,
                isAvailable: true,
            }));

            expect(response.status).toBe(200);
            expect(prisma.productBranch.upsert).toHaveBeenCalled();
        });
    });

    // ============= DELETE =============
    describe('DELETE — Remove Product', () => {
        it('should delete product by ID', async () => {
            (prisma.product.delete as jest.Mock).mockResolvedValue({ id: 'prod-1' });

            const response = await DELETE_HANDLER(makeBodyRequest('DELETE', { id: 'prod-1' }));
            const data = await response.json();

            expect(response.status).toBe(200);
            expect(data.success).toBe(true);
            expect(prisma.product.delete).toHaveBeenCalledWith({
                where: { id: 'prod-1' },
            });
        });

        it('should return 500 on delete failure', async () => {
            (prisma.product.delete as jest.Mock).mockRejectedValue(new Error('Not found'));

            const response = await DELETE_HANDLER(makeBodyRequest('DELETE', { id: 'nonexist' }));

            expect(response.status).toBe(500);
        });
    });
});
