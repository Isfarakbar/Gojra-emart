const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');
const { verifySignature } = require('../controllers/webhookController');
const { createApp } = require('../app');

test('validates Meta webhook signatures using constant-time comparison', () => {
    const body = Buffer.from('{"object":"whatsapp_business_account"}');
    const secret = 'test-secret';
    const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;
    assert.equal(verifySignature(body, signature, secret), true);
    assert.equal(verifySignature(body, 'sha256=bad', secret), false);
    assert.equal(verifySignature(body, signature, ''), false);
});

test('returns explicit verification errors', async () => {
    process.env.WHATSAPP_TOKEN = 'verify-token';
    const app = createApp({ disableRateLimit: true, quiet: true });

    await request(app).get('/api/webhook').expect(400);
    await request(app)
        .get('/api/webhook')
        .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'wrong',
            'hub.challenge': '123',
        })
        .expect(403);
    const response = await request(app)
        .get('/api/webhook')
        .query({
            'hub.mode': 'subscribe',
            'hub.verify_token': 'verify-token',
            'hub.challenge': '123',
        })
        .expect(200);
    assert.equal(response.text, '123');
});

test('rejects unsigned webhook payloads before database access', async () => {
    process.env.WHATSAPP_APP_SECRET = 'test-secret';
    const app = createApp({ disableRateLimit: true, quiet: true });
    await request(app)
        .post('/api/webhook')
        .send({ object: 'whatsapp_business_account' })
        .expect(403);
});
