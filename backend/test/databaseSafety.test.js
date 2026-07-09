const test = require('node:test');
const assert = require('node:assert/strict');
const {
    getDatabaseName,
    assertSafeTestDatabase,
} = require('../config/database');

test('extracts database names from MongoDB connection strings', () => {
    assert.equal(
        getDatabaseName('mongodb+srv://user:pass@example.mongodb.net/gojra_emart_test?retryWrites=true'),
        'gojra_emart_test'
    );
});

test('accepts only explicitly named test databases', () => {
    assert.equal(
        assertSafeTestDatabase('mongodb://localhost:27017/gojra_emart_test'),
        'gojra_emart_test'
    );
    assert.throws(
        () => assertSafeTestDatabase('mongodb://localhost:27017/gojra_emart'),
        /must end in "_test"/
    );
    assert.throws(
        () => assertSafeTestDatabase('mongodb://localhost:27017/'),
        /must end in "_test"/
    );
});
