const express = require('express');
const router = express.Router();
const { verifyWebhook, receiveMessage, getWhatsAppOrders } = require('../controllers/webhookController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(verifyWebhook)
    .post(receiveMessage);

router.route('/orders')
    .get(protect, admin, getWhatsAppOrders);

module.exports = router;
