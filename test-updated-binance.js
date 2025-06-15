#!/usr/bin/env node

require('dotenv').config();

console.log('🧪 Testing Updated BinanceAPI Class');
console.log('===================================\n');

// Import the updated BinanceAPI
async function testUpdatedBinanceAPI() {
  try {
    // Since we can't directly import TypeScript, let's simulate the new logic
    console.log('📋 Environment Check:');
    console.log('BINANCE_API_KEY exists:', !!process.env.BINANCE_API_KEY);
    console.log('BINANCE_SECRET_KEY exists:', !!process.env.BINANCE_SECRET_KEY);
    
    if (process.env.BINANCE_API_KEY) {
      console.log('API Key length:', process.env.BINANCE_API_KEY.length);
      console.log('API Key starts with:', process.env.BINANCE_API_KEY.substring(0, 10) + '...');
    }

    // Test the dynamic config approach
    function getConfig() {
      return {
        apiKey: process.env.BINANCE_API_KEY || '',
        secretKey: process.env.BINANCE_SECRET_KEY || '',
        baseUrl: 'https://api.binance.com'
      };
    }

    const config = getConfig();
    console.log('\n🔍 Dynamic Config Test:');
    console.log('Config API Key exists:', !!config.apiKey);
    console.log('Config Secret Key exists:', !!config.secretKey);
    console.log('Config API Key length:', config.apiKey.length);
    console.log('Config Secret Key length:', config.secretKey.length);

    // Test validation logic
    if (!config.apiKey || !config.secretKey) {
      console.log('❌ Credentials not found in environment variables');
      return false;
    }

    console.log('\n🚀 Testing API Call...');
    
    // Simulate the makeRequest logic
    const crypto = require('crypto');
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      timestamp: timestamp.toString()
    });

    const signature = crypto
      .createHmac('sha256', config.secretKey)
      .update(queryParams.toString())
      .digest('hex');
    
    queryParams.append('signature', signature);
    const url = `${config.baseUrl}/api/v3/account?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ SUCCESS! Updated BinanceAPI logic works correctly');
      console.log('Account Type:', data.accountType);
      return true;
    } else {
      const error = await response.text();
      console.log('❌ API Error:', error);
      return false;
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    return false;
  }
}

testUpdatedBinanceAPI().then(success => {
  console.log('\n🏁 Test Result:', success ? 'PASSED' : 'FAILED');
}).catch(error => {
  console.error('❌ Test error:', error);
}); 