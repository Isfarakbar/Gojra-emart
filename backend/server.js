require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('./config/firebase'); // Initialize Firebase Admin SDK

const app = express();
app.set('trust proxy', 1);

const configuredOrigins = (process.env.ALLOWED_ORIGINS || process.env.ADMIN_PANEL_URL || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

const developmentOrigins = process.env.NODE_ENV === 'production'
    ? []
    : ['http://localhost:3000', 'http://localhost:3001'];

const allowedOrigins = [...new Set([...configuredOrigins, ...developmentOrigins])];

app.use(cors({
    origin: function (origin, callback) {
        // Mobile apps generally send no browser Origin header.
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Middleware
app.use(helmet());
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 300,
    standardHeaders: true,
    legacyHeaders: false,
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request Logger
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('✅ MongoDB Connected'))
    .catch(err => {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    });

// Routes
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const orderRoutes = require('./routes/orderRoutes');
const webhookRoutes = require('./routes/webhookRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const layoutRoutes = require('./routes/layoutRoutes');
const storeSettingsRoutes = require('./routes/storeSettingsRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/users', userRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/layout', layoutRoutes);
app.use('/api/settings', storeSettingsRoutes);
app.use('/api/reports', reportRoutes);

// Health check
app.get('/', (req, res) => {
    res.json({ message: 'Gojra E-Mart API is running ✅', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: `Route ${req.url} not found` });
});

// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Global Error:', err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));
