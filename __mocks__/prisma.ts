// __mocks__/prisma.ts — Prisma Client Mock for testing
// Usage: jest.mock('@/lib/prisma', () => require('../__mocks__/prisma'));

const mockModel = () => ({
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
    aggregate: jest.fn(),
});

export const prisma: Record<string, any> = {
    order: mockModel(),
    product: mockModel(),
    voucher: mockModel(),
    employee: mockModel(),
    branch: mockModel(),
    attendance: mockModel(),
    shift: mockModel(),
    productBranch: mockModel(),
    employeeAccess: mockModel(),
    settings: mockModel(),
    $transaction: jest.fn((fn: (client: Record<string, any>) => any) => fn(prisma)),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
};
