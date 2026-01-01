require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const User = require('./models/User');
const Address = require('./models/Address');
const Seller = require('./models/Seller');
const Product = require('./models/Product');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');
const Notification = require('./models/Notification');
const DeliveryPartner = require('./models/DeliveryPartner');
const Message = require('./models/Message');
const axios = require('axios');
const multer = require('multer');
const {
  getOtpTemplate,
  getOrderConfirmationTemplate,
  getOrderStatusTemplate,
  getLoginAlertTemplate,
  getWelcomeTemplate,
  getOrderCancellationTemplate,
  getSellerNewOrderTemplate,
  getSellerWelcomeTemplate,
  getAdminNotificationTemplate
} = require('./utils/emailTemplates');
const path = require('path');
const fs = require('fs');


const app = express();
const port = 8000;
const cors = require("cors");
app.use(cors());

app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));
app.use(bodyParser.json({ limit: '50mb' }));

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer Config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
});

const upload = multer({ storage: storage });

// Serve Static Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Upload Route
app.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  // Return relative path. Frontend will prepend API_BASE_URL.
  // This allows the DB to remain valid even if the server IP changes.
  const relativePath = `uploads/${req.file.filename}`;
  res.status(200).json({ url: relativePath });
});

const jwt = require("jsonwebtoken");

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Generate OTP
function generateOTP() {
  return crypto.randomInt(100000, 999999).toString();
}

// Email Translations
const emailTranslations = {
  English: {
    subject: 'Your OTP for Reel2Cart',
    text: (otp) => `Your OTP is: ${otp}. It expires in 10 minutes.`,
  },
  'தமிழ்': {
    subject: 'Reel2Cart க்கான உங்கள் OTP',
    text: (otp) => `உங்கள் OTP: ${otp}. இது 10 நிமிடங்களில் காலாவதியாகும்.`,
  },
  'తెలుగు': {
    subject: 'Reel2Cart కోసం మీ OTP',
    text: (otp) => `మీ OTP: ${otp}. ఇది 10 నిమిషాల్లో ముగుస్తుంది.`,
  },
  'हिंदी': {
    subject: 'Reel2Cart के लिए आपका OTP',
    text: (otp) => `आपका OTP है: ${otp}. यह 10 मिनट में समाप्त हो जाएगा.`,
  },
  'മലയാളം': {
    subject: 'Reel2Cart-നുള്ള നിങ്ങളുടെ OTP',
    text: (otp) => `നിങ്ങളുടെ OTP: ${otp}. ഇത് 10 മിനിറ്റിനുള്ളിൽ കാലഹരണപ്പെടും.`,
  },
  'ಕನ್ನಡ': {
    subject: 'Reel2Cart ಗಾಗಿ ನಿಮ್ಮ OTP',
    text: (otp) => `ನಿಮ್ಮ OTP: ${otp}. ಇದು 10 ನಿಮಿಷಗಳಲ್ಲಿ ಮುಕ್ತಾಯಗೊಳ್ಳುತ್ತದೆ.`,
  },
};

// Send OTP email
async function sendOTPEmail(email, otp, language = 'English') {
  const content = emailTranslations[language] || emailTranslations.English;
  const htmlContent = getOtpTemplate(otp, language);

  const mailOptions = {
    from: `"Reel2Cart Security" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: content.subject,
    text: content.text(otp), // Fallback
    html: htmlContent
  };

  await transporter.sendMail(mailOptions);
}

// Send Generic Email
async function sendEmail(to, subject, html) {
  try {
    await transporter.sendMail({
      from: `"Reel2Cart" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
  } catch (e) {
    console.error("Email send failed:", e);
  }
}

// Notification Helper
async function sendNotification(userId, title, message, type, relatedId = null) {
  try {
    const notification = new Notification({
      recipientId: userId,
      title,
      message,
      type,
      relatedId
    });
    await notification.save();

    // Send Push
    try {
      const user = await User.findById(userId);
      if (user && user.pushToken) {
        await axios.post('https://exp.host/--/api/v2/push/send', {
          to: user.pushToken,
          sound: 'default',
          title: title,
          body: message,
          data: { relatedId, type },
        });
      }
    } catch (pushErr) {
      console.error("Push notification failed", pushErr.message);
    }
  } catch (err) {
    console.error("Error creating notification:", err);
  }
}

// Admin Notification Helper
async function notifyAdmin(title, message, type) {
  try {
    const adminEmail = process.env.EMAIL_USER; // Send to own support email as admin
    const html = getAdminNotificationTemplate(title, message, type);
    await sendEmail(adminEmail, `Admin Alert: ${title}`, html);
  } catch (e) {
    console.error("Admin notification failed:", e);
  }
}

// Routes

const bcrypt = require("bcryptjs");

// --- Authentication Routes ---

// --- Authentication Routes ---

// 1. Signup: Send OTP (Email only)
app.post('/signup', async (req, res) => {
  const { email, language } = req.body; // Accept language

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser && existingUser.isVerified) {
      return res.status(400).json({ message: 'User already exists. Please login.' });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes expiry

    if (existingUser) {
      // Update existing unverified user
      existingUser.otp = otp;
      existingUser.otpExpires = otpExpires;
      await existingUser.save();
    } else {
      // Create new user (No password)
      const newUser = new User({ email, otp, otpExpires });
      await newUser.save();
    }

    await sendOTPEmail(email, otp, language); // Pass language
    res.status(200).json({ message: 'OTP sent to email.' });
  } catch (error) {
    console.error("Error in /signup:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 2. Verify Signup OTP
app.post('/verify-signup', async (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ message: 'Email and OTP are required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;

    // Auto-promote Admin
    if (email === 'reel2cart2025@gmail.com') {
      user.role = 'admin';
    }

    await user.save();

    // Send Welcome Email (Only if it was a new registration/verification)
    // Note: Since verify-signup is used for login-via-otp too in some flows, strictly this should logic be for first verify.
    // For now we assume if we just set isVerified=true, it's a welcome moment.
    try {
      const welcomeHtml = getWelcomeTemplate("User"); // We might not have name yet, use "User"
      sendEmail(email, "Welcome to Reel2Cart! 🎬", welcomeHtml);
    } catch (e) { console.error("Welcome email failed", e); }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Verification successful', token, user });
  } catch (error) {
    console.error("Error in /verify-signup:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 3. Login: Email Only (With optional 2FA)
app.post('/login', async (req, res) => {
  const { email, language } = req.body;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }
    if (!user.isVerified) {
      return res.status(400).json({ message: 'Account not verified. Please sign up.' });
    }

    if (user.twoFactorEnabled) {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();
      await sendOTPEmail(email, otp, language || 'English');
      return res.status(200).json({ twoFactorRequired: true, message: 'OTP sent for 2FA' });
    }

    // Direct Login if 2FA disabled
    if (email === 'reel2cart2025@gmail.com' && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error("Error in /login:", error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

// 4. Verify Login OTP (2FA)
app.post('/verify-login', async (req, res) => {
  const { email, otp } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || user.otp !== otp || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// --- Address Routes ---

// Create a new address
app.post("/addresses", async (req, res) => {
  try {
    const { userId, address } = req.body;
    const newAddress = new Address({
      userId,
      ...address
    });
    await newAddress.save();
    res.status(201).json({ message: "Address added successfully", address: newAddress });
  } catch (error) {
    res.status(500).json({ message: "Error adding address", error: error.message });
  }
});

// Get all addresses for a user
app.get("/addresses/:userId", async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.params.userId });
    res.status(200).json({ addresses });
  } catch (error) {
    res.status(500).json({ message: "Error fetching addresses", error: error.message });
  }
});

// Update an address
app.put("/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { address } = req.body;
    const updatedAddress = await Address.findByIdAndUpdate(id, address, { new: true });

    if (!updatedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address updated successfully", address: updatedAddress });
  } catch (error) {
    res.status(500).json({ message: "Error updating address", error: error.message });
  }
});

// Delete an address
app.delete("/addresses/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedAddress = await Address.findByIdAndDelete(id);

    if (!deletedAddress) {
      return res.status(404).json({ message: "Address not found" });
    }

    res.status(200).json({ message: "Address deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting address", error: error.message });
  }
});

// --- User Profile Routes ---

// Get User Details
app.get("/user/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Error fetching user", error: error.message });
  }
});

// Update User Details
app.put("/user/:id", async (req, res) => {
  try {
    const { name, mobileNo, gender, dob, profileImage, twoFactorEnabled } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, mobileNo, gender, dob, profileImage, twoFactorEnabled },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({ message: "Profile updated successfully", user });
  } catch (error) {
    res.status(500).json({ message: "Error updating profile", error: error.message });
  }
});

