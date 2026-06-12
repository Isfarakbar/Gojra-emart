const express = require('express');
const router = express.Router();
const {
    getHomeLayout,
    createBanner,
    getBanners,
    deleteBanner,
    createSection,
    getSections,
    deleteSection
} = require('../controllers/layoutController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public
router.get('/home', getHomeLayout);

// Admin - Banners
router.get('/banners', protect, admin, getBanners);
router.post('/banners', protect, admin, createBanner);
router.delete('/banners/:id', protect, admin, deleteBanner);

// Admin - Sections
router.get('/sections', protect, admin, getSections);
router.post('/sections', protect, admin, createSection);
router.delete('/sections/:id', protect, admin, deleteSection);

module.exports = router;
