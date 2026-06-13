const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { registerUser, loginUser, googleLogin, firebasePhoneLogin, forgotPassword, verifyOTP, resetPassword, getMe, logoutUser } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts. Please try again later.' },
});

const otpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many OTP requests. Please try again later.' },
});

router.post('/register', registerUser);
router.post('/login', authLimiter, loginUser);
router.post('/google', authLimiter, googleLogin);
router.post('/phone', authLimiter, firebasePhoneLogin);

// Password recovery routes
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/verify-otp', otpLimiter, verifyOTP);
router.post('/reset-password', otpLimiter, resetPassword);
router.get('/me', protect, getMe);
router.post('/logout', logoutUser);

module.exports = router;
