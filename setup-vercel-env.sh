#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this after logging into Vercel CLI

echo "🔧 Setting up Vercel environment variables..."

echo "postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123456789@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1" | vercel env add DATABASE_URL production
echo "cs2-derivatives-production-secret-key-2024-ultra-secure" | vercel env add NEXTAUTH_SECRET production
echo "https://cs2market-prod-q3jivjspd-omeersahiiins-projects.vercel.app" | vercel env add NEXTAUTH_URL production
echo "https://ixqjqhqjqhqjqhqjqhqj.supabase.co" | vercel env add NEXT_PUBLIC_SUPABASE_URL production
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTU5NzQsImV4cCI6MjA0OTUzMTk3NH0.example-key" | vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
echo "3d5a32f3-2a0c-414e-b98e-17160197f254" | vercel env add PRICEMPIRE_API_KEY production
echo "100" | vercel env add PRICEMPIRE_RATE_LIMIT production
echo "10000" | vercel env add PRICEMPIRE_TIMEOUT production
echo "production" | vercel env add NODE_ENV production
echo "false" | vercel env add DEBUG_PRICE_SERVICE production
echo "true" | vercel env add ENABLE_REAL_TIME_UPDATES production
echo "true" | vercel env add ENABLE_CONDITIONAL_ORDERS production
echo "true" | vercel env add ENABLE_FLOAT_ANALYSIS production
echo "true" | vercel env add ENABLE_ADVANCED_CHARTS production
echo "1000" | vercel env add MAX_POSITION_SIZE production
echo "10" | vercel env add MAX_LEVERAGE production
echo "0.1" | vercel env add MARGIN_REQUIREMENT production

echo "✅ Environment variables setup complete!"
echo "🚀 Now run: vercel --prod"
