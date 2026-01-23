// app/api/admin/products/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// 1. GET: Dipakai oleh POS & Admin Menu untuk ambil daftar menu terbaru
export async function GET() {
  try {
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' }, // Urutkan sesuai item terbaru (lebih aman)
    });
    return NextResponse.json(products);
  } catch (error) {
    return NextResponse.json({ error: "Gagal ambil menu" }, { status: 500 });
  }
}

// 2. POST: Dipakai Admin Menu untuk TAMBAH menu baru
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validasi sederhana
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
        isAvailable: true,
      },
    });

    return NextResponse.json(newProduct);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Gagal tambah menu" }, { status: 500 });
  }
}

// 3. PUT: Untuk Edit Menu / Ganti Status Ready
export async function PUT(request: Request) {
  try {
    const { id, ...data } = await request.json();
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: data,
    });
    return NextResponse.json(updatedProduct);
  } catch (error) {
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