### Deployment Instructions

To make your app backend available globally (4G/5G):

1. **Sign up for Cloudinary** (Free) at [cloudinary.com](https://cloudinary.com/)
   - This seems extra, but it is **REQUIRED** because Vercel/Heroku cannot store files permanently.
   - Get your `Cloud Name`, `API Key`, and `API Secret`.

2. **Deploy to Vercel**:
   - Open a terminal in the `api` folder:
     ```bash
     cd api
     vercel login  # Follow instructions to log in
     vercel        # Run this to deploy
     ```
   - **Important**: When asked to set up Environment Variables during deployment (or in the Vercel Dashboard later), add:
     - `MONGO_URI`: (Copy from your `.env`)
     - `JWT_SECRET`: (Copy from your `.env`)
     - `EMAIL_USER`: ...
     - `EMAIL_PASS`: ...
     - `CLOUDINARY_CLOUD_NAME`: (From Step 1)
     - `CLOUDINARY_API_KEY`: (From Step 1)
     - `CLOUDINARY_API_SECRET`: (From Step 1)

3. **Update Frontend**:
   - Once deployed, Vercel will give you a URL (e.g., `https://api-reel2cart.vercel.app`).
   - Go to `config/apiConfig.js` in your project and update:
     ```javascript
     export const API_BASE_URL = 'https://your-new-vercel-url.vercel.app';
     ```
   - Re-build your Android app (`npx expo run:android --variant release`).

Your app will now work anywhere in the world!
