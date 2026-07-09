const mongoose = require('mongoose');

const getDatabaseName = (uri) => {
    try {
        return new URL(uri).pathname.replace(/^\//, '').split('?')[0];
    } catch {
        return '';
    }
};

const assertSafeTestDatabase = (uri) => {
    const databaseName = getDatabaseName(uri);
    if (!databaseName || !databaseName.endsWith('_test')) {
        throw new Error('Test database name must end in "_test". Refusing to connect.');
    }
    return databaseName;
};

const connectDatabase = async ({ uri, testMode = false } = {}) => {
    const connectionUri = uri || (testMode ? process.env.MONGO_TEST_URI : process.env.MONGO_URI);
    if (!connectionUri) {
        throw new Error(testMode ? 'MONGO_TEST_URI is required.' : 'MONGO_URI is required.');
    }
    if (testMode) assertSafeTestDatabase(connectionUri);
    return mongoose.connect(connectionUri);
};

const disconnectDatabase = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }
};

module.exports = {
    getDatabaseName,
    assertSafeTestDatabase,
    connectDatabase,
    disconnectDatabase,
};
