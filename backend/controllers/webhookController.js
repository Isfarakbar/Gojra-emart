const WhatsAppOrder = require('../models/WhatsAppOrder');

// @desc    Verify Webhook
// @route   GET /api/webhook
// @access  Public (Meta)
const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === process.env.WHATSAPP_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    }
};

// @desc    Receive WhatsApp Message
// @route   POST /api/webhook
// @access  Public (Meta)
const receiveMessage = async (req, res) => {
    const body = req.body;

    if (body.object) {
        if (body.entry &&
            body.entry[0].changes &&
            body.entry[0].changes[0].value.messages &&
            body.entry[0].changes[0].value.messages[0]
        ) {
            const messageObj = body.entry[0].changes[0].value.messages[0];
            const from = messageObj.from;
            const msgBody = messageObj.text ? messageObj.text.body : 'Media/Other';

            try {
                await WhatsAppOrder.create({
                    from,
                    messageBody: msgBody,
                });
                console.log(`Message stored from ${from}`);
            } catch (error) {
                console.error('Error storing WhatsApp message:', error);
            }
        }
        res.sendStatus(200);
    } else {
        res.sendStatus(404);
    }
};

// @desc    Get all WhatsApp raw orders
// @route   GET /api/webhook/orders
// @access  Private/Admin
const getWhatsAppOrders = async (req, res) => {
    try {
        const orders = await WhatsAppOrder.find({}).sort({ timestamp: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { verifyWebhook, receiveMessage, getWhatsAppOrders };
