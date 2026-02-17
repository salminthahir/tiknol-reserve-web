import crypto from 'crypto';

const MERCHANT_CODE = process.env.DUITKU_MERCHANT_CODE || "";
const MERCHANT_KEY = process.env.DUITKU_MERCHANT_KEY || "";
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Duitku Endpoints
const ENDPOINTS = {
    inquiry: IS_PRODUCTION
        ? 'https://passport.duitku.com/webapi/api/merchant/v2/inquiry'
        : 'https://sandbox.duitku.com/webapi/api/merchant/v2/inquiry',
    checkTransaction: IS_PRODUCTION
        ? 'https://passport.duitku.com/webapi/api/merchant/transactionStatus'
        : 'https://sandbox.duitku.com/webapi/api/merchant/transactionStatus'
};

export const duitku = {
    // Generate Signature for Request Transaction: MD5(merchantCode + merchantOrderId + amount + apiKey)
    createRequestSignature: (merchantOrderId: string, amount: number) => {
        const signatureString = `${MERCHANT_CODE}${merchantOrderId}${amount}${MERCHANT_KEY}`;
        return crypto.createHash('md5').update(signatureString).digest('hex');
    },

    // Generate Signature for Check Transaction: MD5(merchantCode + merchantOrderId + apiKey)
    createCheckStatusSignature: (merchantOrderId: string) => {
        const signatureString = `${MERCHANT_CODE}${merchantOrderId}${MERCHANT_KEY}`;
        return crypto.createHash('md5').update(signatureString).digest('hex');
    },

    // Validate Callback Signature: MD5(merchantCode + amount + merchantOrderId + apiKey)
    // Note: Parameter order is slightly different from Request!
    validateCallbackSignature: (merchantOrderId: string, amount: number, signature: string) => {
        // Duitku callback usually sends amount as string, ensure it matches
        const signatureString = `${MERCHANT_CODE}${amount}${merchantOrderId}${MERCHANT_KEY}`;
        const calculatedSignature = crypto.createHash('md5').update(signatureString).digest('hex');
        return calculatedSignature === signature;
    },

    // Request Payment URL
    requestPayment: async (params: {
        merchantOrderId: string;
        amount: number;
        paymentMethod: string;
        productDetails: string;
        customerVaName: string;
        email: string;
        phoneNumber: string;
        callbackUrl: string;
        returnUrl: string;
    }) => {
        const amountInt = Math.floor(params.amount); // Ensure integer
        const signatureString = `${MERCHANT_CODE}${params.merchantOrderId}${amountInt}${MERCHANT_KEY}`;
        const signature = crypto.createHash('md5').update(signatureString).digest('hex');

        console.log("[Duitku] Signature String:", signatureString); // DEBUG SIGNATURE

        const payload = {
            merchantCode: MERCHANT_CODE,
            paymentAmount: amountInt,
            paymentMethod: params.paymentMethod,
            merchantOrderId: params.merchantOrderId,
            productDetails: params.productDetails,
            additionalParam: '',
            merchantUserInfo: '',
            customerVaName: params.customerVaName,
            email: params.email,
            phoneNumber: params.phoneNumber,
            // itemDetails: [], // Optional item details
            customerDetail: {
                firstName: params.customerVaName,
                email: params.email,
                phoneNumber: params.phoneNumber,
            },
            callbackUrl: params.callbackUrl,
            returnUrl: params.returnUrl, // Where to redirect after payment
            signature: signature,
            expiryPeriod: 60 // Expire in 60 minutes
        };

        try {
            console.log("[Duitku] Request Payload:", JSON.stringify(payload, null, 2)); // DEBUG LOG

            const response = await fetch(ENDPOINTS.inquiry, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            console.log("[Duitku] Response:", result); // DEBUG LOG

            if (!response.ok || result.statusCode !== "00") { // Duitku might return 200 OK but with statusCode != 00
                throw new Error(result.statusMessage || `Duitku API Error: ${result.statusCode}`);
            }

            return result;
        } catch (error) {
            console.error("[Duitku] Request Error:", error);
            throw error;
        }
    },

    // Check Transaction Status
    checkTransaction: async (merchantOrderId: string) => {
        const signature = duitku.createCheckStatusSignature(merchantOrderId);

        const payload = {
            merchantCode: MERCHANT_CODE,
            merchantOrderId: merchantOrderId,
            signature: signature
        };

        try {
            const response = await fetch(ENDPOINTS.checkTransaction, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            return await response.json();
        } catch (error) {
            console.error("Duitku Check Status Error:", error);
            throw error;
        }
    },

    // Get Payment Methods
    getPaymentMethods: async (amount: number) => {
        const datetime = new Date().toISOString().slice(0, 19).replace('T', ' '); // Format: YYYY-MM-DD HH:mm:ss
        const signatureString = `${MERCHANT_CODE}${amount}${datetime}${MERCHANT_KEY}`;
        const signature = crypto.createHash('sha256').update(signatureString).digest('hex');

        const payload = {
            merchantcode: MERCHANT_CODE,
            amount: amount,
            datetime: datetime,
            signature: signature
        };

        const endpoint = IS_PRODUCTION
            ? 'https://passport.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod'
            : 'https://sandbox.duitku.com/webapi/api/merchant/paymentmethod/getpaymentmethod';

        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            return result.paymentFee; // Duitku returns array in 'paymentFee'
        } catch (error) {
            console.error("Duitku Get Payment Methods Error:", error);
            throw error;
        }
    }
};
