const express = require('express');
const router = express.Router();
const { getNotifications, getAdminNotifications, broadcastNotification, markAsRead } = require('../controllers/notificationController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validateObjectId');

router.param('id', validateObjectIdParam('notification ID'));

router.get('/admin', protect, admin, getAdminNotifications);
router.post('/broadcast', protect, admin, broadcastNotification);
router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
