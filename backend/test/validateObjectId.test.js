const test = require('node:test');
const assert = require('node:assert/strict');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

test('rejects malformed MongoDB IDs with a 400 response', () => {
    let statusCode;
    let payload;
    const response = {
        status(code) {
            statusCode = code;
            return this;
        },
        json(body) {
            payload = body;
            return this;
        },
    };

    validateObjectIdParam('order ID')({}, response, () => {
        throw new Error('next should not be called');
    }, 'not-an-id');

    assert.equal(statusCode, 400);
    assert.deepEqual(payload, { message: 'Invalid order ID.' });
});

test('allows valid MongoDB IDs', () => {
    let nextCalled = false;
    validateObjectIdParam('product ID')({}, {}, () => {
        nextCalled = true;
    }, '507f1f77bcf86cd799439011');
    assert.equal(nextCalled, true);
});