// Update Push Token
app.post("/user/push-token", async (req, res) => {
  const { userId, pushToken } = req.body;
  if (!userId || !pushToken) {
    return res.status(400).json({ message: "UserId and PushToken required" });
  }
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.pushToken = pushToken;
    await user.save();
    res.status(200).json({ message: "Push token updated" });
  } catch (error) {
    console.error("Error updating push token", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

// Delete User
app.delete("/user/:id", async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    await Address.deleteMany({ userId: req.params.id });
    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting account", error: error.message });
  }
});

// --- Payment Routes ---

// Payment routes removed (Stripe)

// --- Order Routes ---

// --- Wishlist Routes ---
const Wishlist = require('./models/Wishlist');

// Get Seller Dashboard Stats
app.get("/seller/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Real-time Aggregations (Earnings, Orders, Views)
    const totalProducts = await Product.countDocuments({ sellerId: seller._id });

    // Total Product Views
    const viewsAggregation = await Product.aggregate([
      { $match: { sellerId: seller._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregation[0]?.totalViews || 0;

    // Sales & Earnings Calculation (Filtered by valid statuses)
    const validStatuses = ['Paid', 'Processing', 'Shipped', 'Delivered'];

    const salesAggregation = await Order.aggregate([
      { $unwind: "$products" },
      {
        $match: {
          "products.sellerId": seller._id,
          status: { $in: validStatuses }
        }
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          totalSales: { $sum: "$products.quantity" }, // Sales count (items sold)
          orderIds: { $addToSet: "$_id" } // Unique orders
        }
      }
    ]);

    const totalEarnings = salesAggregation[0]?.totalEarnings || 0;
    const totalSales = salesAggregation[0]?.totalSales || 0;
    const totalOrders = salesAggregation[0]?.orderIds?.length || 0;


    // --- Monthly Chart Data (Last 6 Months) ---
    // We group by Month/Year of 'createdAt' for valid orders
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const chartAggregation = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo },
          status: { $in: validStatuses }
        }
      },
      { $unwind: "$products" },
      {
        $match: {
          "products.sellerId": seller._id
        }
      },
      {
        $group: {
          _id: {
            month: { $month: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          monthlyEarnings: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Format for Frontend Chart
    // Create placeholders for last 6 months to ensure continuity
    const labels = [];
    const chartData = [];

    // Generate labels for last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const monthName = d.toLocaleString('default', { month: 'short' }); // Jan, Feb
      labels.push(monthName);

      // Find matching data
      const match = chartAggregation.find(c => c._id.month === d.getMonth() + 1 && c._id.year === d.getFullYear());
      chartData.push(match ? match.monthlyEarnings : 0);
    }

    // Response
    res.status(200).json({
      seller,
      totalEarnings,
      totalSales, // Items sold
      totalOrders,
      totalProducts,
      totalViews,
      chartData, // [1000, 5000, 0, ...]
      labels     // ["Jan", "Feb", ...]
    });

  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ message: "Error fetching dashboard stats" });
  }
});


// Get Wishlist for a user
app.get("/wishlist/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(200).json({ products: [] });
    }

    res.status(200).json({ products: wishlist.products });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    res.status(500).json({ message: "Error fetching wishlist" });
  }
});

// Add item to Wishlist
app.post("/wishlist/add", async (req, res) => {
  try {
    const { userId, product } = req.body;
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({ userId, products: [] });
    }

    const exists = wishlist.products.find(p => p.productId === product.productId);
    if (exists) {
      return res.status(400).json({ message: "Item already in wishlist" });
    }

    wishlist.products.push({
      productId: product.productId,
      name: product.name,
      image: product.image,
      price: product.price
    });

    await wishlist.save();
    res.status(200).json({ message: "Added to wishlist", products: wishlist.products });

  } catch (error) {
    console.error("Error adding to wishlist:", error);
    res.status(500).json({ message: "Error adding to wishlist" });
  }
});

// Remove item from Wishlist
app.post("/wishlist/remove", async (req, res) => {
  try {
    const { userId, productId } = req.body;
    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      return res.status(404).json({ message: "Wishlist not found" });
    }

    wishlist.products = wishlist.products.filter(p => p.productId !== productId);
    await wishlist.save();

    res.status(200).json({ message: "Removed from wishlist", products: wishlist.products });

  } catch (error) {
    console.error("Error removing from wishlist:", error);
    res.status(500).json({ message: "Error removing from wishlist" });
  }
});

// --- Cart Routes ---
const Cart = require('./models/Cart');

// Get Cart items for a user
app.get("/cart/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    let cart = await Cart.findOne({ userId });

    // If no cart exists, return empty structure or create one (optional strategy)
    // Here we'll just return items: []
    if (!cart) {
      return res.status(200).json({ cartItems: [], totalAmount: 0 });
    }

    // Calculate total (optional backend calculation)
    const totalAmount = cart.products.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    res.status(200).json({ cartItems: cart.products, totalAmount });
  } catch (error) {
    console.error("Error fetching cart:", error);
    res.status(500).json({ message: "Error fetching cart" });
  }
});

// Add item to Cart
app.post("/cart/add", async (req, res) => {
  try {
    const { userId, product } = req.body;
    // user: userId string, product: { name, image, price, quantity?, productId? }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({ userId, products: [] });
    }

    // Check if item exists (by name or productId if available)
    // Using name as fallback unique identifier since current mock data lacks consistent IDs
    const existingItemIndex = cart.products.findIndex(p =>
      (p.productId && p.productId === product.productId) || (p.name === product.name)
    );

    if (existingItemIndex > -1) {
      // Item exists, increase quantity
      cart.products[existingItemIndex].quantity += (product.quantity || 1);
    } else {
      // New item
      cart.products.push({
        name: product.name,
        image: product.image,
        price: product.price,
        quantity: product.quantity || 1,
        productId: product.productId || new mongoose.Types.ObjectId().toString(),
        sellerId: product.sellerId // Save sellerId from request
      });
    }

    await cart.save();
    res.status(200).json({ message: "Item added to cart", cart: cart.products });

  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).json({ message: "Error adding to cart" });
  }
});

// Remove item from Cart
app.post("/cart/remove", async (req, res) => {
  try {
    const { userId, itemId } = req.body; // itemId is the _id of the product subdocument

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.products = cart.products.filter(item => item._id.toString() !== itemId && item.productId !== itemId);

    await cart.save();
    res.status(200).json({ message: "Item removed", cart: cart.products });

  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).json({ message: "Error removing from cart" });
  }
});

// Update item quantity (Inc/Dec)
app.post("/cart/update-quantity", async (req, res) => {
  try {
    const { userId, itemId, action } = req.body; // action: 'increase' | 'decrease'

    let cart = await Cart.findOne({ userId });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.products.find(p => p._id.toString() === itemId || p.productId === itemId);

    if (item) {
      if (action === 'increase') {
        item.quantity += 1;
      } else if (action === 'decrease') {
        if (item.quantity > 1) {
          item.quantity -= 1;
        } else {
          // If qty is 1 and decrease queried, maybe remove? Or stay at 1. keeping at 1 per typical logic.
          item.quantity = 1;
        }
      }
      await cart.save();
      res.status(200).json({ message: "Cart updated", cart: cart.products });
    } else {
      res.status(404).json({ message: "Item not found in cart" });
    }

  } catch (error) {
    console.error("Error updating cart:", error);
    res.status(500).json({ message: "Error updating cart" });
  }
});

// --- Middleware ---
const verifyToken = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access Denied. No token provided." });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ message: "Invalid Token" });
  }
};

// --- Coupon Routes ---

// Create Coupon (Admin/Seller)
app.post("/coupons", verifyToken, async (req, res) => {
  try {
    const { code, discountType, discountValue, minOrderValue, expiryDate, usageLimit, applicableRegions } = req.body;

    // Simple Admin Check (Role based or hardcoded email for now as per login logic)
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: "Admin access required" });
    }

    const newCoupon = new Coupon({
      code,
      discountType,
      discountValue,
      minOrderValue,
      expiryDate,
      usageLimit,
      applicableRegions
    });

    await newCoupon.save();
    res.status(201).json({ message: "Coupon created successfully", coupon: newCoupon });
  } catch (error) {
    console.error("Error creating coupon:", error);
    res.status(500).json({ message: "Error creating coupon", error: error.message });
  }
});

