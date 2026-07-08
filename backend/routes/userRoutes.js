const express = require('express');
const router = express.Router();
const {
    getUserProfile,
    updateUserProfile,
    toggleWishlist,
    getAllUsers,
    updateFCMToken,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/userController');
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

// Saved addresses
router.route('/addresses')
    .post(protect, addAddress);
router.route('/addresses/:addressId')
    .put(protect, updateAddress)
    .delete(protect, deleteAddress);
router.route('/addresses/:addressId/default')
    .put(protect, setDefaultAddress);

// Wishlist
router.route('/wishlist/:id')
    .post(protect, toggleWishlist);

module.exports = router;
