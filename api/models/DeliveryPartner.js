const mongoose = require("mongoose");

const deliveryPartnerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    // ID & Licensing
    licenseNumber: { type: String, required: true },
    vehicleType: { type: String, enum: ['bike', 'scooter', 'truck'], required: true },
    vehiclePlate: { type: String, required: true },

    // Performance
    rating: { type: Number, default: 5.0 },
    totalDeliveries: { type: Number, default: 0 },
    earnings: { type: Number, default: 0 },

    // Status
    isOnline: { type: Boolean, default: false },
    currentLocation: {
        latitude: Number,
        longitude: Number
    },

    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model("DeliveryPartner", deliveryPartnerSchema);
