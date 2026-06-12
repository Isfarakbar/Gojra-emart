const mongoose = require('mongoose');

const homeSectionSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['horizontal', 'grid'], default: 'horizontal' },
    filterType: { type: String, enum: ['featured', 'latest', 'category'], required: true },
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Category' }, // Optional, used if filterType is 'category'
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('HomeSection', homeSectionSchema);
