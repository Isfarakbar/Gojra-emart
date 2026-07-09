const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    subject: { type: String, required: true, trim: true, maxlength: 120 },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    category: {
        type: String,
        enum: ['order_issue', 'delivery_issue', 'payment_issue', 'product_quality', 'refund_return', 'account_issue', 'other'],
        default: 'other',
    },
    status: {
        type: String,
        enum: ['Open', 'In Progress', 'Resolved', 'Closed'],
        default: 'Open',
    },
    priority: {
        type: String,
        enum: ['Low', 'Normal', 'High', 'Urgent'],
        default: 'Normal',
    },
    adminReply: { type: String, trim: true, maxlength: 1000, default: '' },
    resolvedAt: { type: Date },
}, { timestamps: true });

supportTicketSchema.index({ user: 1, createdAt: -1 });
supportTicketSchema.index({ status: 1, createdAt: -1 });
supportTicketSchema.index({ order: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
