import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { employeeId, type, photoBase64, latitude, longitude, deviceId } = body;

    if (!employeeId || !type || !photoBase64 || !deviceId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 1. Validate Employee & Device Binding
    const employee = await prisma.employee.findUnique({
      where: { id: employeeId },
      include: { branch: true } // Fetch Branch Info
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!employee.isActive) {
      return NextResponse.json({ error: 'Employee account is inactive' }, { status: 403 });
    }

    // Device Fingerprint Logic (MODIFIED: Warning instead of blocking)
    let deviceWarning = null;
    if (!employee.deviceId) {
      // First time login - Bind device
      await prisma.employee.update({
        where: { id: employee.id },
        data: { deviceId: deviceId }
      });
    } else if (employee.deviceId !== deviceId) {
      // Mismatch - ALLOW but warn
      deviceWarning = 'Anda masuk dari device lain. Hubungi admin jika ini bukan Anda.';
    }

    // 2. Validate Location (BRANCH BASED)
    const branch = employee.branch;
    if (branch && branch.latitude && branch.longitude) {
      const R = 6371e3; // metres
      const lat1 = branch.latitude * Math.PI / 180;
      const lat2 = latitude * Math.PI / 180;
      const deltaLat = (latitude - branch.latitude) * Math.PI / 180;
      const deltaLon = (longitude - branch.longitude) * Math.PI / 180;

      const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(deltaLon / 2) * Math.sin(deltaLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = R * c; // in meters

      const maxRadius = branch.maxRadius || 100;

      console.log(`[Attendance] ${employee.name} at ${distance.toFixed(2)}m from ${branch.name} (Max: ${maxRadius}m)`);

      if (distance > maxRadius) {
        return NextResponse.json({
          error: `Diluar jangkauan ${branch.name}. Jarak: ${Math.round(distance)}m (Max: ${maxRadius}m).`
        }, { status: 403 });
      }
    } else {
      // Fallback or Error if branch has no location set?
      // For now, let's allow but log warning or return error if strict.
      // Assuming all branches must have location.
      console.warn(`[Attendance] Branch ${branch?.name} has no location set. Skipping geofencing.`);
    }

    // 3. Process Image
    // Remove header data if present (e.g., "data:image/jpeg;base64,")
    const base64Data = photoBase64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, 'base64');

    const filename = `att-${employee.name.replace(/\s+/g, '_')}-${Date.now()}.jpg`;
    const uploadDir = path.join(process.cwd(), 'public/uploads/attendance');

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (e) {
      // Dir exists
    }

    const filepath = path.join(uploadDir, filename);
    await writeFile(filepath, buffer);
    const photoUrl = `/uploads/attendance/${filename}`;

    // 4. Create Attendance Record
    const attendance = await prisma.attendance.create({
      data: {
        employeeId,
        branchId: employee.branchId, // SAVE BRANCH ID
        type,
        timestamp: new Date(), // Server Time
        photoUrl,
        latitude,
        longitude,
        deviceId,
        status: 'APPROVED' // Auto-approve for now
      }
    });

    return NextResponse.json({
      success: true,
      attendance,
      message: type === 'CLOCK_IN' ? `Selamat bekerja, ${employee.name}!` : `Terima kasih, ${employee.name}. Hati-hati di jalan!`,
      warning: deviceWarning
    });

  } catch (error) {
    console.error('Clock In Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
