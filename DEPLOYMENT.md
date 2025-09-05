# 🎵 Runner's Pace Music Generator - Deployment Guide

## 🚀 Quick Deploy to Vercel (Recommended)

### Prerequisites
- GitHub account
- Spotify Developer account
- Your Spotify Client ID and Secret

### Step 1: Deploy to Vercel
1. **Push to GitHub** (if not already):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Deploy with Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Sign up/login with GitHub
   - Click "New Project"
   - Import your `runningbeats` repository
   - Click "Deploy"

### Step 2: Configure Environment Variables
In your Vercel dashboard:
1. Go to your project → Settings → Environment Variables
2. Add these variables:
   - `SPOTIFY_CLIENT_ID` = your Spotify client ID
   - `SPOTIFY_CLIENT_SECRET` = your Spotify client secret
   - `SPOTIFY_REDIRECT_URI` = `https://your-app-name.vercel.app/api/spotify/callback`
   - `APP_ORIGIN` = `https://your-app-name.vercel.app`
   - `NEXTAUTH_SECRET` = generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` = `https://your-app-name.vercel.app`

### Step 3: Update Spotify App Settings
1. Go to [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)
2. Edit your app settings
3. Add to "Redirect URIs": `https://your-app-name.vercel.app/api/spotify/callback`
4. Save settings

### Step 4: Redeploy
- In Vercel dashboard, go to Deployments tab
- Click "Redeploy" to apply environment variables

## 🎯 Your app will be live at: `https://your-app-name.vercel.app`

---

## Alternative: Netlify

1. Connect GitHub repo to Netlify
2. Set build command: `npm run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard
5. Update Spotify redirect URI accordingly

## Alternative: Railway

1. Connect GitHub repo to Railway
2. Add environment variables
3. Deploy automatically on push

## Custom Domain (Optional)
- In Vercel: Project Settings → Domains → Add your domain
- Update environment variables to use your custom domain
- Update Spotify redirect URI to your custom domain
