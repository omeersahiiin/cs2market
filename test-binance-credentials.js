#!/usr/bin/env node

require('dotenv').config();
const crypto = require('crypto');

console.log('🔍 Binance API Credentials Debug Tool');
console.log('=====================================\n');

// Check environment variables
console.log('📋 Environment Variables Check:');
console.log('BINANCE_API_KEY exists:', !!process.env.BINANCE_API_KEY);
console.log('BINANCE_SECRET_KEY exists:', !!process.env.BINANCE_SECRET_KEY);

if (process.env.BINANCE_API_KEY) {
  console.log('API Key length:', process.env.BINANCE_API_KEY.length);
  console.log('API Key starts with:', process.env.BINANCE_API_KEY.substring(0, 10) + '...');
}

if (process.env.BINANCE_SECRET_KEY) {
  console.log('Secret Key length:', process.env.BINANCE_SECRET_KEY.length);
  console.log('Secret Key starts with:', process.env.BINANCE_SECRET_KEY.substring(0, 10) + '...');
}

console.log('\n🧪 Testing Binance API Connection...');

async function testBinanceAPI() {
  const apiKey = process.env.BINANCE_API_KEY;
  const secretKey = process.env.BINANCE_SECRET_KEY;

  if (!apiKey || !secretKey) {
    console.log('❌ Missing API credentials in environment variables');
    return;
  }

  try {
    // Create signature for account info request
    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}`;
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');

    const url = `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`;

    console.log('🔗 Making request to Binance API...');
    console.log('Timestamp:', timestamp);
    console.log('Query string:', queryString);
    console.log('Signature (first 20 chars):', signature.substring(0, 20) + '...');

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('\n📡 Response Status:', response.status);
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('\n📄 Response Body:');
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log('✅ SUCCESS! Binance API credentials are valid');
      console.log('Account Type:', data.accountType);
      console.log('Can Trade:', data.canTrade);
      console.log('Can Withdraw:', data.canWithdraw);
      console.log('Can Deposit:', data.canDeposit);
      console.log('Permissions:', data.permissions);
    } else {
      console.log('❌ FAILED! Binance API Error:');
      console.log(responseText);
      
      // Parse error details
      try {
        const errorData = JSON.parse(responseText);
        console.log('\n🔍 Error Details:');
        console.log('Code:', errorData.code);
        console.log('Message:', errorData.msg);
        
        // Common error codes
        switch (errorData.code) {
          case -1022:
            console.log('\n💡 Solution: Check your system time - it might be out of sync');
            break;
          case -2014:
            console.log('\n💡 Solution: Invalid API key format');
            break;
          case -1021:
            console.log('\n💡 Solution: Timestamp out of recv window');
            break;
          case -2015:
            console.log('\n💡 Solution: Invalid API key, IP, or permissions');
            break;
          default:
            console.log('\n💡 Check Binance API documentation for error code:', errorData.code);
        }
      } catch (e) {
        console.log('Could not parse error response');
      }
    }

  } catch (error) {
    console.log('❌ Network/Connection Error:', error.message);
  }
}

// Run the test
testBinanceAPI().then(() => {
  console.log('\n🏁 Test completed');
}).catch(error => {
  console.error('❌ Test failed:', error);
}); 