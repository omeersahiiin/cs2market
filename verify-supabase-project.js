#!/usr/bin/env node

/**
 * Verify Supabase Project Reference
 * Test different project references and find the correct one
 */

const https = require('https');
const dns = require('dns');

console.log('🔍 Verifying Supabase Project Reference\n');

const CURRENT_REF = 'saokqnnwdpghsztsscad';
const PASSWORD = 'B60ctvoybj%2B';

// Common typos or variations to test
const POSSIBLE_REFS = [
  'saokqnnwdpghsztsscad',  // Current
  'saokqnnwdpghsztsscad',  // Same (double check)
  // Add more if needed based on dashboard
];

async function testProjectAPI(ref) {
  console.log(`🌐 Testing project API: ${ref}`);
  
  return new Promise((resolve) => {
    const options = {
      hostname: `${ref}.supabase.co`,
      port: 443,
      path: '/rest/v1/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      if (res.statusCode === 401 || res.statusCode === 200) {
        console.log(`✅ ${ref}: API responding (${res.statusCode})`);
        resolve(true);
      } else {
        console.log(`❌ ${ref}: API returned ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (err) => {
      console.log(`❌ ${ref}: API failed - ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log(`❌ ${ref}: API timeout`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testDatabaseDNS(ref) {
  console.log(`🔍 Testing database DNS: db.${ref}.supabase.co`);
  
  return new Promise((resolve) => {
    dns.lookup(`db.${ref}.supabase.co`, (err, address) => {
      if (err) {
        console.log(`❌ db.${ref}.supabase.co: DNS failed`);
        resolve(false);
      } else {
        console.log(`✅ db.${ref}.supabase.co: DNS resolved -> ${address}`);
        resolve(true);
      }
    });
  });
}

async function testDatabaseConnection(ref) {
  console.log(`🔌 Testing database connection: ${ref}`);
  
  try {
    const { PrismaClient } = require('@prisma/client');
    const url = `postgresql://postgres:${PASSWORD}@db.${ref}.supabase.co:5432/postgres`;
    
    const prisma = new PrismaClient({
      datasources: { db: { url } }
    });

    await prisma.$connect();
    console.log(`✅ ${ref}: Database connection successful!`);
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ ${ref}: Query successful`);
    
    await prisma.$disconnect();
    return url;
    
  } catch (error) {
    console.log(`❌ ${ref}: Database connection failed`);
    return null;
  }
}

function displayManualCheck() {
  console.log('\n📋 MANUAL VERIFICATION STEPS:');
  console.log('');
  console.log('1. In your Supabase dashboard, check:');
  console.log('   - Project Reference (in URL and settings)');
  console.log('   - Database status (should show "Active" or "Healthy")');
  console.log('   - Any error messages or warnings');
  console.log('');
  console.log('2. In Settings > Database, verify:');
  console.log('   - Connection string format');
  console.log('   - Host name (should be db.[ref].supabase.co)');
  console.log('   - Password matches exactly');
  console.log('');
  console.log('3. Try the SQL Editor in dashboard:');
  console.log('   - Run: SELECT version();');
  console.log('   - If this fails, database is not ready');
  console.log('');
}

function displayAlternatives() {
  console.log('🔄 ALTERNATIVE SOLUTIONS:');
  console.log('');
  console.log('Option 1: Create New Project');
  console.log('- Sometimes projects get stuck during provisioning');
  console.log('- Create a fresh project and try again');
  console.log('');
  console.log('Option 2: Use Different Region');
  console.log('- Try creating project in different region');
  console.log('- Some regions may have faster provisioning');
  console.log('');
  console.log('Option 3: Contact Supabase Support');
  console.log('- If project is stuck for >30 minutes');
  console.log('- Use support chat in dashboard');
  console.log('');
  console.log('Option 4: Use Alternative Cloud Database');
  console.log('- PlanetScale (MySQL)');
  console.log('- Neon (PostgreSQL)');
  console.log('- Railway (PostgreSQL)');
}

async function main() {
  console.log(`🎯 Current project reference: ${CURRENT_REF}`);
  console.log(`🔗 Expected database host: db.${CURRENT_REF}.supabase.co`);
  console.log('');
  
  let workingRef = null;
  let workingUrl = null;
  
  for (const ref of POSSIBLE_REFS) {
    console.log(`\n🧪 Testing: ${ref}`);
    console.log('─'.repeat(50));
    
    // Test API
    const apiWorks = await testProjectAPI(ref);
    
    // Test DNS
    const dnsWorks = await testDatabaseDNS(ref);
    
    // Test Database (only if DNS works)
    if (dnsWorks) {
      const dbUrl = await testDatabaseConnection(ref);
      if (dbUrl) {
        workingRef = ref;
        workingUrl = dbUrl;
        break;
      }
    }
    
    console.log('');
  }
  
  if (workingRef) {
    console.log('🎉 SUCCESS! Found working database:');
    console.log(`Project: ${workingRef}`);
    console.log(`URL: ${workingUrl}`);
    console.log('');
    console.log('🚀 Update your .env.local with:');
    console.log(`DATABASE_URL="${workingUrl}?connection_limit=20&pool_timeout=20"`);
  } else {
    console.log('❌ No working database connection found');
    console.log('');
    displayManualCheck();
    displayAlternatives();
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 