// Validate Coupon
app.post("/coupons/validate", async (req, res) => {
  try {
    const { code, cartTotal, region } = req.body;

    if (!code) return res.status(400).json({ message: "Coupon code required" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase() });

    if (!coupon) {
      return res.status(404).json({ message: "Invalid coupon code" });
    }

    if (!coupon.isActive) {
      return res.status(400).json({ message: "Coupon is inactive" });
    }

    if (new Date() > coupon.expiryDate) {
      return res.status(400).json({ message: "Coupon has expired" });
    }

    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      return res.status(400).json({ message: "Coupon usage limit exceeded" });
    }

    if (cartTotal < coupon.minOrderValue) {
      return res.status(400).json({ message: `Minimum order value of ${coupon.minOrderValue} required` });
    }

    if (coupon.applicableRegions && coupon.applicableRegions.length > 0 && region) {
      if (!coupon.applicableRegions.includes(region) && !coupon.applicableRegions.includes("Global")) {
        return res.status(400).json({ message: "Coupon not applicable in your region" });
      }
    }

    // Calculate Discount
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (cartTotal * coupon.discountValue) / 100;
      // Optional: Cap percentage discount? Not in requirements yet.
    } else {
      discountAmount = coupon.discountValue;
    }

    // Ensure discount doesn't exceed total
    if (discountAmount > cartTotal) {
      discountAmount = cartTotal;
    }

    res.status(200).json({
      valid: true,
      discountAmount,
      couponCode: coupon.code,
      message: "Coupon applied successfully"
    });

  } catch (error) {
    console.error("Error validating coupon:", error);
    res.status(500).json({ message: "Error validating coupon" });
  }
});

// --- Order Routes ---

// Order already imported at top

// Create a new Order
// Create a new Order (Transactional-like flow)
app.post("/orders", verifyToken, async (req, res) => {
  try {
    const { userId, products, totalAmount, shippingAddress, paymentMethod, paymentId, couponCode } = req.body;

    // 1. Transactional Checks
    // Validate User
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Validate Stock & Calculate Base Total
    let calculatedBaseTotal = 0;
    for (const item of products) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(400).json({ message: `Product not found: ${item.name}` });
      if (product.stock < item.quantity) return res.status(400).json({ message: `Insufficient stock for ${product.name}` });

      // Use price from request for consistency with frontend flow, or DB price for security.
      // Using DB price is better but if frontend uses special prices not in DB? 
      // Let's use item.price from body but maybe validate against DB price loosely if needed.
      // For now: Sum item.price * quantity
      calculatedBaseTotal += (item.price * item.quantity);
    }

    // 2. Coupon Validation & Calculation (Server-side)
    let expectedFinalAmount = calculatedBaseTotal;
    let discountAmount = 0;

    if (couponCode) {
      const coupon = await Coupon.findOne({ code: couponCode.toUpperCase() });
      if (coupon && coupon.isActive && new Date() <= coupon.expiryDate) {
        // Check usage limit
        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          return res.status(400).json({ message: "Coupon usage limit exceeded" });
        }

        // Check min order value
        if (calculatedBaseTotal < coupon.minOrderValue) {
          return res.status(400).json({ message: `Order value must be at least ${coupon.minOrderValue} for this coupon` });
        }

        // Calculate Discount
        if (coupon.discountType === 'percentage') {
          discountAmount = (calculatedBaseTotal * coupon.discountValue) / 100;
        } else {
          discountAmount = coupon.discountValue;
        }

        // Cap discount
        if (discountAmount > calculatedBaseTotal) discountAmount = calculatedBaseTotal;

        expectedFinalAmount = calculatedBaseTotal - discountAmount;

        // Increment usage
        coupon.usedCount += 1;
        await coupon.save();
      }
    }

    // Validate Total Amount integrity (allow tiny floating point diff)
    if (Math.abs(totalAmount - expectedFinalAmount) > 1.0) {
      // If mismatch, it might be due to delivery charges?
      // Frontend sends: finalAmount = totalAmount + delivery - discount.
      // My calcBaseTotal is just items.
      // We need to account for delivery charge (0 in frontend).
      // Let's assume delivery is 0 for matching.
      // If mismatched, we can reject or just warn.
      // For professional flow: REJECT.
      console.log(`Price Mismatch: Client sent ${totalAmount}, Server Calc ${expectedFinalAmount} (Base: ${calculatedBaseTotal})`);

      // Important: If Client includes Delivery Charge in totalAmount, but we don't know it here?
      // Frontend: finalAmount = subTotal - discount. subTotal = total + delivery.
      // I should probably accept the client's total if it's ABOVE expected (user paying more?) 
      // or just trust the Coupon logic for the discount amount storage.

      // Let's TRUST the `discountAmount` we calculated for the DB record, 
      // but maybe allow the `totalAmount` to be what the user agreed to pay.
      // BUT for Wallet Deduction, we must use the value passed.
      // If user hacked payload to pay 0?
      // So we MUST enforce `totalAmount >= expectedFinalAmount`.
      if (totalAmount < expectedFinalAmount - 1.0) {
        return res.status(400).json({ message: "Price mismatch. Please try again." });
      }
    }

    // 3. Handle Payment Deduction (Wallet)
    if (paymentMethod === "Reel2Cart Balance") {
      if (user.walletBalance < totalAmount) {
        return res.status(400).json({ message: "Insufficient wallet balance" });
      }
      user.walletBalance -= totalAmount;
      await user.save();
    }

    // 4. Deduct Stock
    for (const item of products) {
      await Product.findByIdAndUpdate(item.productId, { $inc: { stock: -item.quantity, views: 1 } });
    }

    // 5. Create Order
    const newOrder = new Order({
      userId,
      products,
      totalAmount, // This is the final amount paid
      couponCode,
      discountAmount,
      shippingAddress,
      paymentMethod,
      paymentId,
      status: paymentId || paymentMethod === "Reel2Cart Balance" ? "Paid" : "Processing",
      deliveryOtp: generateOTP() // Generate Secure Delivery Code
    });

    await newOrder.save();

    // 5. Update Cart: Remove only purchased items
    const cart = await Cart.findOne({ userId });
    if (cart) {
      // Filter out products that were just ordered
      const orderedProductIds = new Set(products.map(p => p.productId));
      cart.products = cart.products.filter(p => !orderedProductIds.has(p.productId));

      if (cart.products.length === 0) {
        await Cart.deleteOne({ userId });
      } else {
        await cart.save();
      }
    }

    // 6. Notify Sellers (New) & Send Email to Buyer
    // Group products by Seller and send notifications
    const sellerGroups = {};
    products.forEach(p => {
      if (p.sellerId) {
        if (!sellerGroups[p.sellerId]) sellerGroups[p.sellerId] = [];
        sellerGroups[p.sellerId].push(p.name);
      }
    });

    for (const [sellerId, productNames] of Object.entries(sellerGroups)) {
      // Find Seller User ID
      const seller = await Seller.findById(sellerId);
      if (seller && seller.userId) {
        // App Notification
        await sendNotification(
          seller.userId,
          "New Order Received! 🎉",
          `You have a new order for ${productNames.length} items: ${productNames.join(', ')}.`,
          "new_order",
          newOrder._id
        );
        // Email Notification
        if (seller.email) {
          const sellerEmailHtml = getSellerNewOrderTemplate(seller.sellerName, newOrder._id, productNames.join(', '));
          sendEmail(seller.email, "Action Required: New Order Received", sellerEmailHtml);
        }
      }
    }

    // Send Order Confirmation Email to Buyer
    const buyer = await User.findById(userId);
    if (buyer && buyer.email) {
      const emailHtml = getOrderConfirmationTemplate(newOrder, buyer.name);
      sendEmail(buyer.email, `Order Confirmation #${newOrder._id.toString().slice(-6)}`, emailHtml);
    }

    // Notify Admin
    notifyAdmin(
      "New Order Received",
      `Order #${newOrder._id} placed by ${userId}. Value: ${totalAmount}.`,
      'new_order'
    );

    res.status(201).json({ message: "Order placed successfully", order: newOrder, walletBalance: user.walletBalance });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ message: "Error creating order", error: error.message });
  }
});

