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
    itemsPrice: { type: Number, required: true, default: 0.0 },
    deliveryFee: { type: Number, required: true, default: 0.0 },
    totalPrice: { type: Number, required: true, default: 0.0 },
    status: { type: String, required: true, default: 'Placed', enum: ['Placed', 'Confirmed', 'Packing', 'Out for Delivery', 'Delivered', 'Cancelled'] },
    source: { type: String, default: 'App' }, // App or WhatsApp (if parsed)
    location: {
        latitude: { type: Number, min: -90, max: 90 },
        longitude: { type: Number, min: -180, max: 180 }
    }
}, { timestamps: true });

orderSchema.index({ user: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
