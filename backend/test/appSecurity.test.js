const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { createApp } = require('../app');

const app = createApp({ disableRateLimit: true, quiet: true });

test('health endpoint responds and disabled payment surface is absent', async () => {
    await request(app).get('/').expect(200);
    const paymentResponse = await request(app)
        .post('/api/payments/create-payment-intent')
        .send({});
    assert.equal(paymentResponse.status, 404);
});

test('rejects disallowed browser origins with 403', async () => {
    await request(app)
        .options('/api/products')
        .set('Origin', 'https://attacker.invalid')
        .set('Access-Control-Request-Method', 'GET')
        .expect(403);
});

test('rejects oversized JSON bodies', async () => {
    await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send({ payload: 'x'.repeat(1024 * 1024 + 1) })
        .expect(413);
});

test('protects admin and customer-private routes', async () => {
    await request(app).get('/api/orders').expect(401);
    await request(app).get('/api/users/profile').expect(401);
    await request(app).get('/api/inventory').expect(401);
    await request(app).get('/api/webhook/orders').expect(401);
});
