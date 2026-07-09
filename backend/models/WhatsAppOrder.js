const mongoose = require('mongoose');

const whatsAppOrderSchema = new mongoose.Schema({
    messageId: { type: String, unique: true, sparse: true, trim: true },
    from: { type: String, required: true, trim: true },
    messageBody: { type: String, required: true, trim: true },
    messageType: { type: String, default: 'text', trim: true },
    status: {
        type: String,
        default: 'New',
        enum: ['New', 'Reviewed', 'Converted', 'Ignored'],
        index: true,
    },
    conversionNotes: { type: String, trim: true, maxlength: 1000, default: '' },
    receivedAt: { type: Date, default: Date.now, index: true },
}, { timestamps: true });

whatsAppOrderSchema.index({ from: 1, receivedAt: -1 });

module.exports = mongoose.model('WhatsAppOrder', whatsAppOrderSchema);
