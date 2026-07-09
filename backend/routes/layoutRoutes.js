const express = require('express');
const router = express.Router();
const {
    getHomeLayout,
    getHomeSettings,
    updateHomeSettings,
    createBanner,
    getBanners,
    updateBanner,
    deleteBanner,
    createSection,
    getSections,
    updateSection,
    deleteSection
} = require('../controllers/layoutController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('layout item ID'));

// Public
router.get('/home', getHomeLayout);

// Admin - Banners
router.get('/settings', protect, admin, getHomeSettings);
router.put('/settings', protect, admin, updateHomeSettings);
router.get('/banners', protect, admin, getBanners);
router.post('/banners', protect, admin, createBanner);
router.put('/banners/:id', protect, admin, updateBanner);
router.delete('/banners/:id', protect, admin, deleteBanner);

// Admin - Sections
router.get('/sections', protect, admin, getSections);
router.post('/sections', protect, admin, createSection);
router.put('/sections/:id', protect, admin, updateSection);
router.delete('/sections/:id', protect, admin, deleteSection);

module.exports = router;
