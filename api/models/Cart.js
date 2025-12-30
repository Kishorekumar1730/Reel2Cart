const mongoose = require("mongoose");

const cartSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    products: [
        {
            name: {
                type: String,
                required: true,
            },
            image: {
                type: String,
                required: true,
            },
            price: {
                type: Number,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                default: 1,
            },
            productId: {
                type: String,
                required: false
            },
            sellerId: {
                type: String, // Storing as String/ObjectId reference to Seller
                required: false
            }
        },
    ],
});

const Cart = mongoose.model("Cart", cartSchema);

module.exports = Cart;
