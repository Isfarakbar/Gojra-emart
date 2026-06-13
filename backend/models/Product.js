const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    price: { type: Number, required: true },
    oldPrice: { type: Number }, // For discount display (e.g. was 200, now 150)
    stock: { type: Number, required: true, default: 0 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    imageUrl: { type: String, required: true },
    isFeatured: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    variants: [
        {
            unit: { type: String, required: true }, // e.g., '500g', '1kg'
            price: { type: Number, required: true },
            stock: { type: Number, default: 0 },
            oldPrice: { type: Number }
        }
    ]
}, { timestamps: true });

productSchema.index({ category: 1 });
productSchema.index({ name: 1 });
productSchema.index({ name: 'text', description: 'text' });

module.exports = mongoose.model('Product', productSchema);
