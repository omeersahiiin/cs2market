#!/usr/bin/env node

/**
 * Switch to Supabase Database
 * Use when Supabase database is ready
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Switching to Supabase Database\n');

const SUPABASE_URL = 'postgresql://postgres:B60ctvoybj%2B@db.saokqnnwdpghsztsscad.supabase.co:5432/postgres?connection_limit=20&pool_timeout=20&statement_timeout=30s';

function updateEnvForSupabase() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local file not found');
      return false;
    }
    
    // Read current content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Remove temporary local DATABASE_URL
    envContent = envContent.replace(/# Temporary local database \(while waiting for Supabase\)\nDATABASE_URL="postgresql:\/\/postgres:password@localhost:5432\/cs2_derivatives"\n\n/, '');
    
    // Uncomment and update Supabase URL
    envContent = envContent.replace(
      /# DATABASE_URL="postgresql:\/\/postgres:B60ctvoybj%2B@db\.saokqnnwdpghsztsscad\.supabase\.co:5432\/postgres[^"]*" # Supabase \(waiting for database provisioning\)/,
      `DATABASE_URL="${SUPABASE_URL}"`
    );
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Switched to Supabase database');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    return false;
  }
}

async function testSupabaseConnection() {
  console.log('\n🧪 Testing Supabase database connection...');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      datasources: {
        db: { url: SUPABASE_URL }
      }
    });

    await prisma.$connect();
    console.log('✅ Supabase database connection successful!');
    
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log(`✅ Database query successful!`);
    console.log(`   PostgreSQL: ${result[0].version.substring(0, 50)}...`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Supabase connection failed:', error.message);
    return false;
  }
}

function displayMigrationSteps() {
  console.log('\n🚀 MIGRATION TO SUPABASE:');
  console.log('');
  console.log('1. Deploy schema to Supabase:');
  console.log('   npx prisma migrate deploy');
  console.log('');
  console.log('2. Seed the database:');
  console.log('   npx prisma db seed');
  console.log('');
  console.log('3. Restart your development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('🎉 Your CS2 trading platform is now running on cloud database!');
}

async function main() {
  const updated = updateEnvForSupabase();
  
  if (!updated) {
    return;
  }
  
  const supabaseWorks = await testSupabaseConnection();
  
  if (supabaseWorks) {
    console.log('\n🎉 SUCCESS! Supabase database is ready and connected!');
    displayMigrationSteps();
  } else {
    console.log('\n❌ Supabase database is not ready yet');
    console.log('Please wait for the monitoring script to confirm readiness');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 