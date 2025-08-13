# Setting Up Resend for Email Service

## Quick Setup Guide

### 1. Create a Resend Account
1. Go to [https://resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email address

### 2. Get Your API Key
1. Once logged in, go to the [API Keys page](https://resend.com/api-keys)
2. Create a new API key or copy the default one
3. Keep this key secure - you'll need it for the next step

### 3. Configure Your Environment

#### For Local Development:
1. Create a `.env` file in the root of your project (if it doesn't exist)
2. Add your Resend API key:
   ```
   VITE_RESEND_API_KEY=re_xxxxxxxxxxxxx
   ```

#### For Netlify Production:
1. Go to your Netlify dashboard
2. Navigate to Site Settings > Environment Variables
3. Add a new environment variable:
   - Key: `VITE_RESEND_API_KEY`
   - Value: Your Resend API key (starts with `re_`)
4. Save and redeploy your site

### 4. Test Email Sending
1. Try the "Forgot Password" feature on your login page
2. Enter your email address
3. You should receive a password reset email

## Important Notes

### Free Tier Limitations
- **100 emails per day** on the free plan
- Emails are sent from `onboarding@resend.dev` by default
- To send from your own domain, you need to verify it in Resend

### Custom Domain Setup (Optional)
If you want to send emails from your own domain:
1. Go to Resend Dashboard > Domains
2. Add your domain
3. Add the DNS records they provide to your domain registrar
4. Wait for verification (usually takes a few minutes)
5. Update the `from` address in `resendEmailService.ts`:
   ```typescript
   private from = 'Wanderplan <noreply@yourdomain.com>'
   ```

### Troubleshooting

#### Emails not sending?
1. Check that your API key is correctly set in environment variables
2. Check the browser console for error messages
3. Verify your Resend account is active and not rate-limited

#### In Production (Netlify)?
1. Make sure the environment variable is added in Netlify settings
2. Trigger a new deployment after adding the variable
3. Check Netlify function logs for any errors

## Security Notes
- Never commit your API key to Git
- Keep the `.env` file in `.gitignore`
- Use environment variables in production (Netlify, Vercel, etc.)
- Rotate your API key regularly for security

## Support
- Resend Documentation: https://resend.com/docs
- Resend Support: support@resend.com