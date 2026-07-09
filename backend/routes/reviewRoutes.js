const express = require('express');
const {
    getProductReviews,
    getReviewEligibility,
    submitReview,
    getAdminReviews,
    moderateReview,
    deleteReview,
} = require('../controllers/reviewController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

const router = express.Router();
router.param('id', validateObjectIdParam('review ID'));
router.param('productId', validateObjectIdParam('product ID'));

router.get('/product/:productId', getProductReviews);
router.get('/eligibility/:productId', protect, getReviewEligibility);
router.post('/', protect, submitReview);
router.get('/admin', protect, admin, getAdminReviews);
router.put('/admin/:id', protect, admin, moderateReview);
router.delete('/admin/:id', protect, admin, deleteReview);

module.exports = router;
