# TODO: Email OTP Authentication Implementation

## Backend Implementation
- [x] Create User model (`api/models/User.js`) with email, otp, otpExpires, isVerified, createdAt fields
- [x] Set up `.env` file in `api/` with email credentials and JWT secret
- [x] Update `api/index.js`:
  - [x] Import dotenv, User model, and set up nodemailer with .env
  - [x] Add POST `/send-otp-signup` route: Generate OTP, save to DB, send email
  - [x] Add POST `/verify-otp-signup` route: Verify OTP, create user if valid
  - [x] Add POST `/send-otp-login` route: Check user exists, generate OTP, send email
  - [x] Add POST `/verify-otp-login` route: Verify OTP, return JWT token
- [x] Install missing dependencies (dotenv, mongoose if needed)

## Frontend Integration
- [x] Update `screens/LoginScreen.js`: Add API call to `/send-otp-login` on continue
- [x] Update `screens/RegisterScreen.js`: Add API call to `/send-otp-signup` on continue
- [x] Update `screens/VerifyScreenSignup.js`: Add API call to `/verify-otp-signup` on continue, navigate to Welcome on success
- [x] Update `screens/VerifyScreenSignin.js`: Add API call to `/verify-otp-login` on continue, navigate to Welcome on success

## Testing and Followup
- [x] Test backend APIs with Postman
- [x] Run backend server and test frontend integration
- [x] Ensure proper error handling and edge cases
- [x] Verify OTP expiration (5 minutes) and JWT generation
