import { prisma } from '@/lib/prisma';
import TicketUI from './TicketUI'; 
import { OrderItem } from '@/types/order'; 

// Definisikan tipe untuk props halaman dinamis
interface TicketPageProps {
  params: {
    id: string;
  };
}

export default async function TicketPage({ params }: TicketPageProps) {
  const id = params?.id; 

  if (!id) {
    return <div className="p-10 text-center text-red-500 font-bold">Error: ID Tidak Ditemukan di URL</div>;
  }

  // 2. Ambil Data
  const order = await prisma.order.findUnique({
    where: { id: id },
  });

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-red-500">
        <h1 className="text-2xl font-bold">Order Tidak Ditemukan</h1>
        <p>ID: {id}</p>
      </div>
    );
  }

  // 3. Render UI (Pastikan order sesuai tipe yang diharapkan oleh TicketUI)
  // Prisma terkadang menghasilkan tipe Date, sementara komponen butuh string.
  // Kita konversi di sini untuk memastikan konsistensi.
  const serializedOrder = {
    ...order,
    items: order.items as OrderItem[], // Pastikan tipe items benar
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };

  return <TicketUI order={serializedOrder} />;
}