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
      include: { branch: true, faceEmbeddings: true } // Fetch Face Embeddings
    });

    if (!employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    if (!employee.isActive) {
      return NextResponse.json({ error: 'Employee account is inactive' }, { status: 403 });
    }

    // --- FACE VERIFICATION LOGIC ---
    const { faceEmbedding } = body; // Array of numbers
    let faceScore = 0;

    // Require Face Embedding for security
    if (!faceEmbedding || !Array.isArray(faceEmbedding)) {
      return NextResponse.json({ error: 'Data wajah tidak valid. Harap update aplikasi.' }, { status: 400 });
    }

    const storedFaces = employee.faceEmbeddings;
    if (!storedFaces || storedFaces.length === 0) {
      return NextResponse.json({ error: 'Wajah Anda belum terdaftar di sistem. Hubungi Admin.' }, { status: 403 });
    }

    // Calculate Similarity
    // Helper function for Cosine Similarity
    const cosineSimilarity = (a: number[], b: number[]) => {
      let dotProduct = 0;
      let mA = 0;
      let mB = 0;
      for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        mA += a[i] * a[i];
        mB += b[i] * b[i];
      }
      mA = Math.sqrt(mA);
      mB = Math.sqrt(mB);
      return (mA === 0 || mB === 0) ? 0 : dotProduct / (mA * mB);
    };

    let maxScore = -1;
    const inputVector = faceEmbedding;

    for (const face of storedFaces) {
      const storedVector = face.embedding as number[];
      const score = cosineSimilarity(inputVector, storedVector);
      if (score > maxScore) maxScore = score;
    }

    faceScore = maxScore;
    console.log(`[Attendance] ${employee.name} Face Match Score: ${maxScore.toFixed(4)}`);

    const THRESHOLD = 0.80; // Slightly lower strictness for field conditions
    if (faceScore < THRESHOLD) {
      return NextResponse.json({
        error: 'Wajah tidak dikenali. Pastikan wajah terlihat jelas dan pencahayaan cukup.'
      }, { status: 401 });
    }

    // Device Fingerprint (Secondary Check - Log Only)
    let deviceWarning = null;
    if (!employee.deviceId) {
      await prisma.employee.update({
        where: { id: employee.id },
        data: { deviceId: deviceId }
      });
    } else if (employee.deviceId !== deviceId) {
      deviceWarning = 'Device mismatch (Logged). Face verified.';
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
        status: 'APPROVED',
        notes: `Face Confidence: ${(faceScore * 100).toFixed(2)}%`
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
