# 🚀 Vercel Environment Variables Setup Guide

## Step 1: Go to Vercel Dashboard
Open this link: https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables

## Step 2: Add Each Variable (Copy & Paste)

### Variable 1: DATABASE_URL
**Name:** `DATABASE_URL`
**Value:** 
```
postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123456789@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
```

### Variable 2: NEXTAUTH_SECRET  
**Name:** `NEXTAUTH_SECRET`
**Value:**
```
cs2-derivatives-production-secret-key-2024-ultra-secure
```

### Variable 3: NEXTAUTH_URL
**Name:** `NEXTAUTH_URL`
**Value:**
```
https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app
```

### Variable 4: NEXT_PUBLIC_SUPABASE_URL
**Name:** `NEXT_PUBLIC_SUPABASE_URL`
**Value:**
```
https://ixqjqhqjqhqjqhqjqhqj.supabase.co
```

### Variable 5: NEXT_PUBLIC_SUPABASE_ANON_KEY
**Name:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
**Value:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTU5NzQsImV4cCI6MjA0OTUzMTk3NH0.example-key
```

### Variable 6: PRICEMPIRE_API_KEY
**Name:** `PRICEMPIRE_API_KEY`
**Value:**
```
3d5a32f3-2a0c-414e-b98e-17160197f254
```

### Variable 7: PRICEMPIRE_RATE_LIMIT
**Name:** `PRICEMPIRE_RATE_LIMIT`
**Value:**
```
100
```

### Variable 8: PRICEMPIRE_TIMEOUT
**Name:** `PRICEMPIRE_TIMEOUT`
**Value:**
```
10000
```

### Variable 9: NODE_ENV
**Name:** `NODE_ENV`
**Value:**
```
production
```

### Variable 10: DEBUG_PRICE_SERVICE
**Name:** `DEBUG_PRICE_SERVICE`
**Value:**
```
false
```

### Variable 11: ENABLE_REAL_TIME_UPDATES
**Name:** `ENABLE_REAL_TIME_UPDATES`
**Value:**
```
true
```

### Variable 12: ENABLE_CONDITIONAL_ORDERS
**Name:** `ENABLE_CONDITIONAL_ORDERS`
**Value:**
```
true
```

### Variable 13: ENABLE_FLOAT_ANALYSIS
**Name:** `ENABLE_FLOAT_ANALYSIS`
**Value:**
```
true
```

### Variable 14: ENABLE_ADVANCED_CHARTS
**Name:** `ENABLE_ADVANCED_CHARTS`
**Value:**
```
true
```

### Variable 15: MAX_POSITION_SIZE
**Name:** `MAX_POSITION_SIZE`
**Value:**
```
1000
```

### Variable 16: MAX_LEVERAGE
**Name:** `MAX_LEVERAGE`
**Value:**
```
10
```

### Variable 17: MARGIN_REQUIREMENT
**Name:** `MARGIN_REQUIREMENT`
**Value:**
```
0.1
```

## Step 3: Save and Redeploy

After adding all variables:
1. Vercel will automatically redeploy your application
2. Wait for deployment to complete (2-3 minutes)
3. Test your production site

## Step 4: Test Production

Visit: https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app

**Expected Results:**
✅ 5 skins should load without errors
✅ No "Failed to fetch skins" error
✅ Individual skin pages should work
✅ Login should work with test accounts

**Test Account:**
- Email: `omeersahiiin8@gmail.com`
- Password: `test123`
- Balance: $10,000

## 🚨 Important Notes

1. **Copy exactly** - Don't add extra spaces or characters
2. **Environment should be "Production"** when adding variables
3. **Case sensitive** - Variable names must match exactly
4. **No quotes needed** - Vercel handles this automatically

## 🎯 Quick Verification

After setup, these API endpoints should work:
- https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/skins
- https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/health 