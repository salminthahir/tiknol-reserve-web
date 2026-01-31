
import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
        }

        // Validation: Check File Type
        if (!file.type.startsWith('image/')) {
            return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
        }

        // Validation: Check File Size (Max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            return NextResponse.json({ error: 'File size must be less than 2MB' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create unique filename
        // Sanitize original filename
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;

        // Ensure upload dir exists
        const uploadDir = path.join(process.cwd(), 'public/uploads');

        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            // Ignore if exists
        }

        const filepath = path.join(uploadDir, filename);
        await writeFile(filepath, buffer);

        // Return relative path for DB
        const relativePath = `/uploads/${filename}`;

        return NextResponse.json({ url: relativePath });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
