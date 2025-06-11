#!/usr/bin/env node

/**
 * Debug Supabase Connection Issues
 * Test multiple scenarios to find the problem
 */

const { PrismaClient } = require('@prisma/client');
const https = require('https');
const dns = require('dns');

console.log('🔍 Debugging Supabase Connection Issues\n');

const PASSWORD = 'B60ctvoybj+';
const ENCODED_PASSWORD = 'B60ctvoybj%2B';
const PROJECT_REF = 'saokqnnwdpghsztsscad';
const HOST = `db.${PROJECT_REF}.supabase.co`;

// Different connection string variations to test
const CONNECTION_VARIANTS = [
  {
    name: 'Basic (no params)',
    url: `postgresql://postgres:${ENCODED_PASSWORD}@${HOST}:5432/postgres`
  },
  {
    name: 'With SSL mode',
    url: `postgresql://postgres:${ENCODED_PASSWORD}@${HOST}:5432/postgres?sslmode=require`
  },
  {
    name: 'With connection limit',
    url: `postgresql://postgres:${ENCODED_PASSWORD}@${HOST}:5432/postgres?connection_limit=5`
  },
  {
    name: 'Minimal SSL',
    url: `postgresql://postgres:${ENCODED_PASSWORD}@${HOST}:5432/postgres?sslmode=prefer`
  }
];

async function testDNSResolution() {
  console.log('🌐 Testing DNS Resolution...');
  
  return new Promise((resolve) => {
    dns.lookup(HOST, (err, address, family) => {
      if (err) {
        console.log(`❌ DNS lookup failed: ${err.message}`);
        resolve(false);
      } else {
        console.log(`✅ DNS resolved: ${HOST} -> ${address} (IPv${family})`);
        resolve(true);
      }
    });
  });
}

async function testHTTPSConnection() {
  console.log('🔗 Testing HTTPS connection to Supabase...');
  
  return new Promise((resolve) => {
    const options = {
      hostname: `${PROJECT_REF}.supabase.co`,
      port: 443,
      path: '/',
      method: 'GET',
      timeout: 5000
    };

    const req = https.request(options, (res) => {
      console.log(`✅ HTTPS connection successful: ${res.statusCode}`);
      resolve(true);
    });

    req.on('error', (err) => {
      console.log(`❌ HTTPS connection failed: ${err.message}`);
      resolve(false);
    });

    req.on('timeout', () => {
      console.log('❌ HTTPS connection timeout');
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

async function testDatabaseConnection(url, name) {
  console.log(`🔌 Testing: ${name}`);
  console.log(`   URL: ${url.substring(0, 50)}...`);
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url }
      },
      log: ['error']
    });

    // Set a shorter timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Connection timeout (10s)')), 10000);
    });

    const connectPromise = prisma.$connect();
    
    await Promise.race([connectPromise, timeoutPromise]);
    
    console.log(`✅ ${name}: Connection successful`);
    
    // Quick test query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log(`✅ ${name}: Query successful`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log(`❌ ${name}: ${error.message}`);
    return false;
  }
}

async function checkSupabaseStatus() {
  console.log('📊 Checking Supabase project status...');
  
  try {
    const response = await fetch(`https://${PROJECT_REF}.supabase.co/rest/v1/`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.status === 401 || response.status === 200) {
      console.log('✅ Supabase API is responding (project is active)');
      return true;
    } else {
      console.log(`❌ Supabase API returned: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Supabase API check failed: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting comprehensive connection diagnostics...\n');
  
  // Test 1: DNS Resolution
  const dnsWorks = await testDNSResolution();
  console.log('');
  
  // Test 2: HTTPS Connection
  const httpsWorks = await testHTTPSConnection();
  console.log('');
  
  // Test 3: Supabase API Status
  const apiWorks = await checkSupabaseStatus();
  console.log('');
  
  // Test 4: Database connections
  console.log('🔌 Testing Database Connections...\n');
  
  let workingConnection = null;
  
  for (const variant of CONNECTION_VARIANTS) {
    const works = await testDatabaseConnection(variant.url, variant.name);
    if (works && !workingConnection) {
      workingConnection = variant.url;
    }
    console.log('');
  }
  
  // Summary
  console.log('📋 DIAGNOSTIC SUMMARY:');
  console.log(`DNS Resolution: ${dnsWorks ? '✅' : '❌'}`);
  console.log(`HTTPS Connection: ${httpsWorks ? '✅' : '❌'}`);
  console.log(`Supabase API: ${apiWorks ? '✅' : '❌'}`);
  console.log(`Database Connection: ${workingConnection ? '✅' : '❌'}`);
  console.log('');
  
  if (workingConnection) {
    console.log('🎉 SUCCESS! Found working connection:');
    console.log(workingConnection);
    console.log('');
    console.log('📝 Update your .env.local with:');
    console.log(`DATABASE_URL="${workingConnection}"`);
  } else {
    console.log('❌ No working database connection found');
    console.log('');
    console.log('🔧 POSSIBLE ISSUES:');
    
    if (!dnsWorks) {
      console.log('- DNS resolution failed (network/firewall issue)');
    }
    if (!httpsWorks) {
      console.log('- HTTPS connection failed (network/firewall issue)');
    }
    if (!apiWorks) {
      console.log('- Supabase project may not be fully initialized');
    }
    
    console.log('');
    console.log('💡 RECOMMENDATIONS:');
    console.log('1. Wait 5-10 minutes for Supabase project to fully initialize');
    console.log('2. Check your firewall/antivirus settings');
    console.log('3. Try from a different network (mobile hotspot)');
    console.log('4. Verify project reference in Supabase dashboard');
    console.log(`5. Current project: https://supabase.com/dashboard/project/${PROJECT_REF}`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 