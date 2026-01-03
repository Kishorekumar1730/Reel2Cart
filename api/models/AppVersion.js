const mongoose = require('mongoose');

const appVersionSchema = new mongoose.Schema({
    platform: { type: String, required: true, enum: ['android', 'ios'] },
    version: { type: String, required: true }, // Semver e.g. "1.0.1"
    forceUpdate: { type: Boolean, default: false },
    updateUrl: { type: String }, // Store Link or APK link
    description: { type: String } // "What's new"
}, { timestamps: true });

module.exports = mongoose.model('AppVersion', appVersionSchema);
