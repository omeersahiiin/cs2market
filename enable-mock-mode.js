const fs = require('fs');
const path = require('path');

console.log('🎭 Enabling Mock Mode for CS2 Trading Platform');
console.log('This allows the app to work without a database connection\n');

// Mock mode environment variables
const mockEnvContent = `# 🎭 CS2 Trading Platform - Mock Mode (Database-free)
# This configuration allows the app to work without a database

# ===== MOCK MODE CONFIGURATION =====
USE_MOCK_DATA=true
USE_MOCK_AUTH=true
NODE_ENV=development

# ===== NEXTAUTH CONFIGURATION =====
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=mock-secret-key-for-development

# ===== MOCK DATABASE (NOT USED) =====
DATABASE_URL=postgresql://mock:mock@localhost:5432/mock

# ===== SUPABASE (MOCK - NOT USED) =====
NEXT_PUBLIC_SUPABASE_URL=https://mock.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=mock-anon-key

# ===== PRICE API (STILL WORKS) =====
PRICEMPIRE_API_KEY=3d5a32f3-2a0c-414e-b98e-17160197f254
PRICEMPIRE_RATE_LIMIT=100
PRICEMPIRE_TIMEOUT=10000

# ===== FEATURE FLAGS =====
ENABLE_REAL_TIME_UPDATES=true
ENABLE_CONDITIONAL_ORDERS=true
ENABLE_FLOAT_ANALYSIS=true
ENABLE_ADVANCED_CHARTS=true

# ===== TRADING CONFIGURATION =====
MAX_POSITION_SIZE=1000
MAX_LEVERAGE=10
MARGIN_REQUIREMENT=0.1

# ===== DEBUG =====
DEBUG_PRICE_SERVICE=true
`;

try {
  // Create .env file
  const envPath = path.join(process.cwd(), '.env');
  
  // Backup existing .env if it exists
  if (fs.existsSync(envPath)) {
    const backupPath = `${envPath}.backup.${Date.now()}`;
    fs.copyFileSync(envPath, backupPath);
    console.log(`📋 Backed up existing .env to: ${path.basename(backupPath)}`);
  }
  
  // Write mock mode .env
  fs.writeFileSync(envPath, mockEnvContent);
  console.log('✅ Created .env file with mock mode configuration');
  
  console.log('\n🎉 Mock Mode Enabled Successfully!');
  console.log('\n📋 Test Accounts Available:');
  console.log('   • Email: omeersahiiin8@gmail.com');
  console.log('   • Password: test123');
  console.log('   • Balance: $10,000\n');
  console.log('   • Email: trader2@example.com');
  console.log('   • Password: test456');
  console.log('   • Balance: $15,000\n');
  
  console.log('🚀 You can now run: npm run dev');
  console.log('🌐 And visit: http://localhost:3000');
  console.log('\n✨ Features that work in mock mode:');
  console.log('   ✅ Login with test accounts');
  console.log('   ✅ Browse 5 sample skins with real images');
  console.log('   ✅ View skin details and trading data');
  console.log('   ✅ See price charts and order books');
  console.log('   ✅ Float analysis and wear data');
  console.log('   ✅ All UI components and navigation');
  
} catch (error) {
  console.error('❌ Failed to enable mock mode:', error.message);
  process.exit(1);
} 