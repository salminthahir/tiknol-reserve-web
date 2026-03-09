
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

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
        const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${Date.now()}-${safeName}`;

        // Upload to Supabase Storage (Bucket: product-images)
        const { data: uploadData, error: uploadError } = await supabaseAdmin
            .storage
            .from('product-images')
            .upload(filename, buffer, {
                contentType: file.type,
                upsert: false
            });

        if (uploadError) {
            console.error('Supabase Upload Error:', uploadError);
            return NextResponse.json({ error: 'Failed to upload to storage' }, { status: 500 });
        }

        // Get Public URL
        const { data: { publicUrl } } = supabaseAdmin
            .storage
            .from('product-images')
            .getPublicUrl(filename);

        return NextResponse.json({ url: publicUrl });

    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
