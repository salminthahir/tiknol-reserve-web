// types/order.ts

// Definisi untuk satu item di dalam pesanan
export interface OrderItem {
  id: number; // ID unik dari menu item
  name: string;
  qty: number;
  price: number;
}

// Definisi untuk keseluruhan objek Order, sesuai dengan schema.prisma
export interface Order {
  id: string;
  customerName: string;
  whatsapp: string;
  totalAmount: number;
  items: OrderItem[]; // Menggunakan tipe OrderItem[] bukan `any` atau `Json`
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  snapToken: string | null;
  createdAt: string; // Tipe data tanggal menjadi string saat dikirim dari server
  updatedAt: string;
}
