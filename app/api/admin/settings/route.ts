import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst();
        return NextResponse.json(settings || { officeLatitude: 0, officeLongitude: 0, maxRadius: 100 });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { officeLatitude, officeLongitude, maxRadius } = body;

        // Upsert mechanism: update if exists, create if not
        const firstSetting = await prisma.settings.findFirst();

        let settings;
        if (firstSetting) {
            settings = await prisma.settings.update({
                where: { id: firstSetting.id },
                data: {
                    officeLatitude: parseFloat(officeLatitude),
                    officeLongitude: parseFloat(officeLongitude),
                    maxRadius: parseFloat(maxRadius)
                }
            });
        } else {
            settings = await prisma.settings.create({
                data: {
                    officeLatitude: parseFloat(officeLatitude),
                    officeLongitude: parseFloat(officeLongitude),
                    maxRadius: parseFloat(maxRadius)
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
