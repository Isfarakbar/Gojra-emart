const mongoose = require('mongoose');

const whatsAppOrderSchema = new mongoose.Schema({
    from: { type: String, required: true }, // WhatsApp Phone Number
    messageBody: { type: String, required: true }, // The text message sent
    status: { type: String, default: 'New', enum: ['New', 'Reviewed', 'Processed', 'Ignored'] },
    timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('WhatsAppOrder', whatsAppOrderSchema);
