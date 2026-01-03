require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
    console.log("Testing Email Configuration...");
    console.log(`User: ${process.env.EMAIL_USER}`);

    // Mask password for log safety
    const pass = process.env.EMAIL_PASS ? '********' : 'NOT SET';
    console.log(`Pass: ${pass}`);

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const info = await transporter.sendMail({
            from: `"Test Script" <${process.env.EMAIL_USER}>`,
            to: process.env.EMAIL_USER, // Send to self
            subject: "Reel2Cart Email Test",
            text: "If you see this, the email configuration is working correctly!",
            html: "<b>If you see this, the email configuration is working correctly!</b>"
        });

        console.log("Message sent: %s", info.messageId);
        console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
        console.log("✅ Email sent successfully!");
    } catch (error) {
        console.error("❌ Email failed to send:");
        console.error(error);
    }
}

testEmail();
