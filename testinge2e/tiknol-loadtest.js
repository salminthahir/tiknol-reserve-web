import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // 10 Pembeli bersamaan
    { duration: '1m', target: 10 },
    { duration: '10s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95) < 3000'], 
    http_req_failed: ['rate < 0.01'], 
  },
};

export default function () {
  const randomText = Math.random().toString(36).substring(2, 7); 
  
  // Data Fiktif yang Dijamin Lolos Validasi Midtrans
  const randomName = `SQA_${randomText}`;
  const randomPhone = `0812${Math.floor(Math.random() * 9000000) + 1000000}`; // Format nomor Indo valid

  const params = {
    headers: { 'Content-Type': 'application/json' },
  };

  // --- LANGKAH A: SIMULASI BUKA WEB ---
  const resHome = http.get('https://tiknol-reserve.vercel.app/');
  check(resHome, { '1. Halaman Utama Terbuka': (r) => r.status === 200 });

  sleep(2);

  // --- LANGKAH B: SIMULASI CHECKOUT & DAPAT TOKEN ---
  const checkoutUrl = 'https://tiknol-reserve.vercel.app/api/tokenizer'; 
  
  // JSON ini sudah 100% cocok dengan Schema Prisma Anda
  const checkoutPayload = JSON.stringify({
    customerName: randomName,
    whatsapp: randomPhone,
    totalAmount: 40000, 
    items: [ // Prisma Json Type
      { id: 101, name: "TIKNOL KOPI", price: 20000, qty: 1 },
      { id: 102, name: "AMERICANO", price: 20000, qty: 1 }
    ]
  });

  const resCheckout = http.post(checkoutUrl, checkoutPayload, params);
  
  // Tangkap Order ID dari Database untuk dipakai di Langkah C
  let orderIdDariServer = "";
  if (resCheckout.status === 200 || resCheckout.status === 201) {
    const resBody = resCheckout.json();
    orderIdDariServer = resBody.orderId;
  }

  // Tampilkan pesan error ASLI jika gagal
  if (resCheckout.status !== 200 && resCheckout.status !== 201) {
    console.log(`GAGAL DAPAT TOKEN. Response Server: ${resCheckout.body}`);
  }

  check(resCheckout, {
    '2. Sukses Insert Order & Dapat Token (200)': (r) => r.status === 200 || r.status === 201,
  });

  sleep(3);

  // --- LANGKAH C: SIMULASI PEMBAYARAN SUKSES (WEBHOOK) ---
  if (orderIdDariServer !== "") {
    const webhookUrl = 'https://tiknol-reserve.vercel.app/api/notification'; 

    const midtransPayload = JSON.stringify({
      order_id: orderIdDariServer,
      transaction_status: "settlement",
      payment_type: "bank_transfer",
      va_numbers: [{ bank: "bca", va_number: "4105" + randomPhone }],
      gross_amount: "40000.00",
      status_code: "200"
    });

    const resWebhook = http.post(webhookUrl, midtransPayload, params);

    check(resWebhook, {
      '3. Update Database ke PAID (200)': (r) => r.status === 200,
    });
  }

  sleep(1);
}