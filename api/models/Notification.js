const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    recipientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        // Can be User _id (for buyers) or Seller _id (for sellers - usually linked to user _id anyway)
        // We will stick to User _id for simplicity, as Sellers are Users too.
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['order_update', 'promotion', 'account', 'system', 'new_order'],
        default: 'system',
    },
    relatedId: {
        type: String, // ID of Order, Product, etc.
    },
    isRead: {
        type: Boolean,
        default: false,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Notification', notificationSchema);
