const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            variant: { type: String },
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        }
    ],
    shippingAddress: {
        street: { type: String, required: true },
        area: { type: String, required: true },
        city: { type: String, required: true },
        phone: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true, default: 'COD' },
    deliveryDate: {
        type: String,
        trim: true,
        validate: {
            validator: value => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
            message: 'Delivery date must use YYYY-MM-DD format',
        },
    },
    deliverySlot: {
        label: { type: String, default: '' },
        startTime: { type: String, default: '' },
        endTime: { type: String, default: '' },
    },
    itemsPrice: { type: Number, required: true, default: 0.0 },
    deliveryFee: { type: Number, required: true, default: 0.0 },
    discountAmount: { type: Number, required: true, default: 0.0 },
    promoCode: { type: String, default: '' },
    totalPrice: { type: Number, required: true, default: 0.0 },
    status: { type: String, required: true, default: 'Placed', enum: ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'] },
    statusHistory: [{
        status: {
            type: String,
            required: true,
            enum: ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'],
        },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, trim: true, maxlength: 300, default: '' },
    }],
    cancellationReason: { type: String, trim: true, maxlength: 300, default: '' },
    adminNote: { type: String, trim: true, maxlength: 1000, default: '' },
    assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', default: null },
    riderAssignedAt: { type: Date },
    source: { type: String, default: 'App' }, // App or WhatsApp (if parsed)
    location: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
    }
}, { timestamps: true });

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });
orderSchema.index({ deliveryDate: 1, 'deliverySlot.startTime': 1, status: 1 });
orderSchema.index({ assignedRider: 1, status: 1 });

module.exports = mongoose.model('Order', orderSchema);
