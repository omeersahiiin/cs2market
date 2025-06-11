#!/usr/bin/env node

/**
 * Monitor New Supabase Database Readiness
 * Check every 30 seconds until new database is ready
 */

const dns = require('dns');
const { PrismaClient } = require('@prisma/client');

console.log('⏳ Monitoring New Supabase Database Readiness\n');

const PROJECT_REF = 'oaobkrhfctwjoyibctun';
const PASSWORD = 'B60ctvoybj';
const HOST = `db.${PROJECT_REF}.supabase.co`;
const CONNECTION_URL = `postgresql://postgres:${PASSWORD}@${HOST}:5432/postgres`;
const OPTIMIZED_URL = `${CONNECTION_URL}?connection_limit=20&pool_timeout=20&statement_timeout=30s`;

let checkCount = 0;
const maxChecks = 20; // 10 minutes maximum (should be enough for new project)

function checkDNS() {
  return new Promise((resolve) => {
    dns.lookup(HOST, (err, address) => {
      if (err) {
        resolve(false);
      } else {
        console.log(`✅ DNS resolved: ${HOST} -> ${address}`);
        resolve(true);
      }
    });
  });
}

async function checkDatabaseConnection() {
  try {
    const prisma = new PrismaClient({
      datasources: {
        db: { url: CONNECTION_URL }
      }
    });

    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ Database query successful!`);
    console.log(`   PostgreSQL: ${result[0].version.substring(0, 50)}...`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    return false;
  }
}

async function checkReadiness() {
  checkCount++;
  const timestamp = new Date().toLocaleTimeString();
  
  console.log(`🔍 Check #${checkCount} at ${timestamp}`);
  
  // Check DNS first
  const dnsReady = await checkDNS();
  
  if (!dnsReady) {
    console.log(`❌ DNS not ready yet for ${HOST}`);
    return false;
  }
  
  // If DNS is ready, check database connection
  const dbReady = await checkDatabaseConnection();
  
  if (dbReady) {
    console.log('\n🎉 SUCCESS! New Supabase database is ready!');
    console.log('\n🚀 Next steps:');
    console.log('1. Deploy schema: npx prisma migrate deploy');
    console.log('2. Seed database: npx prisma db seed');
    console.log('3. Start app: npm run dev');
    console.log('\n✅ Your CS2 trading platform is ready for cloud database!');
    console.log(`\n🔗 Connection string: ${OPTIMIZED_URL}`);
    return true;
  } else {
    console.log('❌ Database connection not ready yet');
    return false;
  }
}

async function monitor() {
  console.log(`🎯 Target: ${HOST}`);
  console.log(`🔗 Connection: ${CONNECTION_URL}`);
  console.log(`⏰ Checking every 30 seconds (max ${maxChecks} checks)\n`);
  
  while (checkCount < maxChecks) {
    const ready = await checkReadiness();
    
    if (ready) {
      console.log('\n🎊 MIGRATION READY! Run these commands:');
      console.log('npx prisma migrate deploy');
      console.log('npx prisma db seed');
      process.exit(0);
    }
    
    if (checkCount < maxChecks) {
      console.log(`⏳ Waiting 30 seconds before next check...\n`);
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
  }
  
  console.log('\n⏰ Maximum wait time reached (10 minutes)');
  console.log('🔧 The database should be ready by now. Try running:');
  console.log('node update-new-supabase.js');
  console.log(`\n🌐 Dashboard: https://supabase.com/dashboard/project/${PROJECT_REF}`);
}

if (require.main === module) {
  monitor().catch(console.error);
}

module.exports = { monitor }; 