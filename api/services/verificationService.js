const axios = require('axios');

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

const getAuthHeader = () => {
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error("Razorpay API Keys are missing in server configuration.");
    }
    const token = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
    return { Authorization: `Basic ${token}` };
};

const verifyGSTIN = async (gstin) => {
    try {
        const headers = getAuthHeader();
        // Razorpay GST Verification Endpoint
        const response = await axios.get(`https://api.razorpay.com/v1/gst/verification?gstin=${gstin}`, { headers });

        // Razorpay returns valid: true/false in the response
        if (response.data && response.data.verified) {
            return { valid: true, data: response.data };
        }
        return { valid: false, message: "GSTIN not found or invalid in government records." };
    } catch (error) {
        console.error("GST Verification Error:", error.response?.data || error.message);
        // Handle 400/404 specifically from Razorpay
        if (error.response && (error.response.status === 400 || error.response.status === 404)) {
            return { valid: false, message: "Invalid GSTIN." };
        }
        // If keys are wrong or server error
        throw error;
    }
};

const verifyPAN = async (pan) => {
    try {
        const headers = getAuthHeader();
        const response = await axios.post(
            `https://api.razorpay.com/v1/pan/verification`,
            { pan: pan },
            { headers }
        );

        if (response.data && response.data.verified) {
            return { valid: true, data: response.data };
        }
        return { valid: false, message: "PAN not found in government records." };
    } catch (error) {
        console.error("PAN Verification Error:", error.response?.data || error.message);
        if (error.response && (error.response.status === 400 || error.response.status === 404)) {
            return { valid: false, message: "Invalid PAN." };
        }
        throw error;
    }
};

module.exports = { verifyGSTIN, verifyPAN };
