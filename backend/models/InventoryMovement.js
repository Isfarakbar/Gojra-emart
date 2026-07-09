const mongoose = require('mongoose');

const inventoryMovementSchema = new mongoose.Schema({
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    variant: { type: String, trim: true, default: '' },
    type: {
        type: String,
        enum: ['Sale', 'Cancellation', 'Restock', 'Correction', 'Damage', 'Return'],
        required: true,
    },
    quantityChange: { type: Number, required: true },
    previousStock: { type: Number, required: true, min: 0 },
    newStock: { type: Number, required: true, min: 0 },
    reason: { type: String, required: true, trim: true, maxlength: 300 },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

inventoryMovementSchema.index({ product: 1, createdAt: -1 });
inventoryMovementSchema.index({ type: 1, createdAt: -1 });
inventoryMovementSchema.index({ order: 1 });

module.exports = mongoose.model('InventoryMovement', inventoryMovementSchema);
