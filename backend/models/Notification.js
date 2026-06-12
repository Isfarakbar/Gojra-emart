const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    read: { type: Boolean, default: false },
    type: { type: String, enum: ['order_update', 'promo', 'system'], default: 'system' },
    relatedId: { type: String } // e.g., Order ID
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
