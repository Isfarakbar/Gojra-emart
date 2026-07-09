const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const layoutRoutes = require('./routes/layoutRoutes');
const storeSettingsRoutes = require('./routes/storeSettingsRoutes');
const reportRoutes = require('./routes/reportRoutes');
const promoCodeRoutes = require('./routes/promoCodeRoutes');
const supportTicketRoutes = require('./routes/supportTicketRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const riderRoutes = require('./routes/riderRoutes');

const createApp = ({ disableRateLimit = false, quiet = false } = {}) => {
    const app = express();
    app.set('trust proxy', 1);

    const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.ADMIN_PANEL_URL || '')
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
    const developmentOrigins = process.env.NODE_ENV === 'production'
        ? []
        : [
            'http://localhost:3000',
            'http://localhost:3001',
            'http://127.0.0.1:3000',
            'http://127.0.0.1:3001',
        ];
    const allowedOrigins = [...new Set([...configuredOrigins, ...developmentOrigins])];

    app.use(cors({
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
            const error = new Error('Origin is not allowed by CORS');
            error.status = 403;
            return callback(error);
        },
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Hub-Signature-256'],
    }));

    app.use(helmet());
    if (!disableRateLimit) {
        app.use(rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 300,
            standardHeaders: true,
            legacyHeaders: false,
        }));
    }
    app.use(express.json({
        limit: '1mb',
        verify(req, res, buffer) {
            if (req.originalUrl.startsWith('/api/webhook')) {
                req.rawBody = Buffer.from(buffer);
            }
        },
    }));
    app.use(express.urlencoded({ extended: true, limit: '1mb' }));

    if (!quiet) {
        app.use((req, res, next) => {
            console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
            next();
        });
    }

    app.use('/api/auth', authRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/categories', categoryRoutes);
    app.use('/api/upload', uploadRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/webhook', webhookRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/notifications', notificationRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/layout', layoutRoutes);
    app.use('/api/settings', storeSettingsRoutes);
    app.use('/api/reports', reportRoutes);
    app.use('/api/promos', promoCodeRoutes);
    app.use('/api/support', supportTicketRoutes);
    app.use('/api/reviews', reviewRoutes);
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/riders', riderRoutes);

    app.get('/', (req, res) => {
        res.json({ message: 'Gojra E-Mart API is running', timestamp: new Date().toISOString() });
    });

    app.use((req, res) => {
        res.status(404).json({ message: `Route ${req.url} not found` });
    });

    app.use((err, req, res, next) => {
        if (!quiet) console.error('Global Error:', err.stack);
        res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
    });

    return app;
};

module.exports = { createApp };
