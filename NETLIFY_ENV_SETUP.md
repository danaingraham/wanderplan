# Netlify Environment Variables Setup

## Required Environment Variables

You need to add these environment variables in your Netlify dashboard for the app to work properly:

### 1. Google Maps API Key (REQUIRED for photos and maps)
- **Variable Name:** `VITE_GOOGLE_MAPS_API_KEY`
- **Value:** Your Google Maps API key
- **Purpose:** Enables place search, photos, and map display

### 2. OpenAI API Key (OPTIONAL - for AI trip generation)
- **Variable Name:** `VITE_OPENAI_API_KEY`
- **Value:** Your OpenAI API key
- **Purpose:** Enables AI-powered trip itinerary generation

### 3. Resend API Key (OPTIONAL - for password reset emails)
- **Variable Name:** `VITE_RESEND_API_KEY`
- **Value:** Your Resend API key
- **Purpose:** Enables sending password reset emails

## How to Add Environment Variables in Netlify

1. Go to your [Netlify Dashboard](https://app.netlify.com)
2. Select your site (wanderplan)
3. Go to **Site Configuration** → **Environment variables**
4. Click **Add a variable**
5. Choose **Add a single variable**
6. Enter the key and value
7. Click **Create variable**
8. **Important:** Deploy your site again for changes to take effect

## Getting API Keys

### Google Maps API Key
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Geocoding API
4. Go to Credentials → Create Credentials → API Key
5. (Optional) Restrict the key to your domain for security

### OpenAI API Key
1. Go to [OpenAI Platform](https://platform.openai.com)
2. Sign in or create account
3. Go to API Keys
4. Create new secret key
5. Copy and save it (you won't see it again)

### Resend API Key
1. Go to [Resend](https://resend.com)
2. Sign up for free account
3. Go to API Keys
4. Copy the default key or create a new one

## Troubleshooting

### Photos not showing?
- Make sure `VITE_GOOGLE_MAPS_API_KEY` is set in Netlify
- Verify the API key has Places API enabled
- Check browser console for any API errors

### Maps not loading?
- Same as photos - needs Google Maps API key
- Check that Maps JavaScript API is enabled

### AI generation not working?
- Add `VITE_OPENAI_API_KEY` to Netlify
- Make sure you have API credits in OpenAI

### Password reset not sending emails?
- Add `VITE_RESEND_API_KEY` to Netlify
- Verify your Resend account is active

## Important Notes

- Environment variables starting with `VITE_` are exposed to the browser
- Never commit API keys to your repository
- After adding/changing variables, you must redeploy for changes to take effect
- Use the "Clear cache and deploy site" option if changes don't appear