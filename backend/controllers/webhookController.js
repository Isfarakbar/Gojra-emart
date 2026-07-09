const crypto = require('crypto');
const WhatsAppOrder = require('../models/WhatsAppOrder');

const VALID_STATUSES = ['New', 'Reviewed', 'Converted', 'Ignored'];

const verifySignature = (rawBody, signature, appSecret) => {
    if (!rawBody || !signature || !appSecret || !signature.startsWith('sha256=')) return false;
    const expected = `sha256=${crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')}`;
    const receivedBuffer = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    return receivedBuffer.length === expectedBuffer.length &&
        crypto.timingSafeEqual(receivedBuffer, expectedBuffer);
};

const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (!mode || !token || !challenge) {
        return res.status(400).json({ message: 'Missing webhook verification parameters.' });
    }
    if (mode !== 'subscribe' || token !== process.env.WHATSAPP_TOKEN) {
        return res.status(403).json({ message: 'Webhook verification failed.' });
    }
    return res.status(200).send(challenge);
};

const receiveMessage = async (req, res) => {
    const appSecret = process.env.WHATSAPP_APP_SECRET;
    if (!appSecret) {
        return res.status(503).json({ message: 'WhatsApp webhook is not configured.' });
    }
    if (!verifySignature(req.rawBody, req.get('x-hub-signature-256'), appSecret)) {
        return res.status(403).json({ message: 'Invalid webhook signature.' });
    }
    if (req.body?.object !== 'whatsapp_business_account') {
        return res.status(400).json({ message: 'Invalid WhatsApp webhook payload.' });
    }

    const messages = [];
    for (const entry of req.body.entry || []) {
        for (const change of entry.changes || []) {
            for (const message of change.value?.messages || []) {
                const messageType = String(message.type || 'unknown');
                const messageBody = message.text?.body ||
                    message[messageType]?.caption ||
                    `[${messageType} message]`;
                messages.push({
                    messageId: message.id,
                    from: message.from,
                    messageBody,
                    messageType,
                    receivedAt: message.timestamp
                        ? new Date(Number(message.timestamp) * 1000)
                        : new Date(),
                });
            }
        }
    }

    for (const message of messages) {
        if (!message.messageId || !message.from) continue;
        await WhatsAppOrder.updateOne(
            { messageId: message.messageId },
            { $setOnInsert: message },
            { upsert: true }
        );
    }

    return res.status(200).json({ received: messages.length });
};

const getWhatsAppOrders = async (req, res) => {
    try {
        const page = Math.max(Number(req.query.page) || 1, 1);
        const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 100);
        const filter = {};
        if (VALID_STATUSES.includes(req.query.status)) filter.status = req.query.status;
        if (req.query.search?.trim()) {
            const escaped = req.query.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            filter.$or = [
                { from: { $regex: escaped, $options: 'i' } },
                { messageBody: { $regex: escaped, $options: 'i' } },
            ];
        }

        const [orders, total] = await Promise.all([
            WhatsAppOrder.find(filter)
                .sort({ receivedAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
            WhatsAppOrder.countDocuments(filter),
        ]);
        res.json({ orders, page, limit, total, pages: Math.ceil(total / limit) });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateWhatsAppOrder = async (req, res) => {
    try {
        const { status, conversionNotes } = req.body;
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return res.status(400).json({ message: 'Invalid WhatsApp order status.' });
        }
        const update = {};
        if (status !== undefined) update.status = status;
        if (conversionNotes !== undefined) {
            update.conversionNotes = String(conversionNotes).trim().slice(0, 1000);
        }
        const order = await WhatsAppOrder.findByIdAndUpdate(
            req.params.id,
            update,
            { returnDocument: 'after', runValidators: true }
        );
        if (!order) return res.status(404).json({ message: 'WhatsApp order not found.' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    verifySignature,
    verifyWebhook,
    receiveMessage,
    getWhatsAppOrders,
    updateWhatsAppOrder,
};
