import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all employees
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get('branchId');

  console.log('API /api/admin/employees hit', branchId ? `Filter: ${branchId}` : 'All');

  try {
    if (!prisma.employee) {
      throw new Error('Prisma Client not initialized');
    }

    const where: any = {};
    if (branchId) {
      where.branchId = branchId;
    }

    const employees = await prisma.employee.findMany({
      where,
      orderBy: { name: 'asc' },
      include: {
        branch: { select: { id: true, name: true, code: true } }, // Include Home Branch info
        accessibleBranches: {
          include: { branch: { select: { id: true, name: true } } }
        },
        _count: {
          select: { attendances: true }
        }
      }
    });

    return NextResponse.json(employees);
  } catch (error: any) {
    console.error('API Error:', error);
    return NextResponse.json({
      error: 'Failed to fetch employees',
      details: error?.message
    }, { status: 500 });
  }
}

// POST: Create a new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, pin, role, branchId, isGlobalAccess, accessibleBranchIds } = body;

    if (!branchId) {
      return NextResponse.json({ error: 'Home Branch is required' }, { status: 400 });
    }

    // 0. Validate Branch Exists
    const branchExists = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branchExists) {
      return NextResponse.json({ error: 'Invalid Home Branch ID' }, { status: 400 });
    }

    // 1. Generate Sequential ID
    const lastEmployee = await prisma.employee.findFirst({
      where: { id: { startsWith: 'EMP-' } },
      orderBy: { id: 'desc' }
    });

    let newId = 'EMP-001';
    if (lastEmployee) {
      const lastNumber = parseInt(lastEmployee.id.replace('EMP-', ''));
      if (!isNaN(lastNumber)) {
        newId = `EMP-${String(lastNumber + 1).padStart(3, '0')}`;
      }
    }

    // 2. Create Employee with Branch Access
    const newEmployee = await prisma.employee.create({
      data: {
        id: newId,
        name,
        whatsapp,
        pin,
        role: role || 'STAFF',
        branchId, // Home Branch
        isGlobalAccess: isGlobalAccess || false,
        accessibleBranches: {
          create: accessibleBranchIds?.map((bid: string) => ({ branchId: bid })) || []
        }
      },
      include: { branch: true }
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('API POST Error:', error);
    return NextResponse.json({
      error: 'Failed to create employee',
      details: error?.message
    }, { status: 500 });
  }
}

// PATCH: Update employee
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action, ...data } = body;
    const targetId = body.oldId || id;

    if (!targetId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let updateData: any = {};

    if (action === 'RESET_DEVICE') {
      updateData = { deviceId: null };
    } else if (action === 'TOGGLE_STATUS') {
      const current = await prisma.employee.findUnique({ where: { id: targetId } });
      if (current) updateData = { isActive: !current.isActive };
    } else if (action === 'UPDATE_ACCESS') {
      // NEW: Handle Branch Access Update
      const { branchId, isGlobalAccess, accessibleBranchIds } = data;

      // 1. Update basic fields first
      if (branchId) {
        const branchExists = await prisma.branch.findUnique({ where: { id: branchId } });
        if (!branchExists) return NextResponse.json({ error: 'Invalid Branch ID' }, { status: 400 });
      }

      updateData = {
        branchId,
        isGlobalAccess
      };

      // 2. Handle accessibleBranches via transaction logic inside update
      // Prisma update can handle nested writes
      updateData.accessibleBranches = {
        deleteMany: {}, // Remove all existing
        create: accessibleBranchIds?.map((bid: string) => ({ branchId: bid })) || [] // Add new
      };

    } else if (action === 'UPDATE_PROFILE') {
      updateData = {
        name: data.name,
        whatsapp: data.whatsapp,
        role: data.role,
        branchId: data.branchId // Allow branch transfer in profile update
      };
      if (data.pin) updateData.pin = data.pin;

      // Handle ID change logic... (omitted for brevity standard update)
      // Assuming ID change is rare and handled separately or safely
      // Keeping original ID change logic if safe:
      if (id && id !== targetId) {
        const exists = await prisma.employee.findUnique({ where: { id: id } });
        if (exists) return NextResponse.json({ error: 'ID already in use' }, { status: 400 });
        updateData.id = id;
      }
    } else {
      updateData = data;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: targetId },
      data: updateData,
      include: { branch: true, accessibleBranches: true }
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    console.error('API PATCH Error:', error);
    return NextResponse.json({ error: 'Failed to update employee', details: error?.message }, { status: 500 });
  }
}

// DELETE: Remove employee
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 });
    }

    // Prisma schema has onDelete: Cascade on EmployeeAccess and Attendance
    // so related records are automatically cleaned up
    await prisma.employee.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('API DELETE Error:', error);
    return NextResponse.json({
      error: 'Failed to delete employee',
      details: error?.message
    }, { status: 500 });
  }
}
