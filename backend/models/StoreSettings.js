const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
    storeName: { type: String, default: 'Gojra E-Mart' },
    isStoreOpen: { type: Boolean, default: true },
    closedMessage: { type: String, default: 'Store is currently closed. Please try again later.' },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    freeDeliveryAbove: { type: Number, default: 0, min: 0 },
    estimatedDeliveryMinutes: { type: Number, default: 45, min: 1 },
    supportPhone: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    supportWhatsapp: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
