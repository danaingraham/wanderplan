# Authentication Setup Guide

This guide will help you set up Google OAuth and email-based password recovery for your Wanderplan application.

## 🚀 Quick Start

1. Copy the environment template:
   ```bash
   cp .env.example .env
   ```

2. Fill in your API keys (see detailed setup below)

3. Restart your development server:
   ```bash
   npm run dev
   ```

## 🔑 Google OAuth Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API and Google Identity API

### Step 2: Create OAuth 2.0 Credentials

1. Go to **APIs & Services** > **Credentials**
2. Click **Create Credentials** > **OAuth 2.0 Client IDs**
3. Choose **Web application**
4. Add authorized JavaScript origins:
   - `http://localhost:5173` (for development)
   - Your production domain (e.g., `https://yourapp.netlify.app`)
5. Add authorized redirect URIs:
   - `http://localhost:5173` (for development)
   - Your production domain
6. Copy the **Client ID** to your `.env` file:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

### Step 3: Test Google Sign-In

1. Start your dev server: `npm run dev`
2. Go to the login page
3. You should see a "Sign in with Google" button
4. Click it to test the integration

## 📧 Email Password Recovery Setup

### Option 1: Gmail App Password (Recommended for Development)

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Google Account Settings > Security > 2-Step Verification > App Passwords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Wanderplan" as the name
   - Copy the generated 16-character password

3. Update your `.env` file:
   ```
   VITE_EMAIL_SERVICE=gmail
   VITE_EMAIL_USER=your.email@gmail.com
   VITE_EMAIL_PASS=your_16_char_app_password
   VITE_EMAIL_FROM_NAME=Wanderplan
   ```

### Option 2: Other Email Providers

Update the `VITE_EMAIL_SERVICE` in your `.env`:
- `outlook` for Outlook/Hotmail
- `yahoo` for Yahoo Mail
- Custom SMTP configuration (requires backend modification)

### Step 3: Test Password Recovery

1. Go to login page and click "Forgot your password?"
2. Enter an email address
3. Check the browser console for the reset link (in development mode)
4. Click the reset link to test the flow

## 🔧 Development Mode Features

### Automatic Dev Login
- A "Dev Login" button appears only in development mode
- Automatically creates `dev@test.com` account with password `password`
- Great for quick testing without setting up OAuth

### Email Simulation
- Password reset emails are simulated in development
- Reset links appear in the browser console
- No actual emails are sent unless email service is configured

## 🚨 Security Considerations

### Production Setup
1. **Environment Variables**: Never commit real API keys to git
2. **HTTPS Only**: Google OAuth requires HTTPS in production
3. **Domain Verification**: Add your production domain to Google OAuth settings
4. **Email Security**: Use dedicated email service (SendGrid, AWS SES) for production

### Password Security
- Passwords are hashed using a simple demo method
- For production, implement proper password hashing (bcrypt, argon2)
- Add rate limiting for login attempts
- Consider implementing CAPTCHA for password reset

## 🧪 Testing the Features

### Test Google Sign-In
1. Configure Google OAuth credentials
2. Click "Sign in with Google" on login page
3. Complete Google OAuth flow
4. Should be automatically logged in and redirected to dashboard

### Test Password Recovery
1. Register a new account with email/password
2. Click "Forgot your password?" on login page
3. Enter the email address
4. Check console for reset link (development) or check email (production)
5. Follow reset link and enter new password
6. Should be able to login with new password

### Test Account Linking
1. Create account with email: `test@example.com`
2. Sign in with Google using same email: `test@example.com`
3. Should automatically link accounts and merge data

## 🐛 Troubleshooting

### Google Sign-In Not Working
- Check that `VITE_GOOGLE_CLIENT_ID` is set in `.env`
- Verify domain is added to Google OAuth settings
- Check browser console for errors
- Ensure you're using HTTPS in production

### Password Reset Not Working
- Check that email variables are set in `.env`
- Look for reset link in browser console (development mode)
- Verify Gmail App Password is correct (16 characters, no spaces)

### Session Issues
- Clear browser localStorage: `localStorage.clear()`
- Check that session isn't expired
- Verify user context is properly initialized

## 📱 User Experience

### For Your Users
- **Easy Google Sign-In**: One-click login with Google account
- **Password Recovery**: Simple email-based password reset
- **Account Linking**: Automatically links Google and email accounts
- **Persistent Sessions**: Stay logged in for 30 days
- **Secure**: Proper token-based password reset with expiration

### Development Benefits
- **Quick Testing**: Dev login button for rapid development
- **Email Simulation**: Test password reset without sending emails
- **Flexible Configuration**: Works with or without external services
- **Clear Logging**: Detailed console logs for debugging

## 🎯 Next Steps

1. **Set up Google OAuth** for seamless user login
2. **Configure email service** for password recovery
3. **Test both flows** thoroughly
4. **Deploy to production** with proper environment variables
5. **Monitor usage** and user feedback

Need help? Check the browser console for detailed logs and error messages!