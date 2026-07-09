const test = require('node:test');
const assert = require('node:assert/strict');
const {
    getKarachiClock,
    validateDeliveryDate,
    isStatusTransitionAllowed,
} = require('../utils/orderRules');

test('order statuses only move through the operational sequence', () => {
    assert.equal(isStatusTransitionAllowed('Placed', 'Confirmed'), true);
    assert.equal(isStatusTransitionAllowed('Confirmed', 'Packing'), true);
    assert.equal(isStatusTransitionAllowed('Packing', 'Out for Delivery'), true);
    assert.equal(isStatusTransitionAllowed('Out for Delivery', 'Delivered'), true);
    assert.equal(isStatusTransitionAllowed('Placed', 'Delivered'), false);
    assert.equal(isStatusTransitionAllowed('Delivered', 'Cancelled'), false);
});

test('active order stages can be cancelled but terminal stages cannot', () => {
    assert.equal(isStatusTransitionAllowed('Placed', 'Cancelled'), true);
    assert.equal(isStatusTransitionAllowed('Packing', 'Cancelled'), true);
    assert.equal(isStatusTransitionAllowed('Delivered', 'Cancelled'), false);
    assert.equal(isStatusTransitionAllowed('Cancelled', 'Confirmed'), false);
});

test('delivery dates use Pakistan time and enforce booking range', () => {
    const now = Date.parse('2026-07-08T20:30:00.000Z');
    assert.equal(getKarachiClock(now).toISOString(), '2026-07-09T01:30:00.000Z');
    assert.equal(validateDeliveryDate('2026-07-09', 3, now), '2026-07-09');
    assert.equal(validateDeliveryDate('2026-07-11', 3, now), '2026-07-11');
    assert.equal(validateDeliveryDate('2026-07-08', 3, now), null);
    assert.equal(validateDeliveryDate('2026-07-12', 3, now), null);
    assert.equal(validateDeliveryDate('09-07-2026', 3, now), null);
});
