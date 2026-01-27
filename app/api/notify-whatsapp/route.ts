import { NextResponse } from "next/server";

// Pastikan Anda telah menambahkan FONNTE_API_TOKEN ke file .env Anda
const FONNTE_API_TOKEN = process.env.FONNTE_API_TOKEN;
const FONNTE_API_URL = "https://api.fonnte.com/send";

// Pastikan hanya ada satu deklarasi runtime dan dengan kutip
export const runtime = 'nodejs'; 

export async function POST(request: Request) {
  try {
    const { customerName, whatsapp, orderId, status, message } = await request.json();

    if (!FONNTE_API_TOKEN) {
      console.error("FONNTE_API_TOKEN is not set in environment variables.");
      return NextResponse.json({ success: false, error: "Server configuration error: Fonnet API token missing." }, { status: 500 });
    }
    
    // Siapkan FormData sesuai dengan dokumentasi Fonnet API
    const data = new FormData();
    data.append("target", whatsapp);
    data.append("message", message);
    data.append("countryCode", "62"); // Menggunakan countryCode 62 (Indonesia)

    // Log data yang akan dikirim (untuk debugging)
    console.log("--- Sending WA Notification via Fonnet ---");
    console.log(`Target: ${whatsapp}`);
    console.log(`Message: ${message}`);
    console.log(`Order ID: ${orderId}`);
    console.log(`Status: ${status}`);
    console.log(`Fonnet Auth Token (partial): ${FONNTE_API_TOKEN.substring(0, 5)}...`); // Log sebagian token untuk verifikasi
    console.log("------------------------------------------");

    const response = await fetch(FONNTE_API_URL, {
        method: "POST",
        mode: "cors", 
        headers: new Headers({
            Authorization: FONNTE_API_TOKEN,
        }),
        body: data,
    });

    const res = await response.json();

    if (response.ok && res.status === true) { 
      console.log("Fonnet API Response (Success):", res);
      return NextResponse.json({ success: true, message: "Notification sent successfully via Fonnet API." });
    } else {
      console.error("Fonnet API Response (Error):", res);
      return NextResponse.json({ success: false, error: res.reason || `Failed to send notification via Fonnet API. Fonnet HTTP Status: ${response.status}.` }, { status: 500 });
    }

  } catch (error) {
    console.error("Error in notify-whatsapp API route:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error during notification process." }, { status: 500 });
  }
}