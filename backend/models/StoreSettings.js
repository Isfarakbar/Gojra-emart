const mongoose = require('mongoose');

const storeSettingsSchema = new mongoose.Schema({
    storeName: { type: String, default: 'Gojra E-Mart' },
    isStoreOpen: { type: Boolean, default: true },
    closedMessage: { type: String, default: 'Store is currently closed. Please try again later.' },
    minimumOrderAmount: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    freeDeliveryAbove: { type: Number, default: 0, min: 0 },
    estimatedDeliveryMinutes: { type: Number, default: 45, min: 1 },
    enableDeliverySlots: { type: Boolean, default: true },
    deliveryDaysAhead: { type: Number, default: 7, min: 1, max: 30 },
    minimumSlotLeadMinutes: { type: Number, default: 60, min: 0, max: 1440 },
    deliverySlots: [{
        label: { type: String, required: true, trim: true },
        startTime: { type: String, required: true, trim: true },
        endTime: { type: String, required: true, trim: true },
        isActive: { type: Boolean, default: true },
        orderLimit: { type: Number, default: 0, min: 0 },
    }],
    supportPhone: { type: String, default: '' },
    supportEmail: { type: String, default: '' },
    supportWhatsapp: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('StoreSettings', storeSettingsSchema);
