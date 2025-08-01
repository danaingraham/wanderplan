# Deploying Wanderplan to Netlify

## Prerequisites
- A Netlify account (free at netlify.com)
- Your code pushed to GitHub (✓ already done)

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (Recommended)

1. **Connect to Netlify**
   - Go to [app.netlify.com](https://app.netlify.com)
   - Click "Add new site" → "Import an existing project"
   - Choose "Deploy with GitHub"
   - Authorize Netlify to access your GitHub account

2. **Select Your Repository**
   - Find and select `danaingraham/wanderplan`
   - Netlify will automatically detect the build settings from `netlify.toml`

3. **Configure Environment Variables**
   - In Site Settings → Environment Variables, add:
     - `VITE_GOOGLE_MAPS_API_KEY` - Your Google Maps API key
     - `VITE_OPENAI_API_KEY` - Your OpenAI API key (optional)

4. **Deploy**
   - Click "Deploy site"
   - Netlify will build and deploy your app
   - You'll get a URL like `https://amazing-site-name.netlify.app`

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize and Deploy**
   ```bash
   netlify init
   netlify deploy --prod
   ```

## Post-Deployment

### Custom Domain (Optional)
- In Netlify dashboard → Domain settings
- Add your custom domain
- Update DNS settings as instructed

### Continuous Deployment
- Already configured! Every push to `main` branch will auto-deploy
- Preview deployments created for pull requests

### Environment Variables
Remember to set these in Netlify dashboard:
- `VITE_GOOGLE_MAPS_API_KEY` - Required for maps functionality
- `VITE_OPENAI_API_KEY` - Optional for AI features

## Troubleshooting

- **Build fails**: Check build logs in Netlify dashboard
- **Maps not working**: Verify Google Maps API key is set correctly
- **Routing issues**: The `_redirects` file handles React Router, should work automatically