#!/usr/bin/env node

/**
 * Update Supabase Connection String
 * Fix the password encoding issue
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Updating Supabase Connection String\n');

// Correct connection details
const PASSWORD = 'B60ctvoybj+';
const ENCODED_PASSWORD = 'B60ctvoybj%2B'; // URL encode the + character
const PROJECT_REF = 'saokqnnwdpghsztsscad';

// Build the correct connection string
const CORRECT_URL = `postgresql://postgres:${ENCODED_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`;
const OPTIMIZED_URL = `${CORRECT_URL}?connection_limit=20&pool_timeout=20&statement_timeout=30s`;

console.log('🔍 Connection String Details:');
console.log('Password (original):', PASSWORD);
console.log('Password (URL-encoded):', ENCODED_PASSWORD);
console.log('Project Reference:', PROJECT_REF);
console.log('');
console.log('✅ Correct Connection String:');
console.log(CORRECT_URL);
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
    
    // Read current .env.local content
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Replace the DATABASE_URL line
    const oldUrlPattern = /DATABASE_URL="[^"]*"/;
    const newUrl = `DATABASE_URL="${OPTIMIZED_URL}"`;
    
    if (oldUrlPattern.test(envContent)) {
      envContent = envContent.replace(oldUrlPattern, newUrl);
      console.log('✅ Updated existing DATABASE_URL');
    } else {
      // Add DATABASE_URL if it doesn't exist
      envContent = `${newUrl}\n${envContent}`;
      console.log('✅ Added new DATABASE_URL');
    }
    
    // Write updated content back
    fs.writeFileSync(envPath, envContent);
    console.log('✅ .env.local file updated successfully');
    
    return true;
    
  } catch (error) {
    console.error('❌ Error updating .env.local:', error.message);
    return false;
  }
}

function displayManualInstructions() {
  console.log('📋 MANUAL UPDATE INSTRUCTIONS:');
  console.log('');
  console.log('1. Open your .env.local file');
  console.log('2. Find the line starting with DATABASE_URL=');
  console.log('3. Replace it with:');
  console.log('');
  console.log(`DATABASE_URL="${OPTIMIZED_URL}"`);
  console.log('');
  console.log('4. Save the file');
  console.log('');
}

async function testConnection() {
  console.log('🧪 Testing the corrected connection...\n');
  
  try {
    const { PrismaClient } = require('@prisma/client');
    
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: OPTIMIZED_URL
        }
      }
    });

    // Test connection
    await prisma.$connect();
    console.log('✅ Connection successful!');
    
    // Test query
    const result = await prisma.$queryRaw`SELECT version()`;
    console.log('✅ Database query successful!');
    console.log(`   PostgreSQL version: ${result[0].version.substring(0, 60)}...`);
    
    await prisma.$disconnect();
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:', error.message);
    return false;
  }
}

async function main() {
  // Update the environment file
  const updated = updateEnvFile();
  
  if (!updated) {
    displayManualInstructions();
    return;
  }
  
  console.log('');
  
  // Test the connection
  const connectionWorks = await testConnection();
  
  console.log('');
  
  if (connectionWorks) {
    console.log('🎉 SUCCESS! Your Supabase database is connected!');
    console.log('');
    console.log('🚀 Next steps:');
    console.log('1. Run database migration: npx prisma migrate deploy');
    console.log('2. Seed the database: npx prisma db seed');
    console.log('3. Start your app: npm run dev');
  } else {
    console.log('❌ Connection still failing. Please check:');
    console.log('1. Supabase project is active');
    console.log('2. Password is exactly: B60ctvoybj+');
    console.log('3. Project reference is: saokqnnwdpghsztsscad');
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  CORRECT_URL, 
  OPTIMIZED_URL, 
  main 
}; 