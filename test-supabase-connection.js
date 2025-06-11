#!/usr/bin/env node

/**
 * Test Supabase Database Connection
 * Troubleshoot connection issues
 */

const { PrismaClient } = require('@prisma/client');

console.log('🧪 Testing Supabase Database Connection\n');

// Original connection string from user
const ORIGINAL_URL = 'postgresql://postgres:B60ctvoybj+@db.saokqnnwdpghsztsscad.supabase.co:5432/postgres';

// URL-encoded version (+ should be %2B in URLs)
const ENCODED_URL = 'postgresql://postgres:B60ctvoybj%2B@db.saokqnnwdpghsztsscad.supabase.co:5432/postgres';

// With connection parameters
const OPTIMIZED_URL = ENCODED_URL + '?connection_limit=20&pool_timeout=20&statement_timeout=30s';

console.log('🔍 Connection String Analysis:');
console.log('Original:', ORIGINAL_URL);
console.log('Encoded: ', ENCODED_URL);
console.log('Optimized:', OPTIMIZED_URL);
console.log('');

async function testConnection(url, name) {
  console.log(`🔌 Testing ${name}...`);
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: url
        }
      }
    });

    // Test basic connection
    await prisma.$connect();
    console.log(`✅ ${name}: Connection successful`);
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ ${name}: Query successful`);
    console.log(`   Database version: ${result[0].version.substring(0, 50)}...`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log(`❌ ${name}: Connection failed`);
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting connection tests...\n');
  
  // Test different connection string formats
  const tests = [
    { url: ORIGINAL_URL, name: 'Original URL' },
    { url: ENCODED_URL, name: 'URL-Encoded' },
    { url: OPTIMIZED_URL, name: 'Optimized' }
  ];
  
  let successfulUrl = null;
  
  for (const test of tests) {
    const success = await testConnection(test.url, test.name);
    if (success && !successfulUrl) {
      successfulUrl = test.url;
    }
    console.log('');
  }
  
  if (successfulUrl) {
    console.log('🎯 RECOMMENDED CONNECTION STRING:');
    console.log(successfulUrl);
    console.log('');
    console.log('📝 Update your .env.local file with:');
    console.log(`DATABASE_URL="${successfulUrl}"`);
    console.log('');
    console.log('🚀 Then run: npx prisma migrate deploy');
  } else {
    console.log('❌ All connection attempts failed');
    console.log('');
    console.log('🔧 TROUBLESHOOTING STEPS:');
    console.log('1. Check if Supabase project is running');
    console.log('2. Verify the password is correct');
    console.log('3. Check if your IP is allowed (Supabase should allow all by default)');
    console.log('4. Try connecting from Supabase dashboard SQL editor');
    console.log('');
    console.log('🌐 Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/saokqnnwdpghsztsscad');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 