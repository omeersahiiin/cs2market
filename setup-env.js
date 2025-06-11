#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envTemplate = `# CS2 DERIVATIVES API KEYS
CSFLOAT_API_KEY=your_csfloat_api_key_here
STEAM_API_KEY=your_steam_api_key_here

# =====================================
# ADDITIONAL PRICE DATA SOURCES
# =====================================

# SkinPort API (FREE TIER AVAILABLE)
SKINPORT_API_KEY=your_skinport_api_key_here
SKINPORT_API_URL=https://api.skinport.com/v1

# BitSkins API (FREE FOR PRICE DATA)
BITSKINS_API_KEY=your_bitskins_api_key_here
BITSKINS_SECRET=your_bitskins_secret_here

# DMarket API (OPTIONAL)
DMARKET_API_KEY=your_dmarket_api_key_here

# =====================================
# PRICE SERVICE CONFIGURATION
# =====================================

# Primary price source (csfloat, steam, skinport, bitskins)
PRIMARY_PRICE_SOURCE=csfloat

# How often to update prices (30 seconds = 30000ms)
PRICE_UPDATE_INTERVAL=30000

# Enable/disable price sources
ENABLE_STEAM_PRICES=true
ENABLE_CSFLOAT_PRICES=true
ENABLE_SKINPORT_PRICES=true
ENABLE_BITSKINS_PRICES=false

# Rate limiting (requests per minute)
STEAM_RATE_LIMIT=60
CSFLOAT_RATE_LIMIT=100
SKINPORT_RATE_LIMIT=100
BITSKINS_RATE_LIMIT=120

# =====================================
# DEVELOPMENT SETTINGS
# =====================================
DEBUG_PRICE_SERVICE=true
LOG_LEVEL=info

# Price aggregation settings
MIN_PRICE_SOURCES=2
PRICE_DEVIATION_THRESHOLD=0.15

# Fallback to mock data if all APIs fail
FALLBACK_TO_MOCK=true`;

console.log('🔧 Setting up environment configuration...');

// Create backup of existing .env.local
if (fs.existsSync('.env.local')) {
    fs.copyFileSync('.env.local', '.env.local.backup');
    console.log('📁 Backed up existing .env.local to .env.local.backup');
}

// Write new configuration
fs.writeFileSync('.env.local', envTemplate);
console.log('✅ Created .env.local with complete API configuration');

console.log('\n🚀 Next steps:');
console.log('1. Get your API keys from the platforms');
console.log('2. Replace the placeholder values in .env.local');
console.log('3. Run: npm run dev');
console.log('\n📖 See SETUP_INSTRUCTIONS.md for detailed API setup guide'); 