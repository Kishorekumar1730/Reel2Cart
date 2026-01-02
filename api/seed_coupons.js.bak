const mongoose = require("mongoose");
const Coupon = require("./models/Coupon");
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI)
    .then(async () => {
        console.log("Connected to MongoDB for Seeding");

        const coupons = [
            {
                code: "WELCOME50",
                discountType: "percentage",
                discountValue: 50,
                minOrderValue: 500,
                expiryDate: new Date("2030-12-31"),
                usageLimit: 1000,
                applicableRegions: ["Global", "India"]
            },
            {
                code: "SAVE100",
                discountType: "fixed",
                discountValue: 100,
                minOrderValue: 1000,
                expiryDate: new Date("2030-12-31"),
                applicableRegions: ["Global", "India"]
            }
        ];

        for (const c of coupons) {
            try {
                const existing = await Coupon.findOne({ code: c.code });
                if (!existing) {
                    await new Coupon(c).save();
                    console.log(`Coupon ${c.code} created.`);
                } else {
                    console.log(`Coupon ${c.code} already exists.`);
                }
            } catch (e) {
                console.error(e.message);
            }
        }

        mongoose.disconnect();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
