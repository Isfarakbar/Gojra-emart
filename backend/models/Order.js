const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
        {
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            image: { type: String, required: true },
            price: { type: Number, required: true },
            product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        }
    ],
    shippingAddress: {
        address: { type: String, required: true },
        city: { type: String, required: true },
        phone: { type: String, required: true },
    },
    paymentMethod: { type: String, required: true, default: 'COD' },
    totalPrice: { type: Number, required: true, default: 0.0 },
    status: { type: String, required: true, default: 'Pending', enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] },
    source: { type: String, default: 'App' }, // App or WhatsApp (if parsed)
    location: {
        type: { type: String, default: 'Point' },
        coordinates: { type: [Number], required: false } // [longitude, latitude]
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
