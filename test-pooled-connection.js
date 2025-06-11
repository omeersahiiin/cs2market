#!/usr/bin/env node

/**
 * Test Supabase Pooled Connection
 * Try both transaction and session poolers
 */

const { PrismaClient } = require('@prisma/client');

console.log('🔄 Testing Supabase Pooled Connections\n');

const PASSWORD = 'B60ctvoybj';
const PROJECT_REF = 'oaobkrhfctwjoyibctun';

// Different connection options
const connections = {
  direct: `postgresql://postgres:${PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  transaction_pooler: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:6543/postgres`,
  session_pooler: `postgresql://postgres.${PROJECT_REF}:${PASSWORD}@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
};

async function testConnection(name, url) {
  console.log(`🧪 Testing ${name}...`);
  console.log(`   URL: ${url.replace(PASSWORD, '***')}`);
  
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url }
      }
    });

    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ Query successful!`);
    console.log(`   PostgreSQL: ${result[0].version.substring(0, 50)}...`);
    
    await prisma.$disconnect();
    return { success: true, url };
    
  } catch (error) {
    console.log(`❌ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log('🎯 Testing all available connection methods:\n');
  
  const results = [];
  
  for (const [name, url] of Object.entries(connections)) {
    const result = await testConnection(name, url);
    results.push({ name, ...result });
    console.log(''); // Empty line between tests
  }
  
  console.log('📊 RESULTS SUMMARY:\n');
  
  const working = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  if (working.length > 0) {
    console.log('✅ WORKING CONNECTIONS:');
    working.forEach(r => {
      console.log(`   ${r.name}: ${r.url.replace(PASSWORD, '***')}`);
    });
    
    console.log('\n🚀 RECOMMENDED FOR .env.local:');
    const best = working[0]; // Use first working connection
    const optimizedUrl = `${best.url}?connection_limit=20&pool_timeout=20&statement_timeout=30s`;
    console.log(`DATABASE_URL="${optimizedUrl}"`);
    
    console.log('\n📝 Creating .env.local with working connection...');
    const fs = require('fs');
    const envContent = `# Database Configuration
DATABASE_URL="${optimizedUrl}"

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://${PROJECT_REF}.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9hb2JrcmhmY3R3am95aWJjdHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2NDIxODEsImV4cCI6MjA2NTIxODE4MX0.X1l5FAhHKtJVyXi5B57p6bpTtDN1Vanc9anlRbq6eec

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=cs2-trading-secret-${Date.now()}

# Trading API Configuration
STEAM_API_KEY=your-steam-api-key-here
`;
    
    try {
      fs.writeFileSync('.env.local', envContent);
      console.log('✅ .env.local created successfully!');
      
      console.log('\n🎉 READY FOR DEPLOYMENT!');
      console.log('Next steps:');
      console.log('1. npx prisma generate');
      console.log('2. npx prisma db push');
      console.log('3. npm run dev');
      
    } catch (error) {
      console.log('❌ Could not create .env.local:', error.message);
      console.log('Please create it manually with the connection string above.');
    }
    
  } else {
    console.log('❌ NO WORKING CONNECTIONS FOUND');
    console.log('\nPossible issues:');
    console.log('1. Database still provisioning (wait 5-10 minutes)');
    console.log('2. Network/firewall blocking connections');
    console.log('3. Incorrect project reference or password');
    
    console.log('\n🔧 Troubleshooting:');
    console.log(`1. Check project status: https://supabase.com/dashboard/project/${PROJECT_REF}`);
    console.log('2. Verify password is correct: B60ctvoybj');
    console.log('3. Try again in a few minutes');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 