#!/usr/bin/env node

/**
 * Supabase Environment Setup Script
 * Helps configure .env.local with Supabase database connection
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Setting up Supabase Environment Configuration\n');

const SUPABASE_CONNECTION_STRING = 'postgresql://postgres:B60ctvoybj+@db.saokqnnwdpghsztsscad.supabase.co:5432/postgres';
const SUPABASE_PROJECT_REF = 'saokqnnwdpghsztsscad';

// Optimized connection string with performance settings
const OPTIMIZED_DATABASE_URL = `${SUPABASE_CONNECTION_STRING}?connection_limit=20&pool_timeout=20&statement_timeout=30s`;

const ENV_CONTENT = `# 🚀 CS2 Derivatives Trading Platform - Environment Configuration
# Updated with Supabase Cloud Database

# ===== DATABASE CONFIGURATION =====
# Supabase PostgreSQL Database (Production-ready)
DATABASE_URL="${OPTIMIZED_DATABASE_URL}"

# ===== SUPABASE CONFIGURATION =====
# Get these from: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/api
SUPABASE_URL="https://${SUPABASE_PROJECT_REF}.supabase.co"
SUPABASE_ANON_KEY="your_supabase_anon_key_here"
SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_role_key_here"

# ===== NEXTAUTH CONFIGURATION =====
NEXTAUTH_URL="http://localhost:3001"
NEXTAUTH_SECRET="your-super-secret-nextauth-key-here-change-this-in-production"

# ===== PRICE DATA API CONFIGURATION =====
# PriceEmpire (CS2-specialized pricing) - RECOMMENDED
PRICEMPIRE_API_KEY="your_pricempire_api_key_here"
PRICEMPIRE_API_URL="https://api.pricempire.com/v1"
PRICEMPIRE_RATE_LIMIT="100"
PRICEMPIRE_TIMEOUT="5000"

# Steam Web API (FREE - 60 requests/5min)
STEAM_API_KEY="your_steam_api_key_here"
STEAM_API_URL="https://api.steampowered.com"
STEAM_RATE_LIMIT="12"
STEAM_TIMEOUT="3000"

# CSFloat API (FREE - 1000 requests/day)
CSFLOAT_API_KEY="your_csfloat_api_key_here"
CSFLOAT_API_URL="https://csfloat.com/api/v1"
CSFLOAT_RATE_LIMIT="50"
CSFLOAT_TIMEOUT="5000"

# SkinPort API (FREE - 100 requests/hour)
SKINPORT_API_KEY="your_skinport_api_key_here"
SKINPORT_API_URL="https://api.skinport.com/v1"
SKINPORT_RATE_LIMIT="2"
SKINPORT_TIMEOUT="5000"

# BitSkins API (FREE for price data)
BITSKINS_API_KEY="your_bitskins_api_key_here"
BITSKINS_SECRET="your_bitskins_secret_here"
BITSKINS_API_URL="https://bitskins.com/api/v1"
BITSKINS_RATE_LIMIT="10"
BITSKINS_TIMEOUT="5000"

# ===== PRICE SERVICE CONFIGURATION =====
# Service priority (1=highest, 5=lowest)
PRICE_SERVICE_PRIORITY="pricempire:1,csfloat:2,steam:3,skinport:4,bitskins:5"
PRICE_UPDATE_INTERVAL="30000"  # 30 seconds
PRICE_SERVICE_TIMEOUT="10000"  # 10 seconds
PRICE_SERVICE_RETRIES="3"
ENABLE_PRICE_CACHING="true"
CACHE_DURATION="60000"  # 1 minute

# ===== DEBUGGING & MONITORING =====
DEBUG_PRICE_SERVICE="false"
DEBUG_ORDER_MATCHING="false"
DEBUG_DATABASE_QUERIES="false"
LOG_LEVEL="info"  # error, warn, info, debug

# ===== TRADING CONFIGURATION =====
# Risk management
MAX_POSITION_SIZE="1000"
MAX_LEVERAGE="10"
MARGIN_REQUIREMENT="0.1"  # 10%
LIQUIDATION_THRESHOLD="0.05"  # 5%

# Order matching
ORDER_MATCHING_INTERVAL="1000"  # 1 second
MAX_ORDERS_PER_USER="100"
MIN_ORDER_SIZE="0.01"

# ===== PRODUCTION SETTINGS =====
NODE_ENV="development"
VERCEL_ENV="development"

# ===== SECURITY =====
# Change these in production!
JWT_SECRET="your-jwt-secret-change-in-production"
ENCRYPTION_KEY="your-encryption-key-change-in-production"

# ===== EXTERNAL SERVICES =====
# Email service (for notifications)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"

# Redis (for caching and real-time features)
REDIS_URL="redis://localhost:6379"

# ===== FEATURE FLAGS =====
ENABLE_REAL_TIME_UPDATES="true"
ENABLE_CONDITIONAL_ORDERS="true"
ENABLE_FLOAT_ANALYSIS="true"
ENABLE_ADVANCED_CHARTS="true"
ENABLE_SOCIAL_FEATURES="false"

# ===== ANALYTICS =====
GOOGLE_ANALYTICS_ID="your_ga_id_here"
MIXPANEL_TOKEN="your_mixpanel_token_here"

# ===== NOTES =====
# 1. Get Supabase keys from: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/api
# 2. PriceEmpire API key: Contact them for enterprise access
# 3. Steam API key: https://steamcommunity.com/dev/apikey
# 4. Never commit this file to git!
# 5. Update NEXTAUTH_SECRET and JWT_SECRET for production
`;

function createEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    // Check if .env.local already exists
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env.local already exists');
      console.log('📝 Creating backup as .env.local.backup');
      fs.copyFileSync(envPath, envPath + '.backup');
    }
    
    // Write new .env.local file
    fs.writeFileSync(envPath, ENV_CONTENT);
    console.log('✅ Created .env.local with Supabase configuration');
    
  } catch (error) {
    console.error('❌ Error creating .env.local:', error.message);
    console.log('\n📋 MANUAL SETUP REQUIRED:');
    console.log('Create a file named .env.local in your project root with this content:');
    console.log('\n' + '='.repeat(50));
    console.log(ENV_CONTENT);
    console.log('='.repeat(50));
    return false;
  }
  
  return true;
}

function displayNextSteps() {
  console.log('\n🎯 NEXT STEPS:');
  console.log('');
  console.log('1. Get your Supabase API keys:');
  console.log(`   https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}/settings/api`);
  console.log('');
  console.log('2. Update these values in .env.local:');
  console.log('   - SUPABASE_ANON_KEY');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('');
  console.log('3. Run database migration:');
  console.log('   npx prisma migrate deploy');
  console.log('   npx prisma db seed');
  console.log('');
  console.log('4. Test the connection:');
  console.log('   node migrate-to-cloud.js');
  console.log('');
  console.log('5. Start your development server:');
  console.log('   npm run dev');
  console.log('');
}

function displaySupabaseInfo() {
  console.log('📊 SUPABASE PROJECT INFO:');
  console.log(`Project Reference: ${SUPABASE_PROJECT_REF}`);
  console.log(`Database URL: ${SUPABASE_CONNECTION_STRING}`);
  console.log(`Supabase URL: https://${SUPABASE_PROJECT_REF}.supabase.co`);
  console.log(`Dashboard: https://supabase.com/dashboard/project/${SUPABASE_PROJECT_REF}`);
  console.log('');
}

// Main execution
function main() {
  displaySupabaseInfo();
  
  const success = createEnvFile();
  
  if (success) {
    console.log('');
    console.log('🔧 CONFIGURATION DETAILS:');
    console.log('✅ Database connection optimized for trading');
    console.log('✅ Connection pooling enabled (20 connections)');
    console.log('✅ Statement timeout set to 30 seconds');
    console.log('✅ All API configurations ready');
    console.log('✅ Performance settings optimized');
  }
  
  displayNextSteps();
  
  console.log('🚀 Your CS2 trading platform is ready for cloud database!');
}

if (require.main === module) {
  main();
}

module.exports = { main, ENV_CONTENT }; 