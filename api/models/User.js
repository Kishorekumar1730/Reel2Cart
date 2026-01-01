const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  name: {
    type: String,
  },
  mobileNo: {
    type: String,
  },
  gender: {
    type: String,
  },
  dob: {
    type: String,
  },
  profileImage: {
    type: String,
  },
  // password removed as per request
  otp: {
    type: String,
    required: false,
  },
  otpExpires: {
    type: Date,
    required: false,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  walletBalance: {
    type: Number,
    default: 0,
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user',
  },
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Seller'
  }],
  country: {
    type: String,
    default: 'Global'
  },
  city: {
    type: String
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
    },
    coordinates: {
      type: [Number],
    }
  },
  pushToken: {
    type: String,
    default: null
  },
  twoFactorEnabled: {
    type: Boolean,
    default: false
  }
});
userSchema.index({ location: "2dsphere" });

module.exports = mongoose.model('User', userSchema);
