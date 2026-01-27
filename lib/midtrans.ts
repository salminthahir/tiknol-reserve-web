// lib/midtrans.ts

const IS_PRODUCTION = false;
const SNAP_URL = IS_PRODUCTION 
  ? 'https://app.midtrans.com/snap/v1/transactions' 
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

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
  }
};
