# 🔧 Fix Production Environment on Vercel

## Current Issues on Production
- ❌ "Failed to fetch skins" error before 5 skins load
- ❌ Different behavior from localhost
- ⚠️ Environment variables might be missing

## 🚀 Steps to Fix Production

### 1. Update Vercel Environment Variables

Go to your Vercel dashboard: https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables

Add these environment variables:

```bash
# Database
DATABASE_URL="postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123456789@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# NextAuth
NEXTAUTH_URL="https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app"
NEXTAUTH_SECRET="your-production-secret-key-should-be-different-from-development"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://ixqjqhqjqhqjqhqjqhqj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTU5NzQsImV4cCI6MjA0OTUzMTk3NH0.example-key"

# PriceEmpire
PRICEMPIRE_API_KEY="3d5a32f3-2a0c-414e-b98e-17160197f254"
PRICEMPIRE_RATE_LIMIT="100"
PRICEMPIRE_TIMEOUT="10000"

# Environment
NODE_ENV="production"
DEBUG_PRICE_SERVICE="false"

# Feature Flags
ENABLE_REAL_TIME_UPDATES="true"
ENABLE_CONDITIONAL_ORDERS="true"
ENABLE_FLOAT_ANALYSIS="true"
ENABLE_ADVANCED_CHARTS="true"
```

### 2. Update next.config.js for Production

Make sure your `next.config.js` includes proper image domains:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'steamcdn-a.akamaihd.net',
      'community.akamai.steamstatic.com',
      'steamcommunity-a.akamaihd.net'
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig
```

### 3. Push Updated Code to GitHub

Make sure these files are committed and pushed:

```bash
git add .
git commit -m "Fix: Update API routes and environment configuration for production"
git push origin main
```

### 4. Redeploy on Vercel

After updating environment variables and pushing code:
1. Go to Vercel dashboard
2. Click "Redeploy" on your latest deployment
3. Or trigger automatic deployment by pushing to main

### 5. Test Production Deployment

Once redeployed, test these endpoints:

```bash
# Test skins API
curl https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/skins

# Test individual skin
curl https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/skins/1

# Test PriceEmpire integration
curl https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/test-pricempire
```

## 🔍 Debugging Production Issues

### Check Vercel Function Logs
1. Go to Vercel dashboard → Functions
2. Check the logs for any errors
3. Look for database connection issues

### Common Production Issues
- **CORS Issues**: Steam CDN images might be blocked
- **Database Connection**: Supabase connection string format
- **Environment Variables**: Missing or incorrect values
- **Build Issues**: TypeScript or build errors

### Alternative Image Solution
If Steam CDN images don't work in production, consider:
1. Using a proxy endpoint for images
2. Storing images in Vercel/Supabase storage
3. Using placeholder images for now

## 🎯 Expected Results After Fix

✅ Skins should load without "Failed to fetch skins" error
✅ Individual skin pages should work properly  
✅ Trading functionality should be accessible
✅ Test accounts should work for login

## 🚨 If Issues Persist

1. Check Vercel function logs for specific errors
2. Test database connection from production
3. Verify all environment variables are set correctly
4. Consider using mock data as fallback in production 