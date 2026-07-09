const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const addressSchema = new mongoose.Schema({
    label: { type: String, default: 'Home' },
    street: { type: String, required: true },
    area: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    isDefault: { type: Boolean, default: false },
}, { _id: true, timestamps: true });

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },
    password: { type: String },
    googleId: { type: String },
    phone: { type: String, required: false, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    accountStatus: {
        type: String,
        enum: ['Active', 'Suspended'],
        default: 'Active',
        index: true,
    },
    suspendedReason: { type: String, trim: true, maxlength: 300, default: '' },
    suspendedAt: { type: Date },
    address: { type: String, default: '' },
    addresses: [addressSchema],
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordAttempts: { type: Number, default: 0 },
    fcmToken: {
        type: String,
        default: null,
    },
}, { timestamps: true });

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) {
        return false;
    }
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
