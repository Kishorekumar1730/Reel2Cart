const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
    },
    discountType: {
        type: String,
        enum: ["percentage", "fixed"],
        required: true,
    },
    discountValue: {
        type: Number,
        required: true,
    },
    minOrderValue: {
        type: Number,
        default: 0,
    },
    expiryDate: {
        type: Date,
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    usageLimit: {
        type: Number, // Max total uses
        default: null,
    },
    usedCount: {
        type: Number,
        default: 0,
    },
    applicableRegions: [{
        type: String, // e.g., "India", "USA", or empty for all
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    }
});

module.exports = mongoose.model("Coupon", couponSchema);
