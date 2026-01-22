import { prisma } from '@/lib/prisma';
import TicketUI from './TicketUI'; 
import { OrderItem } from '@/types/order';

// Definisikan tipe untuk props halaman dinamis, dengan params sebagai Promise
interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage(props: TicketPageProps) {
  // Terapkan workaround Next.js 15: await params dari props
  const params = await props.params;
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

  // 3. Render UI (Serialisasi data)
  const serializedOrder = {
    ...order,
    items: order.items as OrderItem[],
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
  };

  return <TicketUI order={serializedOrder} />;
}