/**
 * ======================================================
 *  WEBHOOK STORM TEST — Simulasi Midtrans kirim banyak webhook sekaligus
 *  Engine: K6 (https://k6.io)
 * ======================================================
 *
 *  Jalankan:
 *    k6 run testinge2e/webhook-storm.js                     # Default (50 VU)
 *    k6 run --vus 100 --duration 30s testinge2e/webhook-storm.js  # Custom
 *
 *  Test ini menguji ketahanan endpoint /api/notification
 *  saat menerima banyak webhook notifikasi secara bersamaan.
 *  Setiap VU membuat order dulu, lalu langsung kirim webhook.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import crypto from 'k6/crypto';

// ============= KONFIGURASI =============
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const BRANCH_ID = __ENV.BRANCH_ID || 'branch_head_office';
const MIDTRANS_SERVER_KEY = __ENV.SERVER_KEY || 'SB-Mid-server-v26lRJCZnUFufQXykfgpELCC';

// ============= METRICS =============
const webhooksReceived = new Counter('webhooks_received');
const webhooksSuccess = new Counter('webhooks_success');
const webhooksFailed = new Counter('webhooks_failed');
const signatureValid = new Rate('signature_valid_rate');
const webhookLatency = new Trend('webhook_latency_ms', true);

// ============= OPTIONS =============
export const options = {
    stages: [
        { duration: '10s', target: 20 },  // Ramp up to 20
        { duration: '20s', target: 50 },  // Ramp to 50
        { duration: '30s', target: 50 },  // Sustain 50 concurrent webhooks
        { duration: '10s', target: 0 },   // Ramp down
    ],
    thresholds: {
        http_req_duration: ['p(95) < 5000'],  // 95% under 5s
        http_req_failed: ['rate < 0.05'],     // Less than 5% failures
        signature_valid_rate: ['rate > 0.95'],
    },
};

// ============= HELPERS =============
function generateSignature(orderId, statusCode, grossAmount) {
    const input = `${orderId}${statusCode}${grossAmount}${MIDTRANS_SERVER_KEY}`;
    return crypto.sha512(input, 'hex');
}

const headers = { 'Content-Type': 'application/json' };

// ============= MAIN =============
export default function () {
    // Step 1: Create a real order so webhook has something to update
    const name = `Storm_${Math.random().toString(36).substring(2, 8)}`;
    const items = [{ id: 's1', name: 'Storm Coffee', price: 20000, qty: 1 }];
    const subtotal = 20000;

    const orderRes = http.post(`${BASE_URL}/api/tokenizer`, JSON.stringify({
        customerName: name,
        whatsapp: `0812${Math.floor(Math.random() * 90000000 + 10000000)}`,
        items: items,
        orderType: 'DINE_IN',
        branchId: BRANCH_ID,
        subtotal: subtotal,
        discountAmount: 0,
        voucherId: null,
    }), { headers, tags: { name: 'CreateOrder' } });

    let orderId = '';
    if (orderRes.status === 200) {
        try { orderId = orderRes.json().orderId; } catch { }
    }

    if (!orderId) {
        console.log(`❌ Order creation failed: ${orderRes.status}`);
        return;
    }

    // Step 2: Fire webhook immediately (simulate burst)
    const statusCode = '200';
    const grossAmount = `${subtotal}.00`;
    const signature = generateSignature(orderId, statusCode, grossAmount);

    webhooksReceived.add(1);

    const res = http.post(`${BASE_URL}/api/notification`, JSON.stringify({
        order_id: orderId,
        transaction_status: 'settlement',
        fraud_status: 'accept',
        payment_type: 'qris',
        status_code: statusCode,
        gross_amount: grossAmount,
        signature_key: signature,
    }), { headers, tags: { name: 'WebhookStorm' } });

    webhookLatency.add(res.timings.duration);

    const ok = check(res, {
        'Webhook 200': (r) => r.status === 200,
        'Not 403': (r) => r.status !== 403,
        'Not 500': (r) => r.status !== 500,
    });

    signatureValid.add(res.status !== 403 ? 1 : 0);

    if (ok) {
        webhooksSuccess.add(1);
    } else {
        webhooksFailed.add(1);
        console.log(`❌ Webhook ${orderId}: ${res.status} ${res.body}`);
    }

    // Minimal delay between iterations
    sleep(0.2);
}

// ============= LIFECYCLE =============
export function setup() {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  ⚡ WEBHOOK STORM TEST`);
    console.log(`  🎯 Target: ${BASE_URL}/api/notification`);
    console.log(`  🔑 Key: ${MIDTRANS_SERVER_KEY.substring(0, 15)}...`);
    console.log(`${'═'.repeat(50)}\n`);

    // Verify server
    const res = http.get(`${BASE_URL}/`);
    if (res.status !== 200) {
        console.error('⛔ SERVER UNREACHABLE!');
    }

    // Verify signature
    const sig = generateSignature('TEST', '200', '10000.00');
    if (sig.length !== 128) {
        console.error('⛔ SIGNATURE ERROR!');
    } else {
        console.log('✅ Signature OK — Starting storm...\n');
    }
}

export function teardown() {
    console.log(`\n${'═'.repeat(50)}`);
    console.log(`  📊 WEBHOOK STORM COMPLETE`);
    console.log(`${'═'.repeat(50)}\n`);
}
