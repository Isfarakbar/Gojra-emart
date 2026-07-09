const SupportTicket = require('../models/SupportTicket');
const Order = require('../models/Order');
const Notification = require('../models/Notification');
const sendNotification = require('../utils/sendNotification');

const PAGE_SIZE = 20;
const VALID_CATEGORIES = ['order_issue', 'delivery_issue', 'payment_issue', 'product_quality', 'refund_return', 'account_issue', 'other'];
const VALID_STATUSES = ['Open', 'In Progress', 'Resolved', 'Closed'];
const VALID_PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'];

const createTicket = async (req, res) => {
    try {
        const subject = String(req.body.subject || '').trim();
        const message = String(req.body.message || '').trim();
        const category = VALID_CATEGORIES.includes(req.body.category) ? req.body.category : 'other';
        const orderId = req.body.order || req.body.orderId || null;

        if (!subject || !message) {
            return res.status(400).json({ message: 'Subject and message are required' });
        }

        if (subject.length > 120 || message.length > 1000) {
            return res.status(400).json({ message: 'Support request is too long' });
        }

        let order = null;
        if (orderId) {
            order = await Order.findOne({ _id: orderId, user: req.user._id });
            if (!order) {
                return res.status(400).json({ message: 'Selected order was not found for your account' });
            }
        }

        const ticket = await SupportTicket.create({
            user: req.user._id,
            order: order?._id,
            subject,
            message,
            category,
            priority: category === 'delivery_issue' || category === 'product_quality' ? 'High' : 'Normal',
        });

        res.status(201).json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMyTickets = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || PAGE_SIZE, 1), 50);
        const skip = (page - 1) * limit;

        const [tickets, total] = await Promise.all([
            SupportTicket.find({ user: req.user._id })
                .populate('order', '_id status totalPrice createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SupportTicket.countDocuments({ user: req.user._id }),
        ]);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getTickets = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || PAGE_SIZE, 1), 100);
        const skip = (page - 1) * limit;
        const filter = {};

        if (VALID_STATUSES.includes(req.query.status)) {
            filter.status = req.query.status;
        }

        const [tickets, total] = await Promise.all([
            SupportTicket.find(filter)
                .populate('user', 'name email phone')
                .populate('order', '_id status totalPrice createdAt')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            SupportTicket.countDocuments(filter),
        ]);

        res.json({
            tickets,
            page,
            pages: Math.ceil(total / limit),
            total,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateTicket = async (req, res) => {
    try {
        const ticket = await SupportTicket.findById(req.params.id)
            .populate('user', 'name email phone fcmToken')
            .populate('order', '_id status totalPrice createdAt');

        if (!ticket) {
            return res.status(404).json({ message: 'Support ticket not found' });
        }

        const previousStatus = ticket.status;

        if (VALID_STATUSES.includes(req.body.status)) {
            ticket.status = req.body.status;
            ticket.resolvedAt = ['Resolved', 'Closed'].includes(ticket.status) ? new Date() : undefined;
        }

        if (VALID_PRIORITIES.includes(req.body.priority)) {
            ticket.priority = req.body.priority;
        }

        if (req.body.adminReply !== undefined) {
            ticket.adminReply = String(req.body.adminReply || '').trim();
        }

        await ticket.save();

        if ((ticket.adminReply || previousStatus !== ticket.status) && ticket.user?._id) {
            const title = ticket.status === 'Resolved' ? 'Support Request Resolved' : 'Support Request Updated';
            const message = ticket.adminReply || `Your support request "${ticket.subject}" is now ${ticket.status}.`;

            await Notification.create({
                user: ticket.user._id,
                title,
                message,
                type: 'system',
                relatedId: ticket._id.toString(),
            });

            if (ticket.user.fcmToken) {
                sendNotification(ticket.user.fcmToken, title, message, {
                    type: 'support_ticket',
                    ticketId: ticket._id.toString(),
                });
            }
        }

        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createTicket,
    getMyTickets,
    getTickets,
    updateTicket,
};
