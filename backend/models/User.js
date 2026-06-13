const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: false, unique: true, sparse: true },
    password: { type: String }, // Optional if using Google
    googleId: { type: String }, // Google User ID
    phone: { type: String, required: false }, // Optional for Google Users initially
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    address: { type: String, default: '' },
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    resetPasswordOTP: { type: String },
    resetPasswordExpires: { type: Date },
    resetPasswordAttempts: { type: Number, default: 0 },
    fcmToken: {
        type: String,
        default: null,
    },
}, { timestamps: true });

userSchema.index({ phone: 1 });

// Hash password before saving
// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
