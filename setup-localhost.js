#!/usr/bin/env node

/**
 * Setup Localhost Environment for CS2 Trading Platform
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

console.log('🚀 Setting up localhost environment for CS2 Trading Platform...\n');

// Environment variables for localhost
const ENV_CONTENT = `# 🚀 CS2 Derivatives Trading Platform - Environment Configuration

# ===== DATABASE CONFIGURATION =====
DATABASE_URL="postgresql://postgres.ixqjqhqjqhqjqhqjqhqj:Omer123456789@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# ===== NEXTAUTH CONFIGURATION =====
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="cs2-derivatives-secret-key-development-only-change-in-production"

# ===== SUPABASE CONFIGURATION =====
NEXT_PUBLIC_SUPABASE_URL="https://ixqjqhqjqhqjqhqjqhqj.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml4cWpxaHFqcWhxanFocWpxaHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5NTU5NzQsImV4cCI6MjA0OTUzMTk3NH0.example-key"

# ===== PRICE DATA API CONFIGURATION =====
# PriceEmpire (CS2-specialized pricing)
PRICEMPIRE_API_KEY="3d5a32f3-2a0c-414e-b98e-17160197f254"
PRICEMPIRE_RATE_LIMIT="100"
PRICEMPIRE_TIMEOUT="10000"

# ===== DEBUGGING =====
DEBUG_PRICE_SERVICE="true"
NODE_ENV="development"

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

async function main() {
  try {
    console.log('📝 Creating .env file...');
    
    // Check if .env exists
    const envPath = path.join(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      console.log('⚠️  .env file already exists, creating backup...');
      fs.copyFileSync(envPath, `${envPath}.backup.${Date.now()}`);
    }
    
    // Write new .env file
    fs.writeFileSync(envPath, ENV_CONTENT);
    console.log('✅ .env file created successfully');
    
    console.log('\n🔄 Setting up database...');
    
    // Run database commands
    const commands = [
      'npx prisma generate',
      'npx prisma db push',
      'npx prisma db seed'
    ];
    
    for (const command of commands) {
      console.log(`\n🔧 Running: ${command}`);
      await runCommand(command);
    }
    
    console.log('\n🎉 Localhost setup completed successfully!');
    console.log('\n📋 Test accounts created:');
    console.log('   • Email: omeersahiiin8@gmail.com');
    console.log('   • Password: test123');
    console.log('   • Balance: $10,000\n');
    console.log('   • Email: trader2@example.com');
    console.log('   • Password: test456');
    console.log('   • Balance: $15,000\n');
    
    console.log('🚀 You can now run: npm run dev');
    console.log('🌐 And visit: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

function runCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Command failed: ${command}`);
        console.error(error.message);
        reject(error);
        return;
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      if (stderr) {
        console.warn(stderr);
      }
      
      resolve();
    });
  });
}

main().catch(console.error); 