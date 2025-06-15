#!/usr/bin/env node

// Test how Next.js loads environment variables
console.log('🔍 Testing Next.js Environment Variable Loading');
console.log('===============================================\n');

// Method 1: Direct dotenv loading (like our test script)
require('dotenv').config();
console.log('📋 Method 1 - Direct dotenv.config():');
console.log('BINANCE_API_KEY exists:', !!process.env.BINANCE_API_KEY);
console.log('BINANCE_SECRET_KEY exists:', !!process.env.BINANCE_SECRET_KEY);

if (process.env.BINANCE_API_KEY) {
  console.log('API Key length:', process.env.BINANCE_API_KEY.length);
  console.log('API Key starts with:', process.env.BINANCE_API_KEY.substring(0, 10) + '...');
}

// Method 2: Simulate Next.js BinanceAPI class loading
console.log('\n📋 Method 2 - Simulating BinanceAPI class:');

class TestBinanceAPI {
  constructor() {
    this.config = {
      apiKey: process.env.BINANCE_API_KEY || '',
      secretKey: process.env.BINANCE_SECRET_KEY || '',
      baseUrl: 'https://api.binance.com'
    };
    
    console.log('Constructor - API Key exists:', !!this.config.apiKey);
    console.log('Constructor - Secret Key exists:', !!this.config.secretKey);
    console.log('Constructor - API Key length:', this.config.apiKey.length);
    console.log('Constructor - Secret Key length:', this.config.secretKey.length);
  }
  
  getCredentials() {
    return {
      hasApiKey: !!this.config.apiKey,
      hasSecretKey: !!this.config.secretKey,
      apiKeyLength: this.config.apiKey.length,
      secretKeyLength: this.config.secretKey.length
    };
  }
}

const testAPI = new TestBinanceAPI();
const creds = testAPI.getCredentials();

console.log('\n🔍 BinanceAPI Class Results:');
console.log('Has API Key:', creds.hasApiKey);
console.log('Has Secret Key:', creds.hasSecretKey);
console.log('API Key Length:', creds.apiKeyLength);
console.log('Secret Key Length:', creds.secretKeyLength);

// Method 3: Check if there are any environment loading issues
console.log('\n📋 Method 3 - Environment Variable Analysis:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Total env vars:', Object.keys(process.env).length);

// Check for common issues
const envVars = Object.keys(process.env);
const binanceVars = envVars.filter(key => key.includes('BINANCE'));
console.log('Binance-related env vars:', binanceVars);

// Check for whitespace or encoding issues
if (process.env.BINANCE_API_KEY) {
  const apiKey = process.env.BINANCE_API_KEY;
  console.log('API Key has leading/trailing spaces:', apiKey !== apiKey.trim());
  console.log('API Key contains non-ASCII:', !/^[\x00-\x7F]*$/.test(apiKey));
}

if (process.env.BINANCE_SECRET_KEY) {
  const secretKey = process.env.BINANCE_SECRET_KEY;
  console.log('Secret Key has leading/trailing spaces:', secretKey !== secretKey.trim());
  console.log('Secret Key contains non-ASCII:', !/^[\x00-\x7F]*$/.test(secretKey));
}

console.log('\n🏁 Environment test completed'); 