import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const settings = await prisma.settings.findFirst();
        return NextResponse.json(settings || {
            storeName: 'Nol Coffee',
            storeAddress: '',
            storePhone: '',
            adminName: 'Super Admin',
            officeLatitude: 0,
            officeLongitude: 0,
            maxRadius: 100
        });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            storeName,
            storeAddress,
            storePhone,
            adminName,
            officeLatitude,
            officeLongitude,
            maxRadius
        } = body;

        // Upsert mechanism: update if exists, create if not
        const firstSetting = await prisma.settings.findFirst();

        const updateData: any = {};

        // Only include fields that are provided
        if (storeName !== undefined) updateData.storeName = storeName;
        if (storeAddress !== undefined) updateData.storeAddress = storeAddress;
        if (storePhone !== undefined) updateData.storePhone = storePhone;
        if (adminName !== undefined) updateData.adminName = adminName;
        if (officeLatitude !== undefined) updateData.officeLatitude = parseFloat(officeLatitude);
        if (officeLongitude !== undefined) updateData.officeLongitude = parseFloat(officeLongitude);
        if (maxRadius !== undefined) updateData.maxRadius = parseFloat(maxRadius);

        let settings;
        if (firstSetting) {
            settings = await prisma.settings.update({
                where: { id: firstSetting.id },
                data: updateData
            });
        } else {
            settings = await prisma.settings.create({
                data: {
                    storeName: storeName || 'Nol Coffee',
                    storeAddress: storeAddress || null,
                    storePhone: storePhone || null,
                    adminName: adminName || 'Super Admin',
                    officeLatitude: parseFloat(officeLatitude) || 0,
                    officeLongitude: parseFloat(officeLongitude) || 0,
                    maxRadius: parseFloat(maxRadius) || 100
                }
            });
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Settings API Error:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
