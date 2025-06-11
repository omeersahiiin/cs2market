#!/usr/bin/env node

/**
 * Switch to Local Database
 * Temporary solution while waiting for Supabase database
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Switching to Local Database (Temporary)\n');

const LOCAL_DATABASE_URL = 'postgresql://postgres:password@localhost:5432/cs2_derivatives';

function updateEnvForLocal() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local file not found');
      return false;
    }
    
    // Read current content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Comment out Supabase URL and add local URL
    const supabaseUrlPattern = /DATABASE_URL="postgresql:\/\/postgres:B60ctvoybj%2B@db\.saokqnnwdpghsztsscad\.supabase\.co:5432\/postgres[^"]*"/;
    
    if (supabaseUrlPattern.test(envContent)) {
      // Comment out Supabase URL
      envContent = envContent.replace(
        supabaseUrlPattern, 
        '# DATABASE_URL="postgresql://postgres:B60ctvoybj%2B@db.saokqnnwdpghsztsscad.supabase.co:5432/postgres?connection_limit=20&pool_timeout=20&statement_timeout=30s" # Supabase (waiting for database provisioning)'
      );
      
      // Add local URL at the top
      envContent = `# Temporary local database (while waiting for Supabase)\nDATABASE_URL="${LOCAL_DATABASE_URL}"\n\n${envContent}`;
      
      console.log('✅ Switched to local database');
    } else {
      console.log('⚠️  Supabase URL not found, adding local URL');
      envContent = `DATABASE_URL="${LOCAL_DATABASE_URL}"\n${envContent}`;
    }
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local updated for local development');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    return false;
  }
}

async function testLocalConnection() {
  console.log('\n🧪 Testing local database connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      datasources: {
        db: { url: LOCAL_DATABASE_URL }
      }
    });

    await prisma.$connect();
    console.log('✅ Local database connection successful!');
    
    // Check if we have data
    const userCount = await prisma.user.count();
    const skinCount = await prisma.skin.count();
    
    console.log(`📊 Current data: ${userCount} users, ${skinCount} skins`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Local database connection failed:', error.message);
    console.log('\n🔧 To fix local database:');
    console.log('1. Make sure PostgreSQL is running');
    console.log('2. Create database: createdb cs2_derivatives');
    console.log('3. Run migration: npx prisma migrate dev');
    return false;
  }
}

function displayInstructions() {
  console.log('\n📋 DEVELOPMENT INSTRUCTIONS:');
  console.log('');
  console.log('✅ You can now continue development with local database');
  console.log('✅ The monitoring script is checking Supabase readiness');
  console.log('✅ When Supabase is ready, run: node switch-to-supabase.js');
  console.log('');
  console.log('🚀 Continue development:');
  console.log('1. npm run dev (start your app)');
  console.log('2. Test trading functionality');
  console.log('3. Wait for Supabase notification');
  console.log('');
  console.log('⏳ Supabase database typically takes 5-15 minutes to provision');
}

async function main() {
  const updated = updateEnvForLocal();
  
  if (!updated) {
    return;
  }
  
  const localWorks = await testLocalConnection();
  
  displayInstructions();
  
  if (!localWorks) {
    console.log('\n⚠️  Local database needs setup, but you can still wait for Supabase');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 