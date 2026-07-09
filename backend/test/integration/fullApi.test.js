const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });

const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const request = require('supertest');

const { createApp } = require('../../app');
const {
    assertSafeTestDatabase,
    connectDatabase,
    disconnectDatabase,
} = require('../../config/database');
const User = require('../../models/User');
const Order = require('../../models/Order');

const testUri = process.env.MONGO_TEST_URI;
const integration = testUri ? test : test.skip;

integration('complete API workflow uses only the guarded test database', async (t) => {
    assertSafeTestDatabase(testUri);
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';
    process.env.WHATSAPP_TOKEN = 'integration-verify-token';
    process.env.WHATSAPP_APP_SECRET = 'integration-app-secret';
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    await connectDatabase({ uri: testUri, testMode: true });
    await User.db.dropDatabase();
    t.after(async () => {
        assertSafeTestDatabase(testUri);
        await User.db.dropDatabase();
        await disconnectDatabase();
    });

    const app = createApp({ disableRateLimit: true, quiet: true });
    const runId = `${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const adminEmail = `admin-${runId}@test.local`;
    const userEmail = `customer-${runId}@test.local`;
    const password = 'TestPass123!';

    await User.create({
        name: 'Integration Admin',
        email: adminEmail,
        password,
        role: 'admin',
    });

    const adminLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: adminEmail, password })
        .expect(200);
    const adminToken = adminLogin.body.token;
    const adminAuth = { Authorization: `Bearer ${adminToken}` };

    const registration = await request(app)
        .post('/api/auth/register')
        .send({
            name: 'Integration Customer',
            email: userEmail,
            password,
            phone: `+92300${String(Date.now()).slice(-7)}`,
            address: 'Test address',
        })
        .expect(201);
    const userToken = registration.body.token;
    const userAuth = { Authorization: `Bearer ${userToken}` };

    await request(app).get('/api/auth/me').set(userAuth).expect(200);
    await request(app).get('/api/users').set(userAuth).expect(401);
    await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: `missing-${runId}@test.local` })
        .expect(200);

    const category = await request(app)
        .post('/api/categories')
        .set(adminAuth)
        .send({ name: `Test Category ${runId}`, image: 'https://example.com/category.jpg' })
        .expect(201);
    await request(app).get('/api/categories').expect(200);

    const product = await request(app)
        .post('/api/products')
        .set(adminAuth)
        .send({
            name: `Test Milk ${runId}`,
            description: 'Integration test grocery product',
            price: 250,
            stock: 20,
            category: category.body._id,
            imageUrl: 'https://example.com/product.jpg',
            isFeatured: true,
            variants: [{ unit: '1L', price: 250, stock: 10 }],
        })
        .expect(201);
    const productId = product.body._id;
    await request(app).get(`/api/products/${productId}`).expect(200);
    await request(app).get('/api/products/search').query({ q: 'Milk' }).expect(200);
    await request(app).get('/api/products/admin').set(adminAuth).expect(200);

    await request(app)
        .put('/api/settings/store')
        .set(adminAuth)
        .send({
            isStoreOpen: true,
            minimumOrderAmount: 0,
            deliveryFee: 50,
            freeDeliveryAbove: 1000,
            enableDeliverySlots: false,
        })
        .expect(200);
    await request(app).get('/api/settings/store').expect(200);

    const address = await request(app)
        .post('/api/users/addresses')
        .set(userAuth)
        .send({
            label: 'Home',
            street: 'Street 1',
            area: 'Test Area',
            city: 'Gojra',
            phone: '+923001234567',
            isDefault: true,
        })
        .expect(201);
    assert.equal(address.body.addresses.length, 1);
    await request(app).post(`/api/users/wishlist/${productId}`).set(userAuth).expect(200);

    const promo = await request(app)
        .post('/api/promos')
        .set(adminAuth)
        .send({
            code: `TEST${String(Date.now()).slice(-6)}`,
            description: 'Integration promo',
            discountType: 'fixed',
            discountValue: 25,
            minOrderAmount: 100,
        })
        .expect(201);
    await request(app)
        .post('/api/promos/validate')
        .set(userAuth)
        .send({ code: promo.body.code, itemsPrice: 250 })
        .expect(200);

    const orderPayload = {
        orderItems: [{
            product: productId,
            name: product.body.name,
            qty: 1,
            image: product.body.imageUrl,
            price: 250,
            variant: '1L',
        }],
        shippingAddress: {
            street: 'Street 1',
            area: 'Test Area',
            city: 'Gojra',
            phone: '+923001234567',
        },
        paymentMethod: 'COD',
        promoCode: promo.body.code,
        location: { latitude: 31.15, longitude: 72.68 },
    };
    await request(app)
        .post('/api/orders')
        .set(userAuth)
        .send({
            ...orderPayload,
            orderItems: [{ ...orderPayload.orderItems[0], price: 1 }],
        })
        .expect(400);
    await request(app)
        .post('/api/orders')
        .set(userAuth)
        .send({ ...orderPayload, paymentMethod: 'Card' })
        .expect(400);

    const order = await request(app)
        .post('/api/orders')
        .set(userAuth)
        .send(orderPayload)
        .expect(201);
    const orderId = order.body._id;
    await request(app).get('/api/orders/myorders').set(userAuth).expect(200);
    await request(app).get(`/api/orders/${orderId}`).set(userAuth).expect(200);
    await request(app).get(`/api/orders/${orderId}/reorder`).set(userAuth).expect(200);
    await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set(adminAuth)
        .send({ status: 'Delivered' })
        .expect(400);

    await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set(adminAuth)
        .send({ status: 'Confirmed' })
        .expect(200);
    await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set(adminAuth)
        .send({ status: 'Packing' })
        .expect(200);

    const rider = await request(app)
        .post('/api/riders')
        .set(adminAuth)
        .send({
            name: 'Integration Rider',
            phone: `+92311${String(Date.now()).slice(-7)}`,
            vehicleType: 'Motorcycle',
            vehicleNumber: 'TEST-001',
        })
        .expect(201);
    await request(app)
        .put(`/api/riders/assign/${orderId}`)
        .set(adminAuth)
        .send({ riderId: rider.body._id })
        .expect(200);
    await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set(adminAuth)
        .send({ status: 'Out for Delivery' })
        .expect(200);
    await request(app)
        .put(`/api/orders/${orderId}/status`)
        .set(adminAuth)
        .send({ status: 'Delivered' })
        .expect(200);

    const review = await request(app)
        .post('/api/reviews')
        .set(userAuth)
        .send({ productId, rating: 5, comment: 'Excellent integration product.' })
        .expect(201);
    await request(app)
        .put(`/api/reviews/admin/${review.body.review._id}`)
        .set(adminAuth)
        .send({ status: 'Approved' })
        .expect(200);
    await request(app).get(`/api/reviews/product/${productId}`).expect(200);

    await request(app)
        .post(`/api/inventory/${productId}/adjust`)
        .set(adminAuth)
        .send({
            type: 'Restock',
            quantity: 5,
            reason: 'Integration restock',
            lowStockThreshold: 3,
        })
        .expect(200);
    await request(app).get('/api/inventory/movements').set(adminAuth).expect(200);

    const ticket = await request(app)
        .post('/api/support')
        .set(userAuth)
        .send({
            subject: 'Integration support request',
            message: 'Please verify this test request.',
            category: 'order_issue',
            orderId,
        })
        .expect(201);
    await request(app)
        .put(`/api/support/${ticket.body._id}`)
        .set(adminAuth)
        .send({ status: 'Resolved', priority: 'Normal', adminReply: 'Resolved in integration test.' })
        .expect(200);
    await request(app).get('/api/support/my').set(userAuth).expect(200);

    await request(app)
        .post('/api/notifications/broadcast')
        .set(adminAuth)
        .send({ title: 'Integration notice', message: 'Automated test message', type: 'system' })
        .expect(201);
    const notifications = await request(app)
        .get('/api/notifications')
        .set(userAuth)
        .expect(200);
    assert.ok(notifications.body.notifications.length > 0);
    await request(app)
        .put(`/api/notifications/${notifications.body.notifications[0]._id}/read`)
        .set(userAuth)
        .expect(200);

    await request(app)
        .put('/api/layout/settings')
        .set(adminAuth)
        .send({ headerTitle: 'Integration Home' })
        .expect(200);
    const banner = await request(app)
        .post('/api/layout/banners')
        .set(adminAuth)
        .send({
            title: 'Integration Banner',
            imageUrl: 'https://example.com/banner.jpg',
            linkType: 'none',
        })
        .expect(201);
    await request(app)
        .put(`/api/layout/banners/${banner.body._id}`)
        .set(adminAuth)
        .send({ isActive: false })
        .expect(200);
    const section = await request(app)
        .post('/api/layout/sections')
        .set(adminAuth)
        .send({ title: 'Integration Section', type: 'grid', filterType: 'latest' })
        .expect(201);
    await request(app)
        .delete(`/api/layout/sections/${section.body._id}`)
        .set(adminAuth)
        .expect(200);
    await request(app).get('/api/layout/home').expect(200);

    const webhookPayload = {
        object: 'whatsapp_business_account',
        entry: [{
            changes: [{
                value: {
                    messages: [{
                        id: `wamid.${runId}`,
                        from: '+923001234567',
                        timestamp: String(Math.floor(Date.now() / 1000)),
                        type: 'text',
                        text: { body: 'Two milk packs please' },
                    }],
                },
            }],
        }],
    };
    const rawPayload = JSON.stringify(webhookPayload);
    const signature = `sha256=${crypto
        .createHmac('sha256', process.env.WHATSAPP_APP_SECRET)
        .update(rawPayload)
        .digest('hex')}`;
    await request(app)
        .post('/api/webhook')
        .set('Content-Type', 'application/json')
        .set('X-Hub-Signature-256', signature)
        .send(rawPayload)
        .expect(200);
    const whatsappOrders = await request(app)
        .get('/api/webhook/orders')
        .set(adminAuth)
        .expect(200);
    assert.equal(whatsappOrders.body.total, 1);
    await request(app)
        .put(`/api/webhook/orders/${whatsappOrders.body.orders[0]._id}`)
        .set(adminAuth)
        .send({ status: 'Converted', conversionNotes: 'Converted during integration test.' })
        .expect(200);

    await request(app).get('/api/analytics/dashboard').set(adminAuth).expect(200);
    await request(app).get('/api/reports/cash').set(adminAuth).expect(200);
    await request(app).get('/api/users').set(adminAuth).expect(200);
    await request(app).get('/api/products/low-stock').set(adminAuth).expect(200);
    await request(app)
        .post('/api/upload')
        .set(adminAuth)
        .attach('image', Buffer.from('not an image'), {
            filename: 'invalid.txt',
            contentType: 'text/plain',
        })
        .expect(400);

    const cancelledOrder = await request(app)
        .post('/api/orders')
        .set(userAuth)
        .send({ ...orderPayload, promoCode: '' })
        .expect(201);
    await request(app)
        .put(`/api/orders/${cancelledOrder.body._id}/cancel`)
        .set(userAuth)
        .send({ reason: 'Integration cancellation' })
        .expect(200);
    const storedCancelled = await Order.findById(cancelledOrder.body._id);
    assert.equal(storedCancelled.status, 'Cancelled');
});
