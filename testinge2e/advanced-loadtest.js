/**
 * ======================================================
 *  ADVANCED LOAD TEST — Titik Nol Reserve
 *  Engine: K6 (https://k6.io)
 * ======================================================
 *
 *  Jalankan:
 *    k6 run testinge2e/advanced-loadtest.js                       # Default (load)
 *    k6 run --env SCENARIO=smoke testinge2e/advanced-loadtest.js   # Smoke (ringan)
 *    k6 run --env SCENARIO=stress testinge2e/advanced-loadtest.js  # Stress (berat)
 *    k6 run --env SCENARIO=spike testinge2e/advanced-loadtest.js   # Spike (mendadak)
 *
 *  Custom config:
 *    k6 run --env BASE_URL=https://tiknol-reserve.vercel.app \
 *           --env BRANCH_ID=branch_xyz \
 *           testinge2e/advanced-loadtest.js
 *
 *  Skenario:
 *    1. Online Order → Midtrans Webhook (full E2E + SHA-512 signature)
 *    2. POS Cash Order burst (simulasi banyak kasir)
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import crypto from 'k6/crypto';

// ============= KONFIGURASI =============
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const BRANCH_ID = __ENV.BRANCH_ID || 'branch_head_office';
const MIDTRANS_SERVER_KEY = __ENV.SERVER_KEY || 'SB-Mid-server-v26lRJCZnUFufQXykfgpELCC';

// ============= CUSTOM METRICS =============
const ordersCreated = new Counter('orders_created');
const webhooksProcessed = new Counter('webhooks_processed');
const webhookSuccessRate = new Rate('webhook_success_rate');
const orderDuration = new Trend('order_creation_duration', true);
const webhookDuration = new Trend('webhook_processing_duration', true);
const e2eDuration = new Trend('e2e_order_to_paid_duration', true);

// ============= LOAD PROFILES =============
const scenarios = {
    smoke: {
        stages: [
            { duration: '10s', target: 2 },
            { duration: '20s', target: 2 },
            { duration: '5s', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95) < 5000'],
            http_req_failed: ['rate < 0.05'],
        },
    },
    load: {
        stages: [
            { duration: '30s', target: 10 },
            { duration: '1m', target: 20 },
            { duration: '30s', target: 20 },
            { duration: '15s', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95) < 3000'],
            http_req_failed: ['rate < 0.02'],
        },
    },
    stress: {
        stages: [
            { duration: '30s', target: 20 },
            { duration: '1m', target: 50 },
            { duration: '1m', target: 50 },
            { duration: '30s', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95) < 5000'],
            http_req_failed: ['rate < 0.05'],
        },
    },
    spike: {
        stages: [
            { duration: '10s', target: 5 },
            { duration: '5s', target: 100 },
            { duration: '30s', target: 100 },
            { duration: '10s', target: 0 },
        ],
        thresholds: {
            http_req_duration: ['p(95) < 8000'],
            http_req_failed: ['rate < 0.10'],
        },
    },
};

const activeScenario = __ENV.SCENARIO || 'load';
const config = scenarios[activeScenario] || scenarios.load;

export const options = {
    stages: config.stages,
    thresholds: {
        ...config.thresholds,
        webhook_success_rate: ['rate > 0.90'],
    },
};

// ============= HELPER: SHA-512 SIGNATURE (SYNC) =============
function generateSignature(orderId, statusCode, grossAmount, serverKey) {
    const input = `${orderId}${statusCode}${grossAmount}${serverKey}`;
    return crypto.sha512(input, 'hex');
}

// ============= HELPER: RANDOM DATA =============
function randomName() {
    const names = ['Budi', 'Sari', 'Andi', 'Dewi', 'Riko', 'Nina', 'Doni', 'Lina', 'Feri', 'Wati'];
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `LT_${names[Math.floor(Math.random() * names.length)]}_${suffix}`;
}

function randomPhone() {
    return `0812${Math.floor(Math.random() * 90000000 + 10000000)}`;
}

function randomItems() {
    const menu = [
        { id: 'lt-1', name: 'Americano', price: 22000 },
        { id: 'lt-2', name: 'Caffe Latte', price: 28000 },
        { id: 'lt-3', name: 'Cappuccino', price: 26000 },
        { id: 'lt-4', name: 'Es Teh Manis', price: 12000 },
        { id: 'lt-5', name: 'Matcha Latte', price: 30000 },
    ];

    const count = Math.floor(Math.random() * 3) + 1;
    const selected = [];
    for (let i = 0; i < count; i++) {
        const item = menu[Math.floor(Math.random() * menu.length)];
        selected.push({ ...item, qty: Math.floor(Math.random() * 2) + 1 });
    }
    return selected;
}

const headers = { 'Content-Type': 'application/json' };

// ============= MAIN TEST =============
export default function () {
    const items = randomItems();
    const subtotal = items.reduce((sum, i) => sum + (i.price * i.qty), 0);

    // 70% online order, 30% POS cash order
    if (Math.random() < 0.7) {
        testOnlineOrderWithWebhook(items, subtotal);
    } else {
        testCashOrder(items, subtotal);
    }

    sleep(Math.random() * 2 + 0.5);
}

// ============= SKENARIO 1: ONLINE ORDER → WEBHOOK (FULL E2E) =============
function testOnlineOrderWithWebhook(items, subtotal) {
    const e2eStart = Date.now();
    let orderId = '';

    // === STEP A: Create Order + Get Snap Token ===
    group('Online Order — Tokenizer', () => {
        const payload = JSON.stringify({
            customerName: randomName(),
            whatsapp: randomPhone(),
            items: items,
            orderType: Math.random() > 0.5 ? 'DINE_IN' : 'TAKEAWAY',
            branchId: BRANCH_ID,
            subtotal: subtotal,
            discountAmount: 0,
            voucherId: null,
        });

        const res = http.post(`${BASE_URL}/api/tokenizer`, payload, { headers, tags: { name: 'Tokenizer' } });

        orderDuration.add(res.timings.duration);

        const ok = check(res, {
            '[Tokenizer] Status 200': (r) => r.status === 200,
            '[Tokenizer] Has orderId': (r) => {
                try { return !!r.json().orderId; } catch { return false; }
            },
            '[Tokenizer] Has snapToken': (r) => {
                try { return !!r.json().token; } catch { return false; }
            },
        });

        if (ok) {
            try { orderId = res.json().orderId; ordersCreated.add(1); } catch { }
        } else {
            console.log(`❌ Tokenizer FAIL: ${res.status} ${res.body}`);
        }
    });

    if (!orderId) return;

    // Simulasi delay pembayaran user (1-3 detik)
    sleep(Math.random() * 2 + 1);

    // === STEP B: Simulate Midtrans Webhook (Settlement) ===
    group('Midtrans Webhook — Settlement', () => {
        const statusCode = '200';
        const grossAmount = `${subtotal}.00`;

        // Generate SHA-512 signature identik dengan yang dilakukan Midtrans
        const signature = generateSignature(orderId, statusCode, grossAmount, MIDTRANS_SERVER_KEY);

        const webhookPayload = JSON.stringify({
            order_id: orderId,
            transaction_status: 'settlement',
            fraud_status: 'accept',
            payment_type: 'qris',
            status_code: statusCode,
            gross_amount: grossAmount,
            signature_key: signature,
        });

        const res = http.post(`${BASE_URL}/api/notification`, webhookPayload, { headers, tags: { name: 'Webhook' } });

        webhookDuration.add(res.timings.duration);

        const ok = check(res, {
            '[Webhook] Status 200': (r) => r.status === 200,
            '[Webhook] Not 403 (sig valid)': (r) => r.status !== 403,
            '[Webhook] Not 500 (no crash)': (r) => r.status !== 500,
        });

        webhookSuccessRate.add(ok ? 1 : 0);
        if (ok) {
            webhooksProcessed.add(1);
            e2eDuration.add(Date.now() - e2eStart);
        } else {
            console.log(`❌ Webhook FAIL: ${res.status} ${res.body} (Order: ${orderId})`);
        }
    });
}

// ============= SKENARIO 2: POS CASH ORDER =============
function testCashOrder(items, subtotal) {
    group('POS Cash Order', () => {
        const payload = JSON.stringify({
            customerName: randomName(),
            whatsapp: randomPhone(),
            items: items,
            orderType: 'DINE_IN',
            paymentType: 'CASH',
            totalAmount: subtotal,
            subtotal: subtotal,
            discountAmount: 0,
        });

        // Staff session cookie — URL-encode the JSON to avoid invalid chars in cookie
        const sessionJson = JSON.stringify({
            userId: 'EMP-001',
            name: 'Load Test Staff',
            branchId: BRANCH_ID,
            role: 'STAFF',
        });
        const encodedSession = encodeURIComponent(sessionJson);

        const res = http.post(`${BASE_URL}/api/cash-order`, payload, {
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `staff_session=${encodedSession}`,
            },
            tags: { name: 'CashOrder' },
        });

        orderDuration.add(res.timings.duration);

        const ok = check(res, {
            '[Cash Order] Status 200/201': (r) => r.status === 200 || r.status === 201,
        });

        if (ok) {
            ordersCreated.add(1);
        } else {
            console.log(`❌ Cash Order FAIL: ${res.status} ${res.body}`);
        }
    });
}

// ============= LIFECYCLE =============
export function setup() {
    console.log(`\n${'═'.repeat(56)}`);
    console.log(`  🚀 TITIK NOL RESERVE — LOAD TEST`);
    console.log(`  📋 Scenario : ${activeScenario.toUpperCase()}`);
    console.log(`  🎯 Target   : ${BASE_URL}`);
    console.log(`  🏢 Branch   : ${BRANCH_ID}`);
    console.log(`  🔑 Server Key: ${MIDTRANS_SERVER_KEY.substring(0, 15)}...`);
    console.log(`${'═'.repeat(56)}\n`);

    // Verify server is reachable
    const res = http.get(`${BASE_URL}/`);
    if (res.status !== 200) {
        console.error('⛔ SERVER UNREACHABLE! Pastikan npm run dev sudah jalan.');
    } else {
        console.log('✅ Server reachable — Starting load test...\n');
    }

    // Verify SHA-512 signature generation works
    const testSig = generateSignature('TEST-001', '200', '50000.00', MIDTRANS_SERVER_KEY);
    console.log(`🔐 Signature test: ${testSig.substring(0, 32)}... (${testSig.length} chars)`);
    if (testSig.length !== 128) {
        console.error('⛔ SIGNATURE GENERATION ERROR! Check k6/crypto module.');
    }
}

export function teardown() {
    console.log(`\n${'═'.repeat(56)}`);
    console.log(`  📊 LOAD TEST SELESAI — ${activeScenario.toUpperCase()}`);
    console.log(`${'═'.repeat(56)}\n`);
}
