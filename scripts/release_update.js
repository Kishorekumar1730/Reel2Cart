const axios = require('axios');
const readline = require('readline');

// Configuration
const API_URL = 'https://reel-2-cart.vercel.app/admin/app-version';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function releaseUpdate() {
    try {
        console.log("--- 🚀 Reel2Cart Update Releaser ---");

        // 1. Get Details dynamically
        const version = await askQuestion("Enter Version (e.g., 1.0.3): ");
        const url = await askQuestion("Enter Direct APK Download Link: ");
        const description = await askQuestion("Enter Update Description (What's new?): ");
        const forceInput = await askQuestion("Force Update? (yes/no) [default: yes]: ");
        const forceUpdate = forceInput.toLowerCase() !== 'no';

        if (!version || !url) {
            console.error("❌ Error: Version and URL are required!");
            rl.close();
            return;
        }

        const updateData = {
            platform: 'android',
            version: version.trim(),
            forceUpdate: forceUpdate,
            description: description || "Bug fixes and improvements.",
            updateUrl: url.trim()
        };

        console.log("\nReviewing Release Candidate:");
        console.log(JSON.stringify(updateData, null, 2));

        const confirm = await askQuestion("\nRelease this update? (yes/no): ");
        if (confirm.toLowerCase() !== 'yes') {
            console.log("❌ Cancelled.");
            rl.close();
            return;
        }

        console.log(`\nReleasing update v${updateData.version} to ${API_URL}...`);
        const response = await axios.post(API_URL, updateData);
        console.log("✅ Update Released Successfully!");
        console.log("Server Response:", response.data);

    } catch (error) {
        console.error("❌ Failed to release update:");
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error("Data:", error.response.data);
        } else {
            console.error(error.message);
        }
    } finally {
        rl.close();
    }
}

releaseUpdate();
