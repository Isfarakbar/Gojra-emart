const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, firebasePhoneLogin, forgotPassword, verifyOTP, resetPassword } = require('../controllers/authController');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.post('/phone', firebasePhoneLogin);

// Password recovery routes
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
