import { prisma } from '@/lib/prisma';
import TicketUI from './TicketUI'; 
import { OrderItem } from '@/types/order';

export const runtime = 'edge';

interface TicketPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TicketPage(props: TicketPageProps) {
  const params = await props.params;
  const id = params?.id; 

  if (!id) {
    return <div className="p-10 text-center text-red-500 font-bold">Error: ID Tidak Ditemukan di URL</div>;
  }

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
    // FIX 1: Ubah JSON ke Array Items
    items: order.items as unknown as OrderItem[],
    
    // FIX 2: Ubah Date ke String
    createdAt: order.createdAt.toISOString(),
    updatedAt: order.updatedAt.toISOString(),
    
    // FIX 3 (YANG BIKIN ERROR): Paksa Status jadi 'any' biar TypeScript diam
    status: order.status as any,
    
    // FIX 4: Handle Null Token
    snapToken: order.snapToken || "",
  };

  return <TicketUI order={serializedOrder} />;
}
