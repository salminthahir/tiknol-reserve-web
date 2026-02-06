// types/order.ts

// Definisi untuk satu item di dalam pesanan
export interface OrderItem {
  id: string; // ID unik dari menu item
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
  subtotal?: number;
  discountAmount: number;
  items: OrderItem[];
  status: 'PENDING' | 'PAID' | 'PREPARING' | 'READY' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'EXPIRED';
  snapToken: string | null;
  voucherId: string | null;
  voucher?: {
    code: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}
