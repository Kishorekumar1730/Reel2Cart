
const styles = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f4f4f4; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
  .header { background: #E50914; color: #ffffff; padding: 20px; text-align: center; }
  .header h1 { margin: 0; font-size: 24px; letter-spacing: 1px; }
  .content { padding: 30px; }
  .otp-box { background: #f8f9fa; border: 2px dashed #E50914; padding: 15px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #E50914; margin: 20px 0; border-radius: 5px; }
  .footer { background: #333; color: #aaa; padding: 15px; text-align: center; font-size: 12px; }
  .button { display: inline-block; background: #E50914; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 15px; }
  .order-details { width: 100%; border-collapse: collapse; margin-top: 15px; }
  .order-details th { text-align: left; border-bottom: 2px solid #ddd; padding: 10px; color: #555; }
  .order-details td { border-bottom: 1px solid #eee; padding: 10px; vertical-align: top; }
  .total-row { font-weight: bold; font-size: 18px; color: #000; }
  .status_badge { display: inline-block; padding: 5px 10px; border-radius: 15px; background: #eee; font-size: 12px; font-weight: bold; }
  .status_Delivered { background: #d4edda; color: #155724; }
  .status_Shipped { background: #cce5ff; color: #004085; }
`;

module.exports = {
  getOtpTemplate: (otp, language = 'English') => {
    // Basic multi-language support for title
    const titles = {
      English: "Verify Your Account",
      'தமிழ்': "உங்கள் கணக்கை சரிபார்க்கவும்",
      // Add others as needed
    };
    const title = titles[language] || titles.English;

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Reel2Cart</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p>Thank you for choosing Reel2Cart. Use the One-Time Password (OTP) below to complete your verification.</p>
            <div class="otp-box">${otp}</div>
            <p>This code is valid for 10 minutes. Do not share this code with anyone.</p>
          </div>
          <div class="footer">
            &copy; 2025 Reel2Cart. All rights reserved.
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getOrderConfirmationTemplate: (order, userName) => {
    const itemsHtml = order.products.map(p => `
      <tr>
        <td width="60%">
            <strong>${p.name}</strong><br>
            <span style="font-size: 12px; color: #777;">Quantity: ${p.quantity}</span>
        </td>
        <td align="right">₹${p.price * p.quantity}</td>
      </tr>
    `).join('');

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${userName}</strong>,</p>
            <p>Thank you for your order! We've received it and are getting it ready.</p>
            
            <div style="background: #fdfdfd; padding: 15px; border: 1px solid #eee; margin-top: 10px; border-radius: 5px;">
                <h3 style="margin-top: 0; color: #555;">Order ID: #${order._id.toString().slice(-6).toUpperCase()}</h3>
                <table class="order-details">
                    <thead>
                        <tr><th>Item</th><th align="right">Price</th></tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                        <tr>
                            <td align="right" style="padding-top: 15px;"><strong>Total</strong></td>
                            <td align="right" style="padding-top: 15px;" class="total-row">₹${order.totalAmount}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <p style="margin-top: 20px;">
                <strong>Shipping to:</strong><br>
                ${order.shippingAddress.name}<br>
                ${order.shippingAddress.street}, ${order.shippingAddress.city}<br>
                ${order.shippingAddress.postalCode}
            </p>

            <center>
                <a href="https://reel2cart.app/orders/${order._id}" class="button">Track Order</a>
            </center>
          </div>
          <div class="footer">
            Need help? Contact support@reel2cart.com
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getOrderStatusTemplate: (order, status) => {
    let message = `Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been updated.`;
    let btnText = "View Order";

    if (status === 'Shipped') {
      message = `Good news! Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been shipped and is on its way.`;
      btnText = "Track Shipment";
    } else if (status === 'Delivered') {
      message = `Your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been delivered. We hope you enjoy your purchase!`;
      btnText = "Rate Product";
    }

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Update</h1>
          </div>
          <div class="content">
            <center>
                <h2 class="status_badge status_${status}">${status.toUpperCase()}</h2>
            </center>
            <p style="font-size: 16px; margin-top: 20px;">${message}</p>
            
            <center>
                <a href="https://reel2cart.app/orders/${order._id}" class="button">${btnText}</a>
            </center>
          </div>
          <div class="footer">
            &copy; 2025 Reel2Cart.
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getLoginAlertTemplate: (name, time) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background: #333;">
            <h1>Security Alert</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>We noticed a new login to your Reel2Cart account.</p>
            <p><strong>Time:</strong> ${new Date(time).toLocaleString()}</p>
            <p>If this was you, you can ignore this email. If you did not log in, please secure your account immediately.</p>
          </div>
          <div class="footer">
             Reel2Cart Security Team
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getWelcomeTemplate: (name) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header">
             <h1>Welcome to Reel2Cart! 🎬</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Welcome to the future of shopping! We are thrilled to have you on board.</p>
            <p>Explore trending reels, discover amazing products, and shop seamlessly.</p>
            <center>
                <a href="https://reel2cart.app" class="button">Start Shopping</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getOrderCancellationTemplate: (order, name) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background: #D32F2F;">
            <h1>Order Cancelled</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>As requested, your order <strong>#${order._id.toString().slice(-6).toUpperCase()}</strong> has been successfully cancelled.</p>
            <p>If you paid online, your refund will be processed within 5-7 business days.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getSellerNewOrderTemplate: (sellerName, orderId, productName) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background: #2E7D32;">
            <h1>You have a new order! 🎉</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${sellerName}</strong>,</p>
            <p>Great news! You received a new order <strong>#${orderId.toString().slice(-6).toUpperCase()}</strong>.</p>
            <p style="font-weight: bold; font-size: 16px;">Items:</p>
            <p>${productName}</p>
            <p>Please pack and ship the item as soon as possible.</p>
            <center>
                <a href="https://seller.reel2cart.app/orders" class="button">Go to Dashboard</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getSellerWelcomeTemplate: (name, businessName) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome to Seller Hub! 🚀</h1>
          </div>
          <div class="content">
            <p>Hi <strong>${name}</strong>,</p>
            <p>Congratulations! Your business <strong>${businessName}</strong> is now registered on Reel2Cart.</p>
            <p>You can now start adding products and reaching millions of customers through our video-first platform.</p>
            <center>
                <a href="https://seller.reel2cart.app" class="button">Access Seller Dashboard</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getErrorTemplate: (errorMsg) => {
    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
           <div class="header" style="background: #333;">
            <h1>Reel2Cart Alert</h1>
          </div>
          <div class="content">
            <h2>Something went wrong</h2>
            <p>${errorMsg}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  getAdminNotificationTemplate: (title, message, type) => {
    let color = '#333';
    if (type === 'new_order') color = '#2E7D32'; // Green
    if (type === 'new_seller') color = '#FF9800'; // Orange
    if (type === 'cancellation') color = '#D32F2F'; // Red

    return `
      <!DOCTYPE html>
      <html>
      <head><style>${styles}</style></head>
      <body>
        <div class="container">
          <div class="header" style="background: ${color};">
            <h1>Admin Alert: ${type.replace('_', ' ').toUpperCase()}</h1>
          </div>
          <div class="content">
            <h2>${title}</h2>
            <p style="font-size: 16px;">${message}</p>
            <p style="color: #777; font-size: 12px; margin-top: 30px;">
                This is an automated system notification for Reel2Cart Administrators.
            </p>
            <center>
                <a href="https://admin.reel2cart.app" class="button">Open Admin Dashboard</a>
            </center>
          </div>
        </div>
      </body>
      </html>
    `;
  }
};
