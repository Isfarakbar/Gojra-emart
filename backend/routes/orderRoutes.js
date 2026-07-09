const express = require('express');
const router = express.Router();
const {
    addOrderItems,
    getOrderById,
    getMyOrders,
    getReorderPreview,
    getOrders,
    updateOrderStatus,
    cancelMyOrder,
    updateOrderAdminNote
} = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('order ID'));

router.route('/').post(protect, addOrderItems).get(protect, admin, getOrders);
router.route('/myorders').get(protect, getMyOrders);
router.route('/:id/reorder').get(protect, getReorderPreview);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/cancel').put(protect, cancelMyOrder);
router.route('/:id/status').put(protect, admin, updateOrderStatus);
router.route('/:id/admin-note').put(protect, admin, updateOrderAdminNote);

module.exports = router;
