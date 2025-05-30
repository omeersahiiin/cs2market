const http = require('http');

function monitorPriceUpdates() {
  console.log('🔍 Monitoring Real-Time Price Updates...\n');
  console.log('📊 System Configuration:');
  console.log('   - Update Interval: 10 seconds');
  console.log('   - Data Sources: CSFloat, Steam Market, Buff163, CSGOSkins.gg');
  console.log('   - Total Skins: 38');
  console.log('   - Fallback Pricing: Enabled\n');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/skins/price-updates',
    method: 'GET',
    headers: {
      'Accept': 'text/event-stream',
      'Cache-Control': 'no-cache'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`✅ Connected to price update stream (Status: ${res.statusCode})\n`);
    
    if (res.statusCode === 200) {
      let updateCount = 0;
      
      res.on('data', (chunk) => {
        const data = chunk.toString();
        
        if (data.includes('data:')) {
          const dataLine = data.split('data: ')[1];
          if (dataLine) {
            try {
              const priceData = JSON.parse(dataLine.split('\n')[0]);
              updateCount++;
              
              if (priceData.heartbeat) {
                console.log(`💓 Heartbeat ${updateCount}: ${new Date(priceData.heartbeat).toLocaleTimeString()}`);
                if (priceData.error) {
                  console.log(`   ⚠️ Error: ${priceData.error}`);
                }
              } else {
                console.log(`📈 Price Update ${updateCount}: ${new Date().toLocaleTimeString()}`);
                console.log(`   📊 Updated ${Object.keys(priceData).length} skins`);
                
                // Show a few sample prices
                const sampleSkins = Object.entries(priceData).slice(0, 3);
                sampleSkins.forEach(([skinId, price]) => {
                  console.log(`   💰 Skin ${skinId}: $${price}`);
                });
                
                if (Object.keys(priceData).length > 3) {
                  console.log(`   ... and ${Object.keys(priceData).length - 3} more skins`);
                }
              }
              console.log('');
            } catch (e) {
              console.log(`📡 Raw data: ${dataLine.trim()}`);
            }
          }
        }
      });
      
      res.on('end', () => {
        console.log('🔚 Price update stream ended');
      });
      
    } else {
      console.log('❌ Failed to connect to price update stream');
    }
  });

  req.on('error', (error) => {
    console.error('❌ Connection error:', error.message);
    console.log('\n💡 Make sure the development server is running:');
    console.log('🔧 npm run dev');
  });

  req.end();
  
  console.log('🌐 Monitoring started. Press Ctrl+C to stop...');
  console.log('📝 You should see price updates every 10 seconds.\n');
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Monitoring stopped by user');
  process.exit(0);
});

monitorPriceUpdates(); 