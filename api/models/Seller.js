const mongoose = require("mongoose");

const sellerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    businessName: {
        type: String,
        required: true,
    },
    sellerName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true, // Business email
    },
    phone: {
        type: String,
        required: true,
    },
    accountType: {
        type: String, // 'licensed', 'local'
        required: true,
        enum: ['licensed', 'local'],
        default: 'licensed'
    },
    gstin: {
        type: String,
    },
    businessPan: {
        type: String,
    },
    additionalProofType: {
        type: String, // 'Udyam', 'FSSAI'
    },
    additionalProofId: {
        type: String,
    },
    businessAddress: {
        type: String,
        required: true,
    },
    isVerified: {
        type: Boolean,
        default: false,
    },
    approvalStatus: {
        type: String, // 'pending', 'approved', 'rejected'
        default: 'pending',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    profileImage: {
        type: String, // URL of the shop logo
        default: '',
    },
    description: {
        type: String, // Short bio or shop description
        default: '',
    },
    followers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ]
});

module.exports = mongoose.model("Seller", sellerSchema);
