#!/usr/bin/env node

/**
 * Update to New Supabase Project
 * Configure environment with new project details
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Updating to New Supabase Project\n');

// New project details
const NEW_PASSWORD = 'B60ctvoybj';
const NEW_PROJECT_REF = 'oaobkrhfctwjoyibctun';
const NEW_HOST = `db.${NEW_PROJECT_REF}.supabase.co`;

// Build the new connection string (no URL encoding needed for this password)
const NEW_URL = `postgresql://postgres:${NEW_PASSWORD}@${NEW_HOST}:5432/postgres`;
const OPTIMIZED_URL = `${NEW_URL}?connection_limit=20&pool_timeout=20&statement_timeout=30s`;

console.log('🔍 New Project Details:');
console.log('Project Reference:', NEW_PROJECT_REF);
console.log('Password:', NEW_PASSWORD);
console.log('Database Host:', NEW_HOST);
console.log('');
console.log('✅ New Connection String:');
console.log(NEW_URL);
console.log('');
console.log('⚡ Optimized Connection String:');
console.log(OPTIMIZED_URL);
console.log('');

function updateEnvFile() {
  const envPath = path.join(__dirname, '.env.local');
  
  try {
    if (!fs.existsSync(envPath)) {
      console.log('❌ .env.local file not found');
      return false;
    }
    
    // Read current content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace any existing DATABASE_URL
    const urlPattern = /DATABASE_URL="[^"]*"/;
    const newUrl = `DATABASE_URL="${OPTIMIZED_URL}"`;
    
    if (urlPattern.test(envContent)) {
      envContent = envContent.replace(urlPattern, newUrl);
      console.log('✅ Updated existing DATABASE_URL');
    } else {
      // Add DATABASE_URL at the top
      envContent = `${newUrl}\n${envContent}`;
      console.log('✅ Added new DATABASE_URL');
    }
    
    // Update Supabase URL as well
    const supabaseUrlPattern = /SUPABASE_URL="[^"]*"/;
    const newSupabaseUrl = `SUPABASE_URL="https://${NEW_PROJECT_REF}.supabase.co"`;
    
    if (supabaseUrlPattern.test(envContent)) {
      envContent = envContent.replace(supabaseUrlPattern, newSupabaseUrl);
      console.log('✅ Updated SUPABASE_URL');
    } else {
      envContent = `${newSupabaseUrl}\n${envContent}`;
      console.log('✅ Added SUPABASE_URL');
    }
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local updated successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    return false;
  }
}

async function testNewConnection() {
  console.log('\n🧪 Testing new Supabase connection...\n');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      datasources: {
        db: { url: OPTIMIZED_URL }
      }
    });

    // Test connection
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log(`   PostgreSQL: ${result[0].version.substring(0, 60)}...`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

function displayNextSteps() {
  console.log('\n🚀 NEXT STEPS:');
  console.log('');
  console.log('1. Deploy your schema to the new database:');
  console.log('   npx prisma migrate deploy');
  console.log('');
  console.log('2. Seed the database with initial data:');
  console.log('   npx prisma db seed');
  console.log('');
  console.log('3. Get your Supabase API keys:');
  console.log(`   https://supabase.com/dashboard/project/${NEW_PROJECT_REF}/settings/api`);
  console.log('');
  console.log('4. Update API keys in .env.local:');
  console.log('   - SUPABASE_ANON_KEY');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY');
  console.log('');
  console.log('5. Restart your development server:');
  console.log('   npm run dev');
  console.log('');
  console.log('🎉 Your CS2 trading platform will be running on cloud database!');
}

async function main() {
  // Update environment file
  const updated = updateEnvFile();
  
  if (!updated) {
    return;
  }
  
  console.log('');
  
  // Test the new connection
  const connectionWorks = await testNewConnection();
  
  if (connectionWorks) {
    console.log('\n🎉 SUCCESS! New Supabase database is connected!');
    displayNextSteps();
  } else {
    console.log('\n❌ Connection failed. Please check:');
    console.log('1. Project reference is correct: oaobkrhfctwjoyibctun');
    console.log('2. Password is correct: B60ctvoybj');
    console.log('3. Database is fully provisioned (may take 2-5 minutes)');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  NEW_URL, 
  OPTIMIZED_URL, 
  NEW_PROJECT_REF,
  main 
}; 