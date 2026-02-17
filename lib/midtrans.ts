// lib/midtrans.ts

const IS_PRODUCTION = false;
const SNAP_URL = IS_PRODUCTION
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

const CORE_API_URL = IS_PRODUCTION
  ? 'https://api.midtrans.com/v2'
  : 'https://api.sandbox.midtrans.com/v2';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";

export const snap = {
  createTransaction: async (parameter: any) => {
    const authString = btoa(`${SERVER_KEY}:`);

    const response = await fetch(SNAP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(parameter),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error_messages?.join(', ') || 'Midtrans API Error');
    }

    return response.json(); // Mengembalikan { token, redirect_url }
  },

  checkTransactionStatus: async (orderId: string) => {
    const authString = btoa(`${SERVER_KEY}:`);
    const url = `${CORE_API_URL}/${orderId}/status`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
    });

    if (!response.ok) {
      // 404 means transaction not found (maybe not created yet)
      if (response.status === 404) return null;
      throw new Error('Failed to check transaction status');
    }

    return response.json();
  }
};
