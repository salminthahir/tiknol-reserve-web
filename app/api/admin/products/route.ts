import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = 'nodejs';

// 1. GET: Dipakai oleh POS & Admin Menu untuk ambil daftar menu terbaru
//    Supports optional ?branchId= for branch-specific pricing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const branchId = searchParams.get('branchId');

    // Build the query dynamically
    const includeConfig = branchId
      ? {
        productBranches: {
          where: { branchId },
          select: { branchId: true, branchPrice: true, isAvailable: true }
        }
      }
      : {
        productBranches: {
          select: { branchId: true, branchPrice: true, isAvailable: true }
        }
      };

    const products = await (prisma as any).product.findMany({
      orderBy: { createdAt: 'desc' },
      include: includeConfig
    });

    // If branchId provided, transform price to use branch-specific override
    if (branchId) {
      const mapped = products.map((p: any) => {
        const pb = p.productBranches?.[0];
        return {
          ...p,
          price: pb?.branchPrice ?? p.price,
          isAvailable: pb?.isAvailable ?? true,
          productBranches: p.productBranches
        };
      });
      return NextResponse.json(mapped);
    }

    return NextResponse.json(products);
  } catch (error: any) {
    console.error("Error fetching products:", String(error));
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Gagal mengambil data menu.", details: errorMessage },
      { status: 500 }
    );
  }
}

// 2. POST: Dipakai Admin Menu untuk TAMBAH menu baru
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.name || !body.price) {
      return NextResponse.json({ error: "Nama dan Harga wajib diisi" }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        name: body.name,
        price: Number(body.price),
        category: body.category,
        image: body.image || "",
        description: body.description || "",
        hasCustomization: body.hasCustomization || false,
        customizationOptions: body.customizationOptions || null,
      },
    });

    // Create ProductBranch records based on payload OR default to all active branches (safe default)
    try {
      const activeBranches = await (prisma as any).branch.findMany({
        where: { isActive: true },
        select: { id: true }
      });

      if (activeBranches.length > 0) {
        const productBranchesData = activeBranches.map((b: any) => {
          // Check if specific config was sent
          const config = body.productBranches?.find((pb: any) => pb.branchId === b.id);

          return {
            productId: newProduct.id,
            branchId: b.id,
            // Use config if exists, otherwise default to FALSE (fix for showing in all branches)
            isAvailable: config ? config.isAvailable : false,
            branchPrice: config?.branchPrice ? Number(config.branchPrice) : null
          };
        });

        await (prisma as any).productBranch.createMany({
          data: productBranchesData,
          skipDuplicates: true
        });
      }
    } catch (branchErr) {
      console.warn("Could not create ProductBranch records:", branchErr);
    }

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal tambah menu" }, { status: 500 });
  }
}

// 3. PUT: Untuk Edit Menu / Ganti Status Ready / Set Branch Price
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, branchId, branchPrice, ...data } = body;

    // If updating branch-specific price
    if (branchId !== undefined) {
      await (prisma as any).productBranch.upsert({
        where: {
          productId_branchId: { productId: id, branchId }
        },
        update: {
          branchPrice: branchPrice !== null && branchPrice !== undefined ? Number(branchPrice) : null,
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true
        },
        create: {
          productId: id,
          branchId,
          branchPrice: branchPrice !== null && branchPrice !== undefined ? Number(branchPrice) : null,
          isAvailable: data.isAvailable !== undefined ? data.isAvailable : true
        }
      });

      // Also update base product fields if provided
      if (data.name || data.price || data.category || data.image !== undefined) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.price) updateData.price = Number(data.price);
        if (data.category) updateData.category = data.category;
        if (data.image !== undefined) updateData.image = data.image;
        if (data.hasCustomization !== undefined) updateData.hasCustomization = data.hasCustomization;
        if (data.customizationOptions !== undefined) updateData.customizationOptions = data.customizationOptions;

        if (Object.keys(updateData).length > 0) {
          await prisma.product.update({ where: { id }, data: updateData });
        }
      }

      const updated = await (prisma as any).product.findUnique({
        where: { id },
        include: {
          productBranches: {
            select: { branchId: true, branchPrice: true, isAvailable: true }
          }
        }
      });

      return NextResponse.json(updated);
    }

    // Standard product update (no branch context)
    // Remove isAvailable from data because it no longer exists on Product model
    const { isAvailable, ...productData } = data;

    const updatedProduct = await prisma.product.update({
      where: { id },
      data: productData,
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "Gagal update" }, { status: 500 });
  }
}

// 4. DELETE: Untuk Hapus Menu
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal hapus" }, { status: 500 });
  }
}