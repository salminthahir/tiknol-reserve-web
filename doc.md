# Dokumentasi Proyek "Titik Nol Reserve"

Dokumen ini memberikan penjelasan lengkap mengenai arsitektur, alur kerja, dan detail teknis dari proyek "Titik Nol Reserve". Tujuannya adalah untuk memudahkan developer selanjutnya dalam memahami, memelihara, dan mengembangkan proyek ini.

## 1. Gambaran Umum Proyek

**Titik Nol Reserve** adalah aplikasi web pemesanan online (online ordering system) yang dirancang untuk memungkinkan pelanggan memesan produk, melakukan pembayaran secara online, dan menerima tiket/struk digital. Aplikasi ini juga dilengkapi dengan dashboard admin untuk memantau dan mengelola pesanan yang masuk secara real-time.

**Fitur Utama:**
-   Pemesanan produk dengan data pelanggan.
-   Integrasi pembayaran online melalui Midtrans.
-   Notifikasi status pembayaran otomatis (webhook).
-   Halaman tiket digital dengan QR Code untuk validasi.
-   Dashboard admin real-time untuk manajemen pesanan.

## 2. Teknologi yang Digunakan

-   **Framework**: [Next.js](https://nextjs.org/) (v14+ dengan App Router)
-   **Bahasa**: [TypeScript](https://www.typescriptlang.org/)
-   **Database**: [PostgreSQL](https://www.postgresql.org/) (dihosting di [Supabase](https://supabase.com/))
-   **ORM**: [Prisma](https://www.prisma.io/)
-   **Pembayaran**: [Midtrans](https://midtrans.com/) (menggunakan Snap.js)
-   **Real-time**: [Supabase Realtime](https://supabase.com/docs/guides/realtime)
-   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
-   **Ikon**: [Lucide React](https://lucide.dev/)
-   **Linting**: ESLint

## 3. Alur Kerja (Workflows)

Aplikasi ini memiliki dua alur kerja utama:

### a. Alur Pelanggan (Pemesanan & Pembayaran)

1.  **Input Pesanan**: Pelanggan mengakses halaman menu, memilih item, lalu mengisi nama dan nomor WhatsApp.
2.  **Checkout**: Pelanggan menekan tombol "Checkout" (`CheckoutButton.tsx`).
3.  **API `/api/tokenizer`**: Frontend mengirim data pesanan ke endpoint ini.
    -   Server membuat pesanan baru di tabel `Order` dengan status `PENDING`.
    -   Server meminta `snapToken` ke Midtrans.
    -   Server menyimpan `snapToken` ke record pesanan tadi dan mengirimkannya kembali ke frontend.
4.  **Pembayaran**: Frontend menggunakan `snapToken` untuk membuka popup pembayaran Midtrans Snap.
5.  **Notifikasi Midtrans**: Setelah pembayaran selesai, Midtrans mengirim notifikasi ke API `/api/notification`.
    -   Server memverifikasi notifikasi.
    -   Status pesanan di database diubah menjadi `PAID` (atau `FAILED`).
6.  **Redirect ke Tiket**: Pelanggan diarahkan ke halaman `/ticket/[id]` untuk melihat struk digital.

### b. Alur Admin (Manajemen Pesanan)

1.  **Login**: Admin (dianggap sudah login, karena tidak ada sistem otentikasi formal) mengakses `/admin/dashboard`.
2.  **Fetch Data**: Dashboard (`admin/dashboard/page.tsx`) memanggil API `/api/admin/orders` untuk mengambil semua pesanan yang statusnya bukan `PENDING`.
3.  **Real-time Update**: Dashboard terhubung ke Supabase Realtime. Setiap ada perubahan pada tabel `Order` di database (misalnya, pesanan baru masuk dari Midtrans), Supabase akan mengirim sinyal dan dashboard akan otomatis memuat ulang data (`fetchOrders`).
4.  **Update Status**:
    -   Admin menekan tombol "Verifikasi & Masak" pada pesanan berstatus `PAID`.
    -   Frontend melakukan **Optimistic Update**: tampilan status diubah menjadi `PREPARING` secara instan.
    -   Di latar belakang, permintaan dikirim ke API `/api/admin/update-status` untuk mengubah status di database.
    -   Proses yang sama terjadi saat menekan "Selesai & Panggil" (status berubah menjadi `COMPLETED`).

## 4. Struktur Direktori & File Penting

```
titik-nol-reserve/
├── app/
│   ├── api/                 # Endpoint backend serverless
│   │   ├── admin/
│   │   │   ├── orders/route.ts       # [GET] Mengambil pesanan untuk admin
│   │   │   └── update-status/route.ts # [POST] Mengubah status pesanan
│   │   ├── notification/route.ts   # [POST] Menerima webhook dari Midtrans
│   │   └── tokenizer/route.ts      # [POST] Membuat order & token Midtrans
│   ├── admin/
│   │   └── dashboard/page.tsx # Halaman UI Dashboard Admin
│   ├── ticket/
│   │   └── [id]/
│   │       ├── page.tsx      # Server component untuk fetch data tiket
│   │       └── TicketUI.tsx  # Client component untuk UI tiket & QR Code
│   ├── layout.tsx           # Layout utama aplikasi
│   ├── globals.css          # File CSS global (termasuk @tailwind)
│   └── page.tsx             # Halaman utama (beranda/menu)
├── components/
│   └── CheckoutButton.tsx   # Komponen tombol yang memicu alur checkout
├── lib/
│   ├── midtrans.ts          # Inisialisasi Midtrans Snap client
│   └── prisma.ts            # Inisialisasi Prisma client
├── prisma/
│   └── schema.prisma        # Definisi skema database
├── public/                    # Aset statis (gambar, ikon)
├── middleware.ts            # Middleware untuk redirect dari /menu ke /ticket
└── package.json             # Daftar dependensi dan skrip proyek
```

### Penjelasan Detail File Kunci

-   **`prisma/schema.prisma`**: Mendefinisikan struktur tabel `Order`.
    ```prisma
    model Order {
      id           String   @id @default(cuid())
      customerName String
      whatsapp     String
      totalAmount  Int
      items        Json     // Contoh: [{"name": "Kopi", "qty": 1, "price": 20000}]
      status       String   @default("PENDING") // PENDING, PAID, PREPARING, READY, COMPLETED, FAILED
      snapToken    String?
      createdAt    DateTime @default(now())
      updatedAt    DateTime @updatedAt
    }
    ```

-   **`middleware.ts`**: Sebuah optimasi. Jika pengguna mengakses `/menu?order_id=xxx`, mereka akan langsung di-redirect ke `/ticket/xxx` di sisi server, mengurangi waktu loading di client.

-   **`app/ticket/[id]/TicketUI.tsx`**: Komponen client-side yang sangat penting dengan logika:
    -   **Desain**: Mengusung gaya "Swiss Design" yang tipografis, menggunakan warna aksen berdasarkan status (`PAID`, `PENDING`, `FAILED`).
    -   **QR Code**: Menghasilkan QR Code yang berisi URL halaman tiket itu sendiri untuk validasi.
    -   **Resume Pembayaran**: Jika status pesanan masih `PENDING`, komponen ini akan memuat script Midtrans dan menampilkan tombol "Complete Payment Now" yang akan membuka kembali popup pembayaran.

-   **`app/admin/dashboard/page.tsx`**:
    -   **Real-time**: Menggunakan `supabase.channel()` untuk mendengarkan perubahan pada database. Ini membuat dashboard tidak perlu di-refresh manual.
    -   **Optimistic Updates**: Saat admin mengubah status, UI diperbarui secara instan tanpa menunggu konfirmasi server. Ini memberikan pengalaman pengguna yang sangat responsif. Jika gagal, data akan dikembalikan ke kondisi semula.

## 5. Konfigurasi & Environment

Proyek ini memerlukan beberapa variabel environment yang harus ada dalam file `.env.local`.

```bash
# Prisma / Supabase
DATABASE_URL="postgresql://..." # URL koneksi database dari Supabase (Connection Pooling)
DIRECT_URL="postgresql://..."   # URL koneksi langsung dari Supabase

# Midtrans
NEXT_PUBLIC_MIDTRANS_CLIENT_KEY="SB-Mid-client-..." # Client Key Midtrans (prefix "NEXT_PUBLIC_" agar bisa diakses di client)
MIDTRANS_SERVER_KEY="SB-Mid-server-..."             # Server Key Midtrans

# Supabase (untuk Realtime di Client)
NEXT_PUBLIC_SUPABASE_URL="https://xyz.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="ey..."
```

## 6. Cara Menjalankan Proyek

1.  **Install Dependensi**:
    ```bash
    npm install
    ```

2.  **Setup Database**:
    -   Pastikan URL database di `.env.local` sudah benar.
    -   Jalankan migrasi Prisma untuk membuat tabel di database.
    ```bash
    npx prisma migrate dev --name init
    ```

3.  **Jalankan Server Development**:
    ```bash
    npm run dev
    ```
    Aplikasi akan berjalan di `http://localhost:3000`.

## 7. Desain & Antarmuka

-   **Inspirasi**: "Swiss Design" dan Brutalism. Fokus pada tipografi yang kuat, kontras tinggi (hitam, putih, kuning), layout berbasis grid, dan elemen UI yang tegas (border tebal, shadow solid).
-   **Responsif**: Dibuat dengan pendekatan mobile-first menggunakan breakpoint Tailwind CSS.
-   **Pengalaman Pengguna (UX)**: Dirancang untuk alur yang cepat dan jelas. Penggunaan *Optimistic Update* di dashboard dan *Server-side Redirect* di `middleware` adalah contoh praktik UX yang baik.

---
Dokumen ini dibuat untuk memberikan pemahaman menyeluruh. Jika ada bagian yang kurang jelas, disarankan untuk memeriksa langsung kode sumber di file yang disebutkan.