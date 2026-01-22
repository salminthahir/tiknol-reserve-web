// lib/midtrans.ts
import midtransClient from 'midtrans-client'; // Pastikan sudah npm install midtrans-client

export const snap = new midtransClient.Snap({
  isProduction: false, // Ganti true jika nanti sudah live
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});

export const core = new midtransClient.CoreApi({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY,
});