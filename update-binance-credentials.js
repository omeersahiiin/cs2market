#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');

console.log('🔑 Binance API Credentials Update Tool');
console.log('=====================================\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function updateEnvFile(apiKey, secretKey) {
  try {
    let envContent = fs.readFileSync('.env', 'utf8');
    
    // Replace the placeholder values
    envContent = envContent.replace(
      'BINANCE_API_KEY=your_actual_binance_api_key_here',
      `BINANCE_API_KEY=${apiKey}`
    );
    
    envContent = envContent.replace(
      'BINANCE_SECRET_KEY=your_actual_binance_secret_key_here',
      `BINANCE_SECRET_KEY=${secretKey}`
    );
    
    // Write back to file
    fs.writeFileSync('.env', envContent);
    
    console.log('✅ Successfully updated .env file with Binance API credentials!');
    console.log('\n🧪 Next steps:');
    console.log('1. Run: npm run dev');
    console.log('2. Go to: http://localhost:3000/admin');
    console.log('3. Click "Test Binance API" button');
    console.log('\n🚀 For production, also update Vercel environment variables:');
    console.log('https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables');
    
  } catch (error) {
    console.error('❌ Error updating .env file:', error.message);
  }
}

function promptForCredentials() {
  console.log('📝 Please enter your Binance API credentials:');
  console.log('(You can get these from: https://www.binance.com/en/my/settings/api-management)\n');
  
  rl.question('🔑 Enter your Binance API Key: ', (apiKey) => {
    if (!apiKey || apiKey.trim() === '') {
      console.log('❌ API Key cannot be empty!');
      rl.close();
      return;
    }
    
    rl.question('🔐 Enter your Binance Secret Key: ', (secretKey) => {
      if (!secretKey || secretKey.trim() === '') {
        console.log('❌ Secret Key cannot be empty!');
        rl.close();
        return;
      }
      
      console.log('\n🔍 Updating credentials...');
      updateEnvFile(apiKey.trim(), secretKey.trim());
      rl.close();
    });
  });
}

// Check if .env file exists
if (!fs.existsSync('.env')) {
  console.log('❌ .env file not found!');
  console.log('Please run: node setup-binance-api.js first');
  process.exit(1);
}

// Check current credentials
const envContent = fs.readFileSync('.env', 'utf8');
if (envContent.includes('your_actual_binance_api_key_here')) {
  console.log('🔍 Found placeholder credentials in .env file');
  promptForCredentials();
} else {
  console.log('✅ Binance API credentials are already configured in .env file');
  console.log('\n🧪 Test your configuration:');
  console.log('1. Run: npm run dev');
  console.log('2. Go to: http://localhost:3000/admin');
  console.log('3. Click "Test Binance API" button');
  
  rl.question('\n❓ Do you want to update the credentials anyway? (y/N): ', (answer) => {
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      promptForCredentials();
    } else {
      console.log('👍 Keeping existing credentials');
      rl.close();
    }
  });
} 