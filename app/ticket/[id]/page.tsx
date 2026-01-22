import { prisma } from '@/lib/prisma';
import TicketUI from './TicketUI'; 

// HAPUS SEMUA TIPE PROPS YANG MEMBINGUNGKAN, PAKAI ANY SEMENTARA BIAR JALAN DULU
export default async function TicketPage(props: any) {
  // 1. Akali Promise params (Next.js 15 Workaround)
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

  // 3. Render UI
  return <TicketUI order={order} />;
}