// Get User Orders
app.get("/orders/:userId", async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId }).sort({ createdAt: -1 });
    res.status(200).json({ orders });
  } catch (error) {
    res.status(500).json({ message: "Error fetching orders", error: error.message });
  }
});
// Cancel Order
app.post("/orders/cancel", async (req, res) => {
  try {
    const { orderId } = req.body;
    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ message: "Cannot cancel order at this stage" });
    }

    order.status = 'Cancelled';
    await order.save();

    // Refund logic (simulated)
    if (order.paymentMethod === 'Reel2Cart Balance' || order.paymentId) {
      const user = await User.findById(order.userId);
      if (user) {
        user.walletBalance += order.totalAmount;
        await user.save();
      }
    }

    // Send Cancellation Email to Buyer
    const user = await User.findById(order.userId);
    if (user && user.email) {
      const cancelHtml = getOrderCancellationTemplate(order, user.name || "Customer");
      sendEmail(user.email, `Order Cancelled: #${order._id.toString().slice(-6)}`, cancelHtml);
    }

    // Notify Sellers about cancellation
    const products = order.products;
    const sellerGroups = {};
    products.forEach(p => { if (p.sellerId) sellerGroups[p.sellerId] = true; }); // Unique sellers

    for (const sellerId of Object.keys(sellerGroups)) {
      const seller = await Seller.findById(sellerId);
      if (seller && seller.email) {
        sendEmail(seller.email, `Order Cancelled #${order._id.toString().slice(-6)}`, `<p>Order #${order._id} has been cancelled by the buyer. Please do not ship.</p>`);
      }
    }

    // Notify Admin
    notifyAdmin(
      "Order Cancelled",
      `Order #${order._id} cancelled by user ${order.userId}. Total amount: ${order.totalAmount}.`,
      'order_cancelled',
      order._id
    );

    res.status(200).json({ message: "Order cancelled successfully", order });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ message: "Error cancelling order" });
  }
});

// Update Order Address
app.put("/orders/:orderId/address", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { address } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status === 'Shipped' || order.status === 'Delivered' || order.status === 'Cancelled') {
      return res.status(400).json({ message: "Cannot update address execution already in progress" });
    }

    order.shippingAddress = address;
    await order.save();

    res.status(200).json({ message: "Address updated successfully", order });
  } catch (error) {
    console.error("Error updating order address:", error);
    res.status(500).json({ message: "Error updating order address" });
  }
});

// Update Order Status (Seller/Admin) - Realtime Tracking
app.put("/orders/:orderId/status", async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body; // 'Shipped', 'Out for Delivery', 'Delivered'

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ message: "Order not found" });

    order.status = status;
    await order.save();

    // Notify Buyer
    let title = "Order Update 📦";
    let message = `Your order #${orderId.slice(-6)} status has been updated to ${status}.`;

    if (status === 'Shipped') {
      message = "Your order has been shipped! It's on the way.";
    } else if (status === 'Out for Delivery') {
      message = "Your order is out for delivery today. Please be ready to receive it.";
    } else if (status === 'Delivered') {
      message = "Your order has been delivered using our Contactless Delivery. Enjoy your purchase!";
      title = "Order Delivered ✔️";
    }

    await sendNotification(order.userId, title, message, "order_update", order._id);

    // Send Status Update Email
    const buyer = await User.findById(order.userId);
    if (buyer && buyer.email) {
      const emailHtml = getOrderStatusTemplate(order, status);
      sendEmail(buyer.email, `Order Update: ${status}`, emailHtml);
    }

    res.status(200).json({ message: "Order status updated", order });
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).json({ message: "Error updating status" });
  }
});

// Get Notifications
app.get("/notifications/:userId", async (req, res) => {
  try {
    const notifications = await Notification.find({ recipientId: req.params.userId }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications" });
  }
});

// Get Order Details by ID
app.get("/orders/detail/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ message: "Error fetching order details", error: error.message });
  }
});

