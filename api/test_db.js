const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');

async function test() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected');
        const email = 'test' + Date.now() + '@example.com';
        const otp = '123456';
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
        const newUser = new User({ email, otp, otpExpires });
        await newUser.save();
        console.log('User saved');
        await User.deleteOne({ email });
        console.log('User deleted');
        process.exit(0);
    } catch (e) {
        console.error('Test Failed:', e);
        process.exit(1);
    }
}
test();
