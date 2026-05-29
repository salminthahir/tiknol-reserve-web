import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { embeddings } = await request.json(); // Array of number[]

        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            return NextResponse.json({ error: 'No embeddings provided' }, { status: 400 });
        }

        // Average the embeddings to create a stable reference
        const numEmbeddings = embeddings.length;
        const vectorSize = embeddings[0].length;
        const avgEmbedding = new Array(vectorSize).fill(0);

        for (const emb of embeddings) {
            for (let i = 0; i < vectorSize; i++) {
                avgEmbedding[i] += emb[i];
            }
        }

        for (let i = 0; i < vectorSize; i++) {
            avgEmbedding[i] /= numEmbeddings;
        }

        // Save to DB
        const faceData = await prisma.faceEmbedding.create({
            data: {
                employeeId: id,
                embedding: avgEmbedding,
                label: 'primary'
            }
        });

        return NextResponse.json({ success: true, id: faceData.id });
    } catch (error) {
        console.error('Enrollment error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
