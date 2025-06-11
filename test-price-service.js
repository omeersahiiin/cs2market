const { PriceServiceManager } = require('./src/lib/priceServiceManager.ts');

async function testPriceService() {
  console.log('🧪 Testing Price Service Setup...\n');

  try {
    // Test environment variables
    console.log('📋 Environment Configuration:');
    console.log('- Steam API Key:', process.env.STEAM_API_KEY ? 'SET ✅' : 'NOT SET ❌');
    console.log('- CSFloat API Key:', process.env.CSFLOAT_API_KEY ? 'SET ✅' : 'NOT SET ❌');
    console.log('- SkinPort API Key:', process.env.SKINPORT_API_KEY ? 'SET ✅' : 'NOT SET ❌');
    console.log('- BitSkins API Key:', process.env.BITSKINS_API_KEY ? 'SET ✅' : 'NOT SET ❌');
    console.log('');

    // Test price service manager
    const priceManager = PriceServiceManager.getInstance();
    const status = priceManager.getSourcesStatus();

    console.log('🔧 Price Sources Status:');
    for (const [source, config] of Object.entries(status)) {
      console.log(`- ${source}:`);
      console.log(`  Enabled: ${config.enabled ? '✅' : '❌'}`);
      console.log(`  Has API Key: ${config.hasApiKey ? '✅' : '❌'}`);
      console.log(`  Rate Limit: ${config.rateLimit}/min`);
      console.log(`  Priority: ${config.priority}`);
      console.log('');
    }

    // Test API endpoints
    console.log('🌐 Testing API Endpoints:');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test status endpoint
    try {
      const response = await fetch(`${baseUrl}/api/price-service?action=status`);
      if (response.ok) {
        console.log('- Status endpoint: ✅');
      } else {
        console.log('- Status endpoint: ❌', response.status);
      }
    } catch (error) {
      console.log('- Status endpoint: ❌ (Server not running)');
    }

    console.log('\n🎯 Next Steps:');
    if (!process.env.STEAM_API_KEY || process.env.STEAM_API_KEY === 'your_steam_api_key_here') {
      console.log('1. Get Steam API key from: https://steamcommunity.com/dev/apikey');
    }
    if (!process.env.CSFLOAT_API_KEY || process.env.CSFLOAT_API_KEY === 'your_csfloat_api_key_here') {
      console.log('2. Get CSFloat API key from: https://csfloat.com/api');
    }
    if (!process.env.SKINPORT_API_KEY || process.env.SKINPORT_API_KEY === 'your_skinport_api_key_here') {
      console.log('3. Get SkinPort API key from: https://docs.skinport.com/');
    }
    console.log('4. Update your .env.local file with the API keys');
    console.log('5. Start the development server: npm run dev');
    console.log('6. Test the price updates: /api/price-service?action=start');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
if (require.main === module) {
  testPriceService();
}

module.exports = { testPriceService }; 