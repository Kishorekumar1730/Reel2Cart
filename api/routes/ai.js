
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
