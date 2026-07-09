const express = require('express');
const router = express.Router();
const {
    verifyWebhook,
    receiveMessage,
    getWhatsAppOrders,
    updateWhatsAppOrder,
} = require('../controllers/webhookController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('WhatsApp order ID'));

router.route('/')
    .get(verifyWebhook)
    .post(receiveMessage);

router.route('/orders')
    .get(protect, admin, getWhatsAppOrders);
router.put('/orders/:id', protect, admin, updateWhatsAppOrder);

module.exports = router;