// Delete Order
app.delete("/orders/:orderId", async (req, res) => {
  try {
    const { orderId } = req.params;
    const order = await Order.findByIdAndDelete(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({ message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ message: "Error deleting order" });
  }
});

// Seller already imported at top

// Send Seller Welcome Email
async function sendSellerWelcomeEmail(email, name, businessName) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Welcome to Reel2Cart Business!',
    html: `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h1 style="color: #E50914;">Welcome to Reel2Cart Business!</h1>
        <p>Dear ${name},</p>
        <p>Congratulations! Your seller account for <strong>${businessName}</strong> has been successfully created.</p>
        <p>You are now part of our growing community of sellers reaching millions of customers.</p>
        <p><strong>Next Steps:</strong></p>
        <ul>
            <li>Login to your seller portal (Coming Soon)</li>
            <li>List your products</li>
            <li>Start selling!</li>
        </ul>
        <p>If you have any questions, our support team is here to help.</p>
        <p>Best Regards,<br/>Team Reel2Cart</p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log("Seller welcome email sent to", email);
  } catch (error) {
    console.error("Error sending seller email:", error);
  }
}

// Register Seller
app.post("/seller/register", async (req, res) => {
  try {
    const { userId, businessName, sellerName, email, phone, gstin, businessAddress } = req.body;

    // Check if valid user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // --- Validation Logic ---
    let accountType = req.body.accountType || 'licensed'; // Default to licensed if not provided
    if (accountType === 'licensed') {
      const { gstin, businessPan, additionalProofId, additionalProofType } = req.body;

      // Ensure at least ONE proof is provided
      if (!gstin && !businessPan && !additionalProofId) {
        return res.status(400).json({ message: "At least one valid business proof (GSTIN, PAN, Udyam, or FSSAI) is required." });
      }

      // 1. Validate GSTIN if present
      if (gstin) {
        const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
        if (!gstRegex.test(gstin)) return res.status(400).json({ message: "Invalid GSTIN format." });
        const existing = await Seller.findOne({ gstin });
        if (existing) return res.status(400).json({ message: "GSTIN already registered." });
      }

      // 2. Validate PAN if present
      if (businessPan) {
        const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
        if (!panRegex.test(businessPan)) return res.status(400).json({ message: "Invalid Business PAN format." });
        const existing = await Seller.findOne({ businessPan });
        if (existing) return res.status(400).json({ message: "Business PAN already registered." });
      }

      // 3. Validate Udyam/FSSAI if present
      if (additionalProofId && (additionalProofType === 'Udyam Aadhar' || additionalProofType === 'FSSAI')) {
        // Basic length check
        if (additionalProofId.length < 5) return res.status(400).json({ message: "Invalid Proof ID." });
      }

      // Check Duplicates for User/Email
      const existingSeller = await Seller.findOne({ $or: [{ userId }, { email }] });
      if (existingSeller) {
        if (existingSeller.userId.toString() === userId) return res.status(400).json({ message: "You are already a registered seller." });
        if (existingSeller.email === email) return res.status(400).json({ message: "Email already registered." });
      }
    } else {
      // Local Business - Email must represent business
      const existingSeller = await Seller.findOne({ $or: [{ userId }, { email }] });
      if (existingSeller) return res.status(400).json({ message: "Seller account already exists." });
    }

    const newSeller = new Seller({
      userId,
      businessName,
      sellerName,
      email,
      phone,
      businessAddress,
      accountType,
      gstin: req.body.gstin?.toUpperCase(),
      businessPan: req.body.businessPan?.toUpperCase(),
      additionalProofType: req.body.additionalProofType,
      additionalProofId: req.body.additionalProofId?.toUpperCase(),
      isVerified: accountType === 'licensed', // Auto-verify licensed for demo, local needs approval
      approvalStatus: accountType === 'licensed' ? 'approved' : 'pending'
    });

    await newSeller.save();

    // --- Notifications ---
    // Welcome Email to Seller
    const welcomeHtml = getSellerWelcomeTemplate(sellerName, businessName);
    sendEmail(email, "Welcome to Seller Hub! 🚀", welcomeHtml);
    if (accountType !== 'licensed') {
      // 1. Notify Admin (for local sellers needing approval)
      notifyAdmin("New Seller Application", `Business '${businessName}' has applied for verification.`, 'new_seller');

      // 2. Notify User
      const userMail = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'ShopFlix Seller Application Received',
        html: `<p>Dear ${sellerName},</p><p>Your application for <strong>${businessName}</strong> is under review.</p>`
      };
      try { await transporter.sendMail(userMail); } catch (e) { }
    }

    res.status(201).json({
      message: accountType === 'licensed' ? "Seller account created successfully!" : "Application submitted for approval.",
      seller: newSeller
    });
  } catch (error) {
    console.error("Error registering seller:", error);
    res.status(500).json({ message: "Error creating seller account", error: error.message });
  }
});

const { verifyGSTIN, verifyPAN } = require('./services/verificationService');

// Validate Proof Logic (Real-time & Pre-check)
// Validate Proof Logic (Real-time & Pre-check)
app.post("/seller/validate-proof", async (req, res) => {
  try {
    const { proofType, proofId } = req.body;

    if (!proofId) return res.status(400).json({ valid: false, message: "Proof ID is required." });

    let isValid = false;
    let message = "";
    let verificationData = null;

    // 1. Check DB Duplicates first (fast & free)
    if (proofType === 'GSTIN') {
      const existing = await Seller.findOne({ gstin: proofId.toUpperCase() });
      if (existing) return res.status(200).json({ valid: false, message: "GSTIN already used by another seller." });

      // Basic Regex Check
      const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
      if (!gstRegex.test(proofId.toUpperCase())) return res.status(200).json({ valid: false, message: "Invalid GSTIN Format" });

      // Simulate External API Check (Placeholder for actual Govt API)
      // In production, call verifyGSTIN(proofId)
      isValid = true;
      message = "Valid GSTIN format available.";
      verificationData = { legalName: "Verified Business Ltd." };

    } else if (proofType === 'Business PAN') {
      const existing = await Seller.findOne({ businessPan: proofId.toUpperCase() });
      if (existing) return res.status(200).json({ valid: false, message: "PAN already used by another seller." });

      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(proofId.toUpperCase())) return res.status(200).json({ valid: false, message: "Invalid PAN Format" });

      isValid = true;
      message = "Valid PAN format available.";
    } else {
      // Udyam / FSSAI - just length check
      if (proofId.length > 5) {
        isValid = true;
        message = "Proof ID valid.";
      } else {
        return res.status(200).json({ valid: false, message: "Invalid Proof ID length." });
      }
    }

    res.status(200).json({ valid: isValid, message, verificationData });

  } catch (error) {
    console.error("Proof Validation Error:", error);
    res.status(500).json({ message: "Verification failed." });
  }

});

// Get Seller Analytics (Same as Dashboard but by SellerID)
// Get Seller Analytics (Same as Dashboard but by SellerID)
app.get("/seller/analytics/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { startDate, endDate } = req.query; // Date Filters

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // 1. Total Products (Always Total)
    const totalProducts = await Product.countDocuments({ sellerId: seller._id });

    // 2. Views (Always Total)
    const viewsAggregation = await Product.aggregate([
      { $match: { sellerId: seller._id } },
      { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAggregation[0]?.totalViews || 0;

    // 3. Sales & Earnings (Filtered by Date)
    const validStatuses = ['Paid', 'Processing', 'Shipped', 'Delivered'];

    // Construct Match Query
    const matchQuery = {
      "products.sellerId": seller._id,
      status: { $in: validStatuses }
    };

    if (startDate || endDate) {
      matchQuery.createdAt = {};
      if (startDate) matchQuery.createdAt.$gte = new Date(startDate);
      if (endDate) matchQuery.createdAt.$lte = new Date(endDate);
    }

    const salesAggregation = await Order.aggregate([
      { $unwind: "$products" },
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: { $multiply: ["$products.price", "$products.quantity"] } },
          totalSales: { $sum: "$products.quantity" },
          orderIds: { $addToSet: "$_id" }
        }
      }
    ]);

    const totalEarnings = salesAggregation[0]?.totalEarnings || 0;
    const totalSales = salesAggregation[0]?.totalSales || 0;
    const totalOrders = salesAggregation[0]?.orderIds?.length || 0;

    // 4. Chart Data (Dynamic)
    // If date filter exists, usage that range. Else default to 6 months.
    let chartMatchQuery = { ...matchQuery };

    if (!startDate && !endDate) {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      chartMatchQuery.createdAt = { $gte: sixMonthsAgo };
    }

    const chartAggregation = await Order.aggregate([
      { $unwind: "$products" },
      { $match: chartMatchQuery },
      {
        $group: {
          _id: { month: { $month: "$createdAt" }, year: { $year: "$createdAt" } },
          monthlyEarnings: { $sum: { $multiply: ["$products.price", "$products.quantity"] } }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    // Generate Labels
    const labels = [];
    const chartData = [];

    // Simplification: Always showing Monthly aggregation for now
    // Create 6 slots roughly checking the data or just mapping returned data
    if (startDate || endDate) {
      // Just map returned data for custom range
      chartAggregation.forEach(item => {
        const dateStr = new Date(item._id.year, item._id.month - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
        labels.push(dateStr);
        chartData.push(item.monthlyEarnings);
      });
    } else {
      // Default 6 Months fill
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        labels.push(d.toLocaleString('default', { month: 'short' }));
        const match = chartAggregation.find(c => c._id.month === d.getMonth() + 1 && c._id.year === d.getFullYear());
        chartData.push(match ? match.monthlyEarnings : 0);
      }
    }

    res.status(200).json({
      seller, totalEarnings, totalSales, totalOrders, totalProducts, totalViews, chartData, labels
    });

  } catch (error) {
    console.error("Error fetching analytics:", error);
    res.status(500).json({ message: "Error fetching analytics" });
  }
});

// Get User Stats (Orders, Wishlist, Coupons)
app.get("/user/:userId/stats", async (req, res) => {
  try {
    const { userId } = req.params;
    const orderCount = await Order.countDocuments({ userId });

    const wishlist = await Wishlist.findOne({ userId });
    const wishlistCount = wishlist ? wishlist.products.length : 0;

    // Placeholder for coupons
    const couponCount = 0;

    const user = await User.findById(userId);
    const followingCount = user && user.following ? user.following.length : 0;

    res.status(200).json({
      orderCount,
      wishlistCount,
      couponCount,
      followingCount
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching user stats" });
  }
});

// Save User Location
app.post("/user/location", async (req, res) => {
  try {
    const { userId, country, city, coordinates } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.country = country || 'Global';
    user.city = city;
    if (coordinates) {
      user.location = { type: 'Point', coordinates };
    }
    await user.save();
    res.json({ message: "Location updated", country: user.country });
  } catch (e) {
    res.status(500).json({ message: "Error updating location" });
  }
});

// ... existing endpoints ...

// --- SELLER DASHBOARD ENDPOINTS ---

// Update Seller Profile
app.put("/seller/profile/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { businessName, sellerName, phone, description, profileImage } = req.body;

    const updatedSeller = await Seller.findByIdAndUpdate(
      id,
      { businessName, sellerName, phone, description, profileImage },
      { new: true }
    );

    if (!updatedSeller) {
      return res.status(404).json({ message: "Seller not found" });
    }

    res.status(200).json({ message: "Profile updated successfully", seller: updatedSeller });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    res.status(500).json({ message: "Error updating profile" });
  }
});

// 2. Get Public Seller Profile (for Users to view)
app.get("/seller/profile/:sellerId/public", async (req, res) => {
  try {
    const { sellerId } = req.params;
    // sellerId here acts as the _id of the Seller document, NOT the userId
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Fetch Products (Items with NO video or empty video string)
    const products = await Product.find({
      sellerId: seller._id,
      $or: [
        { videoUrl: { $exists: false } },
        { videoUrl: "" },
        { videoUrl: null }
      ]
    }).sort({ createdAt: -1 });

    // Fetch Reels (Items WITH a video URL)
    const reels = await Product.find({
      sellerId: seller._id,
      videoUrl: { $exists: true, $ne: "" }
    }).sort({ createdAt: -1 });

    // Fetch associated User for following count
    const user = await User.findById(seller.userId);

    const stats = {
      followers: seller.followers ? seller.followers.length : 0,
      following: user && user.following ? user.following.length : 0,
      products: products.length,
      reels: reels.length
    };

    res.json({
      seller: {
        _id: seller._id,
        businessName: seller.businessName,
        sellerName: seller.sellerName,
        description: seller.description,
        profileImage: seller.profileImage,
        isVerified: seller.isVerified,
        followers: seller.followers || []
      },
      stats,
      products,
      reels
    });
  } catch (error) {
    console.error("Public Profile Error", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
});

// 3. Follow/Unfollow Seller
// 3. Follow/Unfollow Seller
app.post("/seller/follow/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { userId } = req.body;

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 1. Update Seller's Followers
    // Use findIndex ensuring properly string comparison so we don't duplicate or fail to remove
    const index = seller.followers.findIndex(id => id.toString() === userId);
    let isFollowing = false;

    if (index === -1) {
      seller.followers.push(userId); // Follow
      isFollowing = true;
    } else {
      seller.followers.splice(index, 1); // Unfollow
      isFollowing = false;
    }
    await seller.save();

    // 2. Update User's Following (Sync)
    // Same robust check for User's following list
    const followingIndex = user.following.findIndex(id => id.toString() === sellerId);
    if (isFollowing) {
      if (followingIndex === -1) user.following.push(sellerId);
    } else {
      if (followingIndex !== -1) user.following.splice(followingIndex, 1);
    }
    await user.save();

    res.json({ message: "Success", isFollowing, followersCount: seller.followers.length });
  } catch (error) {
    console.error("Follow Error", error);
    res.status(500).json({ message: "Error updating follow status" });
  }
});

// 4. Get User's Following List
app.get("/user/:userId/following", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate('following', 'businessName sellerName profileImage isVerified');
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.following);
  } catch (error) {
    res.status(500).json({ message: "Error fetching following list" });
  }
});

// 5. Get Seller's Followers List
app.get("/seller/:sellerId/followers", async (req, res) => {
  try {
    const { sellerId } = req.params;
    // Populate with User details
    const seller = await Seller.findById(sellerId).populate('followers', 'name email profileImage');
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller.followers);
  } catch (error) {
    res.status(500).json({ message: "Error fetching followers list" });
  }
});

// 6. Get Seller's Following List (Who the Seller follows)
app.get("/seller/:sellerId/following", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Fetch the User who owns this seller account
    const user = await User.findById(seller.userId).populate('following', 'businessName sellerName profileImage isVerified');
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json(user.following);
  } catch (error) {
    console.error("Seller Following Error", error);
    res.status(500).json({ message: "Error fetching following list" });
  }
});

// Get Seller Dashboard Stats
app.get("/seller/dashboard/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Find Seller
    const seller = await Seller.findOne({ userId });
    if (!seller) return res.status(404).json({ message: "Seller account not found." });

    // Find User to get 'Following' stats
    const user = await User.findById(userId);

    // Get Products Count
    const productsCount = await Product.countDocuments({ sellerId: seller._id });

    // Get Total Earnings (Mocked)
    const totalEarnings = 0;
    const totalOrders = 0;

    res.json({
      seller: {
        id: seller._id,
        businessName: seller.businessName,
        isVerified: seller.isVerified,
        approvalStatus: seller.approvalStatus,
        sellerName: seller.sellerName,
        accountType: seller.accountType,
        followers: seller.followers || [],
        following: user.following || [] // Use User's following list
      },
      stats: {
        products: productsCount,
        earnings: totalEarnings,
        orders: totalOrders,
        views: 1205
      }
    });

  } catch (error) {
    console.error("Dashboard Error:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// Get All Products (with filters)
app.get("/products", async (req, res) => {
  try {
    const { category, featured, limit, search, country } = req.query; // Added country
    const query = {};

    // Regional Filtering Logic (Professional)
    // If country is specific (e.g. 'India'), show 'India' AND 'Global' items.
    // If country is 'Global', show EVERYTHING (or just Global? usually everything from worldwide sellers).
    if (country && country !== 'Global') {
      console.log(`[API] Filtering products for region: ${country}`);
      query.$or = [
        { country: country },
        { country: 'Global' },
        // removed legacy fallback { country: { $exists: false } } for strict compliance
      ];
    } else {
      console.log(`[API] Showing Global/All products`);
      // If Global is selected (or no country provided), we show EVERYTHING to maximize discoverability.
      // User requested strictness: "If selected region does not match... won't suggest". 
      // This implies that if I select 'India', I see India + Global.
      // If I select 'Global', I see everything OR just Global products?
      // Standard e-commerce 'Global Store' often means 'International Shipping available'.
      // For now, we assume Global = Show All products.
    }

    if (category && category !== 'All') query.category = category;
    if (featured === 'true') query.isFeatured = true;

    // Search logic
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { description: searchRegex },
        { category: searchRegex }
      ];
    }

    const products = await Product.find(query)
      .populate('sellerId', 'businessName profileImage sellerName followers')
      .limit(parseInt(limit) || 20)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Fetch products error:", error);
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Get Reels (Products with videos)
app.get("/products/reels", async (req, res) => {
  try {
    // Fetch products that have a non-empty videoUrl
    const { country } = req.query;
    let query = { videoUrl: { $exists: true, $ne: "" } };

    if (country && country !== 'Global') {
      console.log(`[API] Filtering REELS for region: ${country}`);
      query.$and = [
        {
          $or: [
            { country: country },
            { country: 'Global' }
            // Strict mode: No legacy fallback
          ]
        }
      ];
    }

    const products = await Product.find(query)
      .populate('sellerId', 'businessName sellerName profileImage followers') // Populate Seller Info
      .limit(20)
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (error) {
    console.error("Error fetching reels:", error);
    res.status(500).json({ message: "Error fetching reels" });
  }
});

// Get Seller Products
app.get("/products/seller/:sellerId", async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.params.sellerId }).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Error fetching products" });
  }
});

// Add New Product
app.post("/products/add", async (req, res) => {
  try {
    const { sellerId, name, description, price, category, images, stock, videoUrl } = req.body;

    const missingFields = [];
    if (!sellerId) missingFields.push('sellerId');
    if (!name) missingFields.push('name');
    if (price === undefined || price === null) missingFields.push('price');
    if (!images || images.length === 0) missingFields.push('images');

    if (missingFields.length > 0) {
      return res.status(400).json({ message: `Please fill required fields: ${missingFields.join(', ')}` });
    }

    const newProduct = new Product({
      sellerId,
      name,
      description,
      price,
      category,
      images,
      stock,
      videoUrl
    });

    await newProduct.save();
    res.status(201).json({ message: "Product added successfully!", product: newProduct });

  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(500).json({ message: "Error adding product." });
  }
});

// Update Product
app.put("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const updatedProduct = await Product.findByIdAndUpdate(id, updates, { new: true });

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product updated successfully", product: updatedProduct });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(500).json({ message: "Error updating product" });
  }
});

// --- NEW SELLER API ENDPOINTS ---

// 1. Support Ticket
const SupportTicket = require("./models/SupportTicket");
app.post("/support/add", async (req, res) => {
  try {
    const { sellerId, subject, message } = req.body;
    const newTicket = new SupportTicket({ sellerId, subject, message });
    await newTicket.save();
    res.status(201).json({ message: "Support ticket submitted." });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error submitting ticket." });
  }
});

// 2. Promote Product (Toggle Featured)
app.put("/products/promote/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    product.isFeatured = !product.isFeatured;
    await product.save();

    res.json({ message: `Product ${product.isFeatured ? 'Promoted' : 'Un-promoted'}`, isFeatured: product.isFeatured });
  } catch (e) {
    res.status(500).json({ message: "Error updating promotion status." });
  }
});

// 3. Seller Orders
app.get("/seller/orders/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    // Find orders where at least one product belongs to this seller
    const orders = await Order.find({ "products.sellerId": sellerId })
      .sort({ createdAt: -1 })
      .lean();

    // Filter valid status if needed, or just return all to see history
    res.json(orders);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching orders." });
  }
});

// 4. Seller Analytics (Simple aggregation)
app.get("/seller/analytics/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const sellerObjectId = new mongoose.Types.ObjectId(sellerId);

    // Calculate total earnings
    const earningsAgg = await Order.aggregate([
      { $match: { "products.sellerId": sellerObjectId, status: { $in: ['Paid', 'Delivered'] } } },
      { $unwind: "$products" },
      { $match: { "products.sellerId": sellerObjectId } },
      { $group: { _id: null, total: { $sum: { $multiply: ["$products.price", "$products.quantity"] } } } }
    ]);

    // Monthly Earnings (last 6 months)
    // Note: This is a simplified example.

    res.json({
      totalEarnings: earningsAgg[0]?.total || 0,
      chartData: [500, 1200, 3000, 4500, 2000, 5000], // Mock for now, replace with real time-series agg if needed
      labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching analytics." });
  }
});

// 5. Delete Seller Account
app.delete("/seller/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;

    // 1. Delete Seller Document
    const seller = await Seller.findByIdAndDelete(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller account not found." });

    // 2. Delete Associated Products
    await Product.deleteMany({ sellerId });

    // 3. Optional: could also delete SupportTickets

    res.json({ message: "Seller account and products deleted successfully." });
  } catch (e) {
    console.error("Delete Seller Error:", e);
    res.status(500).json({ message: "Error deleting seller account." });
  }
});

// Toggle Like
app.post("/products/:id/like", async (req, res) => {
  try {
    const { userId } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const index = product.likes.indexOf(userId);
    if (index === -1) {
      product.likes.push(userId); // Like
    } else {
      product.likes.splice(index, 1); // Unlike
    }
    await product.save();
    res.json({ message: "Success", likes: product.likes });
  } catch (error) {
    res.status(500).json({ message: "Error toggling like" });
  }
});

// Add Comment
// Add Comment / Review
app.post("/products/:id/comment", async (req, res) => {
  try {
    const { userId, text, rating } = req.body; // Accept rating (1-5)

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const newComment = {
      userId,
      userName: user.name || "User",
      text,
      rating: rating ? Number(rating) : undefined,
      createdAt: new Date()
    };

    product.comments.push(newComment);

    // Recalculate Average Rating if rating provided
    if (rating) {
      const totalRatings = product.comments.reduce((acc, item) => acc + (item.rating || 0), 0);
      const ratedCount = product.comments.filter(item => item.rating > 0).length;

      if (ratedCount > 0) {
        product.rating = (totalRatings / ratedCount).toFixed(1);
        product.reviews = ratedCount; // Update total review count based on rated comments
      }
    } else {
      // Just increment reviews count if we consider every comment a 'review' (optional logic choice)
      // product.reviews += 1;
      // Keeping it strictly to rated reviews usually better for 'rating' field
    }

    await product.save();

    res.json({
      message: "Review added",
      comments: product.comments,
      rating: product.rating,
      reviews: product.reviews
    });

  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Error adding comment" });
  }
});

// Delete Product
app.delete("/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);

    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("Delete Product Error:", error);
    res.status(500).json({ message: "Error deleting product" });
  }
});

// --- ADMIN ROUTES ---
const Offer = require("./models/Offer");

// 1. Admin Stats
app.get("/admin/stats", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'user' });
    const totalSellers = await Seller.countDocuments();
    const pendingSellers = await Seller.countDocuments({ isVerified: false });
    const totalOrders = await Order.countDocuments();

    // Total Revenue
    const revenueAgg = await Order.aggregate([
      { $match: { status: { $in: ['Paid', 'Delivered'] } } },
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]);
    const totalRevenue = revenueAgg[0]?.total || 0;

    res.json({
      totalUsers,
      totalSellers,
      pendingSellers,
      totalOrders,
      totalRevenue
    });
  } catch (e) {
    console.error("Admin Stats Error:", e);
    res.status(500).json({ message: "Error fetching admin stats" });
  }
});

// 2. Get Pending Sellers
app.get("/admin/sellers/pending", async (req, res) => {
  try {
    const pendingSellers = await Seller.find({ isVerified: false }).sort({ createdAt: -1 });
    res.json(pendingSellers);
  } catch (e) {
    res.status(500).json({ message: "Error fetching pending sellers" });
  }
});

// 3. Verify/Reject Seller
app.put("/admin/seller/verify/:sellerId", async (req, res) => {
  try {
    const { sellerId } = req.params;
    const { action } = req.body; // 'approve' or 'reject'

    const seller = await Seller.findById(sellerId);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    if (action === 'approve') {
      seller.isVerified = true;
      seller.approvalStatus = 'approved';
    } else if (action === 'reject') {
      seller.isVerified = false;
      seller.approvalStatus = 'rejected';
    }
    await seller.save();

    res.json({ message: `Seller ${action}d successfully.`, seller });
  } catch (e) {
    res.status(500).json({ message: "Error updating seller status" });
  }
});

// 4. Manage Offers
app.get("/admin/offers", async (req, res) => {
  try {
    const offers = await Offer.find().sort({ createdAt: -1 });
    res.json(offers);
  } catch (e) {
    res.status(500).json({ message: "Error fetching offers" });
  }
});

app.post("/admin/offers/add", async (req, res) => {
  try {
    let { title, description, imageUrl, discountPercentage, couponCode } = req.body;

    // Sanitize
    if (!title || !imageUrl) {
      return res.status(400).json({ message: "Title and Image are required" });
    }

    if (discountPercentage === '' || discountPercentage === undefined) {
      discountPercentage = null;
    } else {
      discountPercentage = Number(discountPercentage);
    }

    if (couponCode === '') couponCode = null;

    const newOffer = new Offer({
      title,
      description,
      imageUrl,
      discountPercentage,
      couponCode
    });

    await newOffer.save();
    res.status(201).json({ message: "Offer created successfully", offer: newOffer });
  } catch (e) {
    console.error("Create Offer Error:", e);
    res.status(500).json({ message: e.message || "Error creating offer" });
  }
});

app.delete("/admin/offers/:id", async (req, res) => {
  try {
    await Offer.findByIdAndDelete(req.params.id);
    res.json({ message: "Offer deleted" });
  } catch (e) {
    res.status(500).json({ message: "Error deleting offer" });
  }
});

// Public Offers Endpoint
app.get("/offers", async (req, res) => {
  try {
    const offers = await Offer.find({ isActive: true }).sort({ createdAt: -1 });
    res.json(offers);
  } catch (e) {
    res.status(500).json({ message: "Error fetching offers" });
  }
});



// --- DELIVERY AGENT ENDPOINTS ---

// 0. Register Delivery Partner (Licensing)
app.post("/delivery/register", async (req, res) => {
  try {
    const { userId, licenseNumber, vehicleType, vehiclePlate } = req.body;

    const existing = await DeliveryPartner.findOne({ userId });
    if (existing) return res.status(400).json({ message: "Application already submitted." });

    const newPartner = new DeliveryPartner({
      userId,
      licenseNumber,
      vehicleType,
      vehiclePlate,
      verificationStatus: 'pending' // Admin must approve
    });

    await newPartner.save();

    // Notify Admin
    notifyAdmin("New Delivery Partner Application", `User ${userId} applied. License: ${licenseNumber}`, 'new_delivery_partner');

    res.status(201).json({ message: "Application Submitted. Pending Verification." });
  } catch (e) {
    res.status(500).json({ message: "Error submitting application" });
  }
});

// 0.1 Check Status
app.get("/delivery/status/:userId", async (req, res) => {
  try {
    const partner = await DeliveryPartner.findOne({ userId: req.params.userId }).populate('userId', 'name');
    if (!partner) return res.json({ registered: false });
    res.json({ registered: true, partner });
  } catch (e) {
    res.status(500).json({ message: "Error fetching status" });
  }
});

// 0.2 Toggle Online/Offline
app.post("/delivery/toggle-online", async (req, res) => {
  try {
    const { userId } = req.body;
    const partner = await DeliveryPartner.findOne({ userId });
    if (!partner) return res.status(404).json({ message: "Partner not found" });

    if (partner.verificationStatus !== 'approved') return res.status(403).json({ message: "Account not verified" });

    partner.isOnline = !partner.isOnline;
    await partner.save();
    res.json({ isOnline: partner.isOnline });
  } catch (e) {
    res.status(500).json({ message: "Error" });
  }
});

// 1. Get Available Jobs (For Agents)
// Orders that are 'Shipped' (by Seller) but not yet assigned to an agent?
// OR 'Ready to Ship' if we had that status.
// Assumption: Seller marks 'Shipped' -> It means ready for pickup or already moved.
// Let's assume: Seller marks 'Processing' -> 'Ready for Pickup'.
// Then Agent marks 'Picked Up' -> 'Shipped'.
// For compatibility with existing flow: 'Shipped' means "Handed over to logistics".
// So Agents look for 'Shipped' orders that have NO deliveryAgentId.
app.get("/delivery/available", async (req, res) => {
  try {
    // Find orders that are 'Shipped' or 'Processing' (depending on flow) and unassigned
    // For professional flow: Seller marks "Ready to Ship".
    // Here we'll stick to: Seller marks 'Processing' -> Agent picks up.
    // OR Seller updates to 'Shipped' -> Agent delivers.
    // Let's say: Orders with status 'Shipped' and no agent are waiting for "Last Mile Delivery".
    const orders = await Order.find({
      status: { $in: ['Shipped', 'Ready to Ship'] },
      deliveryAgentId: { $exists: false }
    }).populate('userId', 'name mobileNo shippingAddress'); // Agent needs address

    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// 2. Accept Job
app.post("/delivery/accept", async (req, res) => {
  try {
    const { orderId, agentId } = req.body;
    const order = await Order.findOneAndUpdate(
      { _id: orderId, deliveryAgentId: { $exists: false } },
      { deliveryAgentId: agentId },
      { new: true }
    );
    if (!order) return res.status(400).json({ message: "Order not available or already taken" });
    res.json({ message: "Job Accepted", order });
  } catch (e) {
    res.status(500).json({ message: "Error accepting job" });
  }
});

// 3. My Jobs
app.get("/delivery/my-jobs/:agentId", async (req, res) => {
  try {
    const orders = await Order.find({
      deliveryAgentId: req.params.agentId,
      status: { $ne: 'Delivered' } // Active jobs only
    }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) {
    res.status(500).json({ message: "Error fetching jobs" });
  }
});

// 4. Update Status (Agent)
app.post("/delivery/update-status", async (req, res) => {
  try {
    const { orderId, status } = req.body; // 'Out for Delivery'
    const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

    // Notify User
    await sendNotification(order.userId, "Delivery Update 🚚", `Your order is ${status}`, "order_update", order._id);

    // Send Email
    const user = await User.findById(order.userId);
    if (user && user.email) {
      const emailHtml = getOrderStatusTemplate(order, status);
      sendEmail(user.email, `Order Status: ${status}`, emailHtml);
    }

    res.json({ message: "Status updated", order });
  } catch (e) {
    res.status(500).json({ message: "Error updating status" });
  }
});

// 5. Complete Delivery (Secure OTP)
app.post("/delivery/complete", async (req, res) => {
  try {
    const { orderId, otp } = req.body;
    const order = await Order.findById(orderId);

    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.deliveryOtp !== otp) {
      return res.status(400).json({ message: "Invalid Security Code" });
    }

    order.status = 'Delivered';
    order.deliveryOtp = undefined; // Clear OTP
    await order.save();

    // Notify User & Seller
    await sendNotification(order.userId, "Delivered! 🎉", "Your package has been delivered successfully.", "order_update", order._id);

    // Update Seller Earnings/Stats if needed (already aggregating realtime)

    res.json({ message: "Delivery Verified & Completed", order });
  } catch (e) {
    res.status(500).json({ message: "Error completing delivery" });
  }
});

// --- MESSAGING ENDPOINTS ---

app.post("/messages/send", async (req, res) => {
  try {
    const { senderId, receiverId, message } = req.body;
    const newMessage = new Message({ senderId, receiverId, message });
    await newMessage.save();

    // Notify Receiver (Optional, but professional)
    // sendNotification(receiverId, "New Message", `You have a new message.`, "message", senderId);

    res.status(201).json(newMessage);
  } catch (error) {
    res.status(500).json({ message: "Error sending message" });
  }
});

app.get("/messages/:user1Id/:user2Id", async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;
    const messages = await Message.find({
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id }
      ]
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: "Error fetching messages" });
  }
});

// Get List of Conversations (Inbox)
app.get("/messages/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Aggregation to find recent conversations
    // 1. Find all messages where user is sender or receiver
    // 2. Sort by date desc
    // 3. Group by the OTHER user ID

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(userId) },
            { receiverId: new mongoose.Types.ObjectId(userId) }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
              "$receiverId",
              "$senderId"
            ]
          },
          lastMessage: { $first: "$message" },
          createdAt: { $first: "$createdAt" },
          otherUserId: {
            $first: {
              $cond: [
                { $eq: ["$senderId", new mongoose.Types.ObjectId(userId)] },
                "$receiverId",
                "$senderId"
              ]
            }
          }
        }
      },
      { $sort: { createdAt: -1 } }
    ]);

    // Populate User Details
    const populated = await User.populate(conversations, { path: "otherUserId", select: "name email" });

    // Populate Seller Details (if user is a seller) - Optional generally, but good for names
    // Ideally we just check User collection as everyone is a user.

    res.json(populated);

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "Error fetching conversations" });
  }
});

// --- AI ASSISTANT LOGIC ---
app.post("/ai/chat", async (req, res) => {
  try {
    const { userId, message } = req.body;
    const lowerMsg = message.toLowerCase();

    console.log(`[AI] Processing message from ${userId}: ${message}`);

    // Response Object
    let response = {
      text: "I'm still learning. Can you try asking about products or your orders?",
      suggestions: ["Track Order", "Show Popular", "Help"],
      products: []
    };

    // 1. ORDER TRACKING INTENT
    if (lowerMsg.includes("order") || lowerMsg.includes("track") || lowerMsg.includes("status")) {
      const orders = await Order.find({ userId }).sort({ createdAt: -1 }).limit(1);
      if (orders.length > 0) {
        const latestOrder = orders[0];
        response.text = `Your latest order #${latestOrder._id.toString().slice(-6)} is currently **${latestOrder.status}**.`;
        if (latestOrder.status === 'Delivered') {
          response.text += " Hope you enjoyed it! 😊";
        } else {
          response.text += ` Total amount: ₹${latestOrder.totalPrice}.`;
        }
      } else {
        response.text = "You haven't placed any orders yet. Start shopping and I'll track them for you! 🛍️";
      }
      return res.json(response);
    }

    // 2. PRODUCT DISCOVERY INTENT (Search)
    if (lowerMsg.includes("show") || lowerMsg.includes("buy") || lowerMsg.includes("looking for") || lowerMsg.includes("search")) {
      // Extract keyword (dumb extraction: remove stop words)
      const stopWords = ["show", "me", "i", "want", "to", "buy", "looking", "for", "search", "products", "a", "an", "the"];
      const keywords = lowerMsg.split(" ").filter(w => !stopWords.includes(w)).join(" ");

      if (keywords.length > 1) {
        const products = await Product.find({
          $or: [
            { name: { $regex: keywords, $options: 'i' } },
            { category: { $regex: keywords, $options: 'i' } },
            { description: { $regex: keywords, $options: 'i' } }
          ]
        }).limit(3);

        if (products.length > 0) {
          response.text = `Here are some specialized picks for "${keywords}":`;
          response.products = products;
        } else {
          response.text = `I couldn't find anything matching "${keywords}". Try browsing our categories!`;
        }
        return res.json(response);
      }
    }

    // 3. GREETING INTENT
    if (lowerMsg.includes("hi") || lowerMsg.includes("hello") || lowerMsg.includes("hey")) {
      const user = await User.findById(userId);
      const name = user ? user.name.split(' ')[0] : "Friend";
      response.text = `Hello ${name}! 👋 I'm your Reel2Cart AI Assistant. How can I help you shop today?`;
      return res.json(response);
    }

    // 4. HELP / SUPPORT INTENT
    if (lowerMsg.includes("help") || lowerMsg.includes("support")) {
      response.text = "I can help you:\n• Track your orders 📦\n• Find products 🔎\n• Check current deals 🏷️\n\nJust ask me!";
      return res.json(response);
    }

    // 5. DEALS / OFFERS
    if (lowerMsg.includes("deal") || lowerMsg.includes("offer") || lowerMsg.includes("discount")) {
      response.text = "Check out our 'Deals of the Day' on the home page! We have up to 50% off on Electronics right now. 🔥";
      return res.json(response);
    }

    // DEFAULT FALLBACK (With specific check for 'thank')
    if (lowerMsg.includes("thank")) {
      response.text = "You're welcome! Happy Shopping! 💖";
      return res.json(response);
    }

    res.json(response);

  } catch (e) {
    console.error("AI Error:", e);
    res.status(500).json({ text: "My brain is freezing... please try again later! ❄️" });
  }
});

