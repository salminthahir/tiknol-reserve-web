import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: List all employees
export async function GET() {
  console.log('API /api/admin/employees hit');
  try {
    if (!prisma.employee) {
      throw new Error('Prisma Client not initialized or Employee model missing');
    }
    const employees = await prisma.employee.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { attendances: true }
        }
      }
    });
    console.log('Employees found:', employees?.length);
    return NextResponse.json(employees);
  } catch (error: any) {
    const safeError = error || { message: 'Unknown error (null)' };
    console.error('API Error:', safeError);
    return NextResponse.json({
      error: 'Failed to fetch employees',
      details: safeError?.message || String(safeError)
    }, { status: 500 });
  }
}

// POST: Create a new employee
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, whatsapp, pin, role } = body;

    if (!prisma.employee) {
      throw new Error('Prisma Client not initialized');
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

    // 2. Create Employee
    const newEmployee = await prisma.employee.create({
      data: {
        id: newId,
        name,
        whatsapp,
        pin,
        role: role || 'STAFF',
      },
    });

    return NextResponse.json(newEmployee, { status: 201 });
  } catch (error: any) {
    console.error('API POST Error:', error); // Log the raw error
    return NextResponse.json({
      error: 'Failed to create employee',
      details: error?.message || 'Unknown server error'
    }, { status: 500 });
  }
}

// PATCH: Update employee
export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    console.log('PATCH Body:', body);
    const { id, action, ...data } = body;

    // Separate oldId (if provided) else fallback to id
    const targetId = body.oldId || id;
    console.log('Target ID:', targetId);

    if (!targetId) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    let updateData: any = {};

    if (action === 'RESET_DEVICE') {
      updateData = { deviceId: null };
    } else if (action === 'TOGGLE_STATUS') {
      const current = await prisma.employee.findUnique({ where: { id: targetId } });
      if (current) updateData = { isActive: !current.isActive };
    } else if (action === 'UPDATE_PROFILE') {
      updateData = {
        name: data.name,
        whatsapp: data.whatsapp,
        role: data.role, // Allow role update
      };

      // Update PIN if provided
      if (data.pin) {
        updateData.pin = data.pin;
      }

      // Allow ID update if changed
      if (id && id !== targetId) {
        // Check if new ID exists
        const exists = await prisma.employee.findUnique({ where: { id: id } });
        if (exists) return NextResponse.json({ error: 'ID already in use' }, { status: 400 });
        updateData.id = id;
      }
    } else {
      updateData = data;
    }

    const updatedEmployee = await prisma.employee.update({
      where: { id: targetId },
      data: updateData
    });

    return NextResponse.json(updatedEmployee);
  } catch (error: any) {
    const safeError = error || { message: 'Unknown error (null)' };
    console.error('API PATCH Error:', safeError);
    return NextResponse.json({ error: 'Failed to update employee', details: safeError?.message || String(safeError) }, { status: 500 });
  }
}
