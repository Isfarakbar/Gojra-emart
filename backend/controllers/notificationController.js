const Notification = require('../models/Notification');
const User = require('../models/User');
const sendNotification = require('../utils/sendNotification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).skip(skip).limit(limit),
            Notification.countDocuments({ user: req.user._id }),
        ]);

        res.json({
            notifications,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get recent notifications for admin audit
// @route   GET /api/notifications/admin
// @access  Private/Admin
const getAdminNotifications = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            Notification.find({})
                .populate('user', 'name email phone')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Notification.countDocuments({}),
        ]);

        res.json({
            notifications,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Broadcast a notification to customers
// @route   POST /api/notifications/broadcast
// @access  Private/Admin
const broadcastNotification = async (req, res) => {
    try {
        const title = String(req.body.title || '').trim();
        const message = String(req.body.message || '').trim();
        const type = req.body.type || 'broadcast';

        if (!title || !message) {
            return res.status(400).json({ message: 'Title and message are required' });
        }

        if (!['broadcast', 'promo', 'system'].includes(type)) {
            return res.status(400).json({ message: 'Invalid notification type' });
        }

        const users = await User.find({ role: 'user' }).select('_id fcmToken');

        if (users.length === 0) {
            return res.status(400).json({ message: 'No customers found to notify' });
        }

        const notifications = users.map(user => ({
            user: user._id,
            title,
            message,
            type,
        }));

        await Notification.insertMany(notifications, { ordered: false });

        const usersWithTokens = users.filter(user => Boolean(user.fcmToken));
        const pushResults = await Promise.allSettled(
            usersWithTokens.map(user => sendNotification(
                user.fcmToken,
                title,
                message,
                { type, source: 'admin_broadcast' }
            ))
        );

        const failedPushes = pushResults.filter(result => result.status === 'rejected').length;

        res.status(201).json({
            message: 'Notification broadcast created',
            recipients: users.length,
            pushTargets: usersWithTokens.length,
            failedPushes,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findOne({ _id: req.params.id, user: req.user._id });
        if (notification) {
            notification.read = true;
            await notification.save();
            res.json(notification);
        } else {
            res.status(404).json({ message: 'Notification not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getNotifications, getAdminNotifications, broadcastNotification, markAsRead };
