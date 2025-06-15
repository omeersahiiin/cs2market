#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔑 Binance API Setup for CS2 Derivatives Platform');
console.log('================================================\n');

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (!envExists) {
  console.log('📝 Creating .env file...');
  
  const envContent = `# 🚀 CS2 Derivatives Trading Platform - Environment Configuration
# Local Development Environment

# ===== DATABASE CONFIGURATION =====
DATABASE_URL="postgresql://postgres.oaobkrhfctwjoyibctun:b60ctvoybj.@aws-0-eu-central-1.pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres:b60ctvoybj.@db.oaobkrhfctwjoyibctun.supabase.co:5432/postgres"

# ===== NEXTAUTH CONFIGURATION =====
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cs2-derivatives-secret-key-development-only-change-in-production"

# ===== SUPABASE CONFIGURATION =====
NEXT_PUBLIC_SUPABASE_URL="https://oaobkrhfctwjoyibctun.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2JrcmhmY3R3am95aWJjdHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDIxODEsImV4cCI6MjA2NTIxODE4MX0.X1l5FAhHKtJVyXi5B57p6bpTtDN1Vanc9anlRbq6eec"

# ===== PRICE DATA API CONFIGURATION =====
PRICEMPIRE_API_KEY="3d5a32f3-2a0c-414e-b98e-17160197f254"
PRICEMPIRE_RATE_LIMIT="100"
PRICEMPIRE_TIMEOUT="10000"

# ===== BINANCE API CONFIGURATION =====
# Required for crypto deposit monitoring
# Get these from: https://www.binance.com/en/my/settings/api-management
BINANCE_API_KEY="your_binance_api_key_here"
BINANCE_SECRET_KEY="your_binance_secret_key_here"

# ===== DEVELOPMENT SETTINGS =====
NODE_ENV="development"
DEBUG_PRICE_SERVICE="true"

# ===== TRADING CONFIGURATION =====
MAX_POSITION_SIZE="1000"
MAX_LEVERAGE="10"
MARGIN_REQUIREMENT="0.1"
LIQUIDATION_THRESHOLD="0.05"

# ===== FEATURE FLAGS =====
ENABLE_REAL_TIME_UPDATES="true"
ENABLE_CONDITIONAL_ORDERS="true"
ENABLE_FLOAT_ANALYSIS="true"
ENABLE_ADVANCED_CHARTS="true"
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully!\n');
} else {
  console.log('📄 .env file already exists\n');
}

console.log('🔧 BINANCE API SETUP INSTRUCTIONS');
console.log('==================================\n');

console.log('1. 🌐 Go to Binance API Management:');
console.log('   https://www.binance.com/en/my/settings/api-management\n');

console.log('2. 🔑 Create a new API Key with these permissions:');
console.log('   ✅ Enable Reading');
console.log('   ✅ Enable Spot & Margin Trading (for deposit monitoring)');
console.log('   ❌ Disable Futures Trading');
console.log('   ❌ Disable Withdrawals\n');

console.log('3. 🔒 Security Settings:');
console.log('   ✅ Enable IP Access Restriction (recommended)');
console.log('   ✅ Add your server IP addresses');
console.log('   ✅ Enable API Key restrictions\n');

console.log('4. 📝 Update Environment Variables:');
console.log('   For LOCAL development:');
console.log('   - Edit the .env file in this directory');
console.log('   - Replace "your_binance_api_key_here" with your actual API key');
console.log('   - Replace "your_binance_secret_key_here" with your actual secret key\n');

console.log('   For VERCEL production:');
console.log('   - Go to: https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables');
console.log('   - Add: BINANCE_API_KEY = your_actual_api_key');
console.log('   - Add: BINANCE_SECRET_KEY = your_actual_secret_key\n');

console.log('5. 🧪 Test the API:');
console.log('   - Run: npm run dev');
console.log('   - Go to: http://localhost:3000/admin');
console.log('   - Click "Test Binance API" button\n');

console.log('⚠️  SECURITY WARNINGS:');
console.log('=====================================');
console.log('🔐 NEVER commit API keys to Git');
console.log('🔐 Use IP restrictions on Binance');
console.log('🔐 Only enable necessary permissions');
console.log('🔐 Regularly rotate your API keys');
console.log('🔐 Monitor API usage in Binance dashboard\n');

console.log('📋 REQUIRED PERMISSIONS FOR DEPOSIT MONITORING:');
console.log('===============================================');
console.log('✅ Spot Account (Read)');
console.log('✅ Wallet (Read) - for deposit history');
console.log('✅ Margin (Read) - for balance checking');
console.log('❌ Trading permissions NOT required\n');

console.log('🚀 Once configured, your platform will be able to:');
console.log('==================================================');
console.log('✅ Monitor crypto deposits automatically');
console.log('✅ Get real-time deposit confirmations');
console.log('✅ Update user balances instantly');
console.log('✅ Track deposit history');
console.log('✅ Support BTC, ETH, USDT, SOL deposits\n');

console.log('Need help? Check the admin panel at /admin for testing tools!'); 