const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res, next) => {
    const { name, email, password, phone, address } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = await User.create({
            name,
            email,
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
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                address: user.address,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Google Login/Signup
// @route   POST /api/auth/google
// @access  Public
const googleLogin = async (req, res) => {
    const { token } = req.body;

    try {
        // Verify Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { name, email, sub: googleId } = ticket.getPayload();

        // Check if user exists
        let user = await User.findOne({ email });

        if (user) {
            // User exists - update googleId if missing
            if (!user.googleId) {
                user.googleId = googleId;
                await user.save();
            }
        } else {
            // New User - Create
            user = await User.create({
                name,
                email,
                googleId,
                password: await bcrypt.hash(Math.random().toString(36).slice(-8), 10), // Random password
                phone: '', // Can prompt user later
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
        console.error("Google Auth Error:", error);
        res.status(401).json({ message: 'Invalid Google Token' });
    }
};

const sendEmail = require('../utils/sendEmail');
const { getAuth } = require('firebase-admin/auth');

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
                password: uid, // Use Firebase UID as a placeholder password
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
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
            return res.status(404).json({ message: 'User not found' });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Save OTP and expiration (15 minutes) to user
        user.resetPasswordOTP = otp;
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
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
            res.json({ message: 'OTP sent to email successfully' });
        } catch (emailError) {
            console.error('Email send error:', emailError);
            user.resetPasswordOTP = undefined;
            user.resetPasswordExpires = undefined;
            await user.save();
            return res.status(500).json({ message: 'Email could not be sent. Please check SMTP configuration.' });
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
        
        if (!user || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
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
        if (!user || user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Update password
        user.password = newPassword; // Pre-save hook will hash it
        user.resetPasswordOTP = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.json({ message: 'Password reset successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { registerUser, loginUser, googleLogin, firebasePhoneLogin, forgotPassword, verifyOTP, resetPassword };

