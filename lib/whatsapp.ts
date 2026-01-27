// lib/whatsapp.ts

interface NotificationData {
  customerName: string;
  whatsapp: string;
  orderId: string;
  status: string;
  message: string;
}

// Gunakan NEXT_PUBLIC_APP_BASE_URL yang sudah kita set dengan https://
// Fallback ke http://localhost:3000 untuk pengembangan lokal jika NEXT_PUBLIC_APP_BASE_URL tidak ada
const APP_BASE_URL = process.env.NEXT_PUBLIC_APP_BASE_URL || "http://localhost:3000";


export async function sendWhatsAppNotification(data: NotificationData) {
  const targetUrl = `${APP_BASE_URL}/api/notify-whatsapp`;
  console.log(`[WhatsApp Notif] Attempting to fetch: ${targetUrl}`);
  console.log(`[WhatsApp Notif] Data to send:`, data);

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    console.log(`[WhatsApp Notif] Response status: ${response.status}`);
    if (!response.ok) {
      const errorData = await response.json();
      console.error("[WhatsApp Notif] Failed to send WhatsApp notification via API:", errorData);
      return false;
    }

    console.log("[WhatsApp Notif] WhatsApp notification request sent successfully to API.");
    return true;
  } catch (error) {
    console.error("[WhatsApp Notif] Error sending WhatsApp notification request (network/fetch issue):", error);
    return false;
  }
}