// --- NEW ENDPOINTS FOR FOLLOWER/FOLLOWING LISTS ---

// 1. Get Seller Followers (Users who follow this seller)
app.get("/seller/:id/followers", async (req, res) => {
  try {
    const { id } = req.params;
    // Populate with User fields
    const seller = await Seller.findById(id).populate('followers', 'name profileImage email');
    if (!seller) return res.status(404).json({ message: "Seller not found" });
    res.json(seller.followers);
  } catch (error) {
    console.error("Error fetching followers:", error);
    res.status(500).json({ message: "Error fetching followers" });
  }
});

// 2. Get Seller Following (Other Sellers this seller follows)
app.get("/seller/:id/following", async (req, res) => {
  try {
    const { id } = req.params;
    const seller = await Seller.findById(id);
    if (!seller) return res.status(404).json({ message: "Seller not found" });

    // Find the User linked to this Seller, then populate 'following'
    // We assume 'following' in User model references 'Seller' (or User, handled by frontend)
    // Note: If 'following' refs User, it returns Users. If refs Seller, returns Sellers.
    // Based on app logic, users follow Sellers. So 'following' should ref Seller.
    const user = await User.findById(seller.userId).populate('following', 'businessName profileImage sellerName isVerified');

    if (!user) return res.status(404).json({ message: "User account not found" });

    res.json(user.following);
  } catch (error) {
    console.error("Error fetching following:", error);
    res.status(500).json({ message: "Error fetching following list" });
  }
});

// Start Server
app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running on port ${port}`);
});
