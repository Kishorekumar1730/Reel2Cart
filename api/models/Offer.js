const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    imageUrl: {
        type: String,
        required: true,
    },
    discountPercentage: {
        type: Number,
    },
    couponCode: {
        type: String,
    },
    validTill: {
        type: Date,
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("Offer", offerSchema);
