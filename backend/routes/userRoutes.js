const express = require('express');
const router = express.Router();
const { getUserProfile, updateUserProfile, toggleWishlist, getAllUsers, updateFCMToken } = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// Admin - Get all users
router.route('/')
    .get(protect, admin, getAllUsers);

// User profile
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, updateUserProfile);

// FCM Token
router.route('/fcm-token')
    .put(protect, updateFCMToken);

// Wishlist
router.route('/wishlist/:id')
    .post(protect, toggleWishlist);

module.exports = router;
