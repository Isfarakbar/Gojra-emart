const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    const cookieToken = getCookieToken(req);

    if ((req.headers.authorization && req.headers.authorization.startsWith('Bearer')) || cookieToken) {
        try {
            token = cookieToken || req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            req.user = await User.findById(decoded.id).select('-password');
            if (!req.user) {
                return res.status(401).json({ message: 'Not authorized, user not found' });
            }
            next();
        } catch (error) {
            console.error('Auth Failed:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        console.error('Auth Failed: No Token');
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const getCookieToken = (req) => {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = Object.fromEntries(
        cookieHeader.split(';').map(cookie => {
            const [key, ...value] = cookie.trim().split('=');
            return [key, decodeURIComponent(value.join('='))];
        })
    );

    return cookies.adminToken || null;
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        console.log('Admin Access Granted');
        next();
    } else {
        console.error('Admin Access Denied');
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

module.exports = { protect, admin };
