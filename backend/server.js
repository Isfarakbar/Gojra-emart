require('dotenv').config();
require('./config/firebase');

const { createApp } = require('./app');
const { connectDatabase } = require('./config/database');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDatabase({ testMode: process.env.NODE_ENV === 'test' });
        console.log('MongoDB connected');
        const app = createApp();
        return app.listen(PORT, '0.0.0.0', () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Server startup failed:', error.message);
        process.exitCode = 1;
        return null;
    }
};

if (require.main === module) {
    startServer();
}

module.exports = { startServer };
