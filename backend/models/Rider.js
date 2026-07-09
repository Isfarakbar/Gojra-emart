const mongoose = require('mongoose');

const riderSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, unique: true },
    cnic: { type: String, trim: true, default: '', maxlength: 20 },
    vehicleType: {
        type: String,
        enum: ['Motorcycle', 'Bicycle', 'Car', 'Other'],
        default: 'Motorcycle',
    },
    vehicleNumber: { type: String, trim: true, default: '', maxlength: 30 },
    status: {
        type: String,
        enum: ['Available', 'Busy', 'Offline'],
        default: 'Available',
    },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

riderSchema.index({ status: 1, isActive: 1 });

module.exports = mongoose.model('Rider', riderSchema);
