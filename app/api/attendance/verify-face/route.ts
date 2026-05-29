import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cosineSimilarity } from '@/lib/faceRecognition';

export async function POST(request: Request) {
    try {
        const { employeeId, embedding } = await request.json();

        if (!employeeId || !embedding) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // 1. Get stored embeddings
        const storedFaces = await prisma.faceEmbedding.findMany({
            where: { employeeId }
        });

        if (storedFaces.length === 0) {
            return NextResponse.json({ error: 'Wajah belum didaftarkan. Hubungi Admin.' }, { status: 404 });
        }

        // 2. Compare using Cosine Similarity
        // We check against ALL stored embeddings for this user and take the best match
        let maxScore = -1;

        // Convert client embedding object/array to simple array if needed
        const inputVector = Array.isArray(embedding) ? embedding : Object.values(embedding);

        for (const face of storedFaces) {
            const storedVector = face.embedding as number[];
            const score = cosineSimilarity(inputVector, storedVector);
            if (score > maxScore) maxScore = score;
        }

        console.log(`[FaceVerify] Employee ${employeeId} Match Score: ${maxScore.toFixed(4)}`);

        // 3. Threshold Decision
        // > 0.85 is generally a good match for 128-D dlib/face-api embeddings
        const THRESHOLD = 0.85;

        if (maxScore < THRESHOLD) {
            return NextResponse.json({
                verified: false,
                error: 'Wajah tidak dikenali. Coba lagi dengan pencahayaan yang baik.'
            }, { status: 401 });
        }

        return NextResponse.json({
            verified: true,
            score: maxScore
        });

    } catch (error) {
        console.error('Face verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
