# 🚀 Vercel Deployment Instructions

## Step 1: Install Vercel CLI (if not already installed)
```bash
npm install -g vercel
```

## Step 2: Login to Vercel
```bash
vercel login
```

## Step 3: Set Environment Variables

Go to: https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables

Add these variables one by one:

**DATABASE_URL**
`postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123...`

**NEXTAUTH_SECRET**
`cs2-derivatives-production-secret-key-2024-ultra-s...`

**NEXTAUTH_URL**
`https://cs2market-prod-q3jivjspd-omeersahiiins-pro...`

**NEXT_PUBLIC_SUPABASE_URL**
`https://ixqjqhqjqhqjqhqjqhqj.supabase.co`

**NEXT_PUBLIC_SUPABASE_ANON_KEY**
`eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzd...`

**PRICEMPIRE_API_KEY**
`3d5a32f3-2a0c-414e-b98e-17160197f254`

**PRICEMPIRE_RATE_LIMIT**
`100`

**PRICEMPIRE_TIMEOUT**
`10000`

**NODE_ENV**
`production`

**DEBUG_PRICE_SERVICE**
`false`

**ENABLE_REAL_TIME_UPDATES**
`true`

**ENABLE_CONDITIONAL_ORDERS**
`true`

**ENABLE_FLOAT_ANALYSIS**
`true`

**ENABLE_ADVANCED_CHARTS**
`true`

**MAX_POSITION_SIZE**
`1000`

**MAX_LEVERAGE**
`10`

**MARGIN_REQUIREMENT**
`0.1`


## Step 4: Deploy
```bash
vercel --prod
```

## Step 5: Test Production
Once deployed, test these URLs:
- https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app
- https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/api/skins
- https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app/skins

## Expected Results:
✅ 5 skins should load without errors
✅ Individual skin pages should work
✅ Trading functionality should be accessible
✅ Login should work with test accounts

## Test Accounts:
- Email: omeersahiiin8@gmail.com
- Password: test123
- Balance: $10,000
