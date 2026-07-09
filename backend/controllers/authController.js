const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');
const { getAuth } = require('firebase-admin/auth');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const setAuthCookie = (res, token) => {
    res.cookie('adminToken', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
    });
};

const clearAuthCookie = (res) => {
    res.clearCookie('adminToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { name, email, password, phone, address } = req.body;

    try {
        if (!name?.trim() || !email?.trim() || !password) {
            return res.status(400).json({ message: 'Name, email, and password are required.' });
        }

        if (password.length < 6) {
            return res.status(400).json({ message: 'Password must be at least 6 characters.' });
        }

        const normalizedEmail = email.trim().toLowerCase();
        const userExists = await User.findOne({ email: normalizedEmail });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name: name.trim(),
            email: normalizedEmail,
            password,
            phone,
            address
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        // Express 5 handles async errors, but we can also use next(error) or manual response
        console.error("Register Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.trim().toLowerCase() });

        if (user && (await user.matchPassword(password))) {
            if (user.accountStatus === 'Suspended') {
                return res.status(403).json({
                    code: 'ACCOUNT_SUSPENDED',
                    message: user.suspendedReason
                        ? `Your account is suspended: ${user.suspendedReason}`
                        : 'Your account has been suspended. Please contact support.',
                });
            }
            const token = generateToken(user._id);
            setAuthCookie(res, token);
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                token,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Google Login/Signup
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify Firebase ID token (sent from Flutter after Firebase Google Sign-In)
        const decodedToken = await getAuth().verifyIdToken(token);
        const { name, email, uid: googleId } = decodedToken;

        if (!email) {
            return res.status(400).json({ message: 'Google account email is required.' });
        }

        // Check if user exists
        let user = await User.findOne({ email: email.toLowerCase() });

        if (user) {
            // User exists - update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // New User - Create
            user = await User.create({
                name: name || 'New User',
                email: email.toLowerCase(),
                googleId,
                phone: '', // Can prompt user later
            });
        }

        if (user.accountStatus === 'Suspended') {
            return res.status(403).json({
                code: 'ACCOUNT_SUSPENDED',
                message: user.suspendedReason
                    ? `Your account is suspended: ${user.suspendedReason}`
                    : 'Your account has been suspended. Please contact support.',
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            token: generateToken(user._id),
        });

    } catch (error) {
        console.error("Google Auth Error:", error.code, error.message);
        console.error("Full error:", JSON.stringify(error, null, 2));
        res.status(401).json({ message: 'Invalid Google Token', error: error.code || error.message });
    }
};

// @desc    Firebase Phone Auth Login
// @route   POST /api/auth/phone
// @access  Public
const firebasePhoneLogin = async (req, res) => {
    const { firebaseIdToken } = req.body;

    if (!firebaseIdToken) {
        return res.status(400).json({ message: 'Firebase ID Token is required' });
    }

    try {
        // Verify the token with Firebase Admin SDK
        const decodedToken = await getAuth().verifyIdToken(firebaseIdToken);
        const { phone_number, uid } = decodedToken;

        if (!phone_number) {
            return res.status(400).json({ message: 'No phone number found in the token' });
        }

        // Check if user exists in our DB
        let user = await User.findOne({ phone: phone_number });

        if (!user) {
            // Create a new user with the phone number
            user = await User.create({
                name: 'New User', // Default name, can be updated later
                phone: phone_number,
            });
        }

        if (user.accountStatus === 'Suspended') {
            return res.status(403).json({
                code: 'ACCOUNT_SUSPENDED',
                message: user.suspendedReason
                    ? `Your account is suspended: ${user.suspendedReason}`
                    : 'Your account has been suspended. Please contact support.',
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            role: user.role,
            token: generateToken(user._id),
        });
    } catch (error) {
        console.error('Firebase Auth Error:', error.message);
        res.status(401).json({ message: 'Invalid or expired Firebase token' });
    }
};

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.json({ message: 'If an account exists, an OTP has been sent to that email.' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        user.resetPasswordOTP = hashOTP(otp);
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
        user.resetPasswordAttempts = 0;
        await user.save();

        // Send email
        const html = `
            <h2>Password Reset Request</h2>
            <p>You requested a password reset for Gojra E-Mart.</p>
            <p>Your 6-digit verification code is: <strong>${otp}</strong></p>
            <p>This code will expire in 15 minutes.</p>
            <p>If you did not request this, please ignore this email.</p>
        `;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Gojra E-Mart - Password Reset Code',
                html
            });
            console.log(`[AUTH] Sent password reset OTP to ${email}`);
            res.json({ message: 'If an account exists, an OTP has been sent to that email.' });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;
            user.resetPasswordAttempts = 0;
            await user.save();
            return res.status(500).json({ message: 'Unable to process password reset right now.' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOTP = async (req, res) => {
    const { email, otp } = req.body;
    try {
        const user = await User.findOne({ email });
        
        if (!user || !isOTPValid(user, otp)) {
            if (user) {
                user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
                if (user.resetPasswordAttempts >= 5 || user.resetPasswordExpires < Date.now()) {
                    clearResetOTP(user);
                }
                await user.save();
            }
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        res.json({ message: 'OTP verified successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
const resetPassword = async (req, res) => {
    const { email, otp, newPassword } = req.body;
    try {
        const user = await User.findOne({ email });
        
        // Final verification check to be safe
        if (!user || !isOTPValid(user, otp)) {
            if (user) {
                user.resetPasswordAttempts = (user.resetPasswordAttempts || 0) + 1;
                if (user.resetPasswordAttempts >= 5 || user.resetPasswordExpires < Date.now()) {
                    clearResetOTP(user);
                }
                await user.save();
            }
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Update password
        user.password = newPassword; // Pre-save hook will hash it
        clearResetOTP(user);
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const hashOTP = (otp) => {
    return crypto.createHash('sha256').update(`${otp}:${process.env.JWT_SECRET}`).digest('hex');
};

const getMe = async (req, res) => {
    res.json({
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        address: req.user.address,
        role: req.user.role,
    });
};

const logoutUser = async (req, res) => {
    clearAuthCookie(res);
    res.json({ message: 'Logged out successfully' });
};

const isOTPValid = (user, otp) => {
    return Boolean(
        user.resetPasswordOTP &&
        user.resetPasswordExpires &&
        user.resetPasswordExpires >= Date.now() &&
        (user.resetPasswordAttempts || 0) < 5 &&
        user.resetPasswordOTP === hashOTP(otp)
    );
};

const clearResetOTP = (user) => {
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    user.resetPasswordAttempts = 0;
};

module.exports = { registerUser, loginUser, googleLogin, firebasePhoneLogin, forgotPassword, verifyOTP, resetPassword, getMe, logoutUser };
