const express = require('express');
const router = express.Router();
const {
    listPromoCodes,
    createPromoCode,
    updatePromoCode,
    deletePromoCode,
    validatePromoCode,
} = require('../controllers/promoCodeController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('promo code ID'));

router.post('/validate', protect, validatePromoCode);
router.route('/')
    .get(protect, admin, listPromoCodes)
    .post(protect, admin, createPromoCode);
router.route('/:id')
    .put(protect, admin, updatePromoCode)
    .delete(protect, admin, deletePromoCode);

module.exports = router;
