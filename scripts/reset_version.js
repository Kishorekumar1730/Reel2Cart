const axios = require('axios');

// Configuration
const API_URL = 'https://reel-2-cart.vercel.app/admin/app-version';

const UPDATE_DATA = {
    platform: 'android',
    version: '1.0.0', // Downgrade to match current APK so prompt disappears
    forceUpdate: false,
    description: "Temporary reset to allow OTA.",
    updateUrl: ""
};

async function emergencyReset() {
    try {
        console.log(`Resetting version to v${UPDATE_DATA.version}...`);
        const response = await axios.post(API_URL, UPDATE_DATA);
        console.log("✅ Version Reset. Users should no longer see the loop.");
    } catch (error) {
        console.error("❌ Failed:", error.message);
    }
}

emergencyReset();
