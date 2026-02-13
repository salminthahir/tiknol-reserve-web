import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst();
        return NextResponse.json(settings || {
            adminName: 'Super Admin'
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            adminName,
        } = body;

        // Upsert mechanism: update if exists, create if not
        const firstSetting = await prisma.settings.findFirst();

        const updateData: any = {};

        // Only include fields that are provided
        if (adminName !== undefined) updateData.adminName = adminName;

        let settings;
        if (firstSetting) {
            settings = await prisma.settings.update({
                where: { id: firstSetting.id },
                data: updateData
            });
        } else {
            settings = await prisma.settings.create({
                data: {
                    adminName: adminName || 'Super Admin',
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
