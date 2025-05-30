const http = require('http');

async function startPriceUpdates() {
  console.log('🚀 Starting background price update service...\n');

  // First, trigger an immediate update
  console.log('1️⃣ Triggering immediate price update...');
  
  const postOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/skins/update-prices',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const postReq = http.request(postOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log(`✅ Immediate update completed!`);
        console.log(`📊 Updated ${result.updatedSkins} skins`);
        
        if (result.results && result.results.length > 0) {
          console.log('\n💰 Price changes:');
          result.results.forEach(update => {
            if (update.error) {
              console.log(`   ❌ ${update.skinName}: ${update.error}`);
            } else {
              console.log(`   📈 ${update.skinName}: $${update.oldPrice.toFixed(2)} → $${update.newPrice.toFixed(2)} (${update.change.toFixed(1)}%)`);
            }
          });
        }
        
        // Now start continuous updates
        console.log('\n2️⃣ Starting continuous updates every 10 seconds...');
        startContinuousUpdates();
        
      } catch (error) {
        console.error('❌ Error parsing response:', error);
      }
    });
  });

  postReq.on('error', (error) => {
    console.error('❌ Error triggering immediate update:', error.message);
    console.log('💡 Make sure the development server is running on localhost:3000');
  });

  postReq.end();
}

function startContinuousUpdates() {
  const getOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/skins/update-prices',
    method: 'GET'
  };

  const getReq = http.request(getOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const result = JSON.parse(data);
        console.log(`✅ ${result.message}`);
        console.log(`⏰ Update interval: ${result.interval}`);
        console.log('\n🔍 Monitor the server console for real-time price updates...');
        console.log('📊 You can also run: node check-current-prices.js');
        console.log('🛑 To stop updates, press Ctrl+C or call DELETE /api/skins/update-prices');
        
      } catch (error) {
        console.error('❌ Error parsing response:', error);
      }
    });
  });

  getReq.on('error', (error) => {
    console.error('❌ Error starting continuous updates:', error.message);
  });

  getReq.end();
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n🛑 Stopping price updates...');
  
  const deleteOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/skins/update-prices',
    method: 'DELETE'
  };

  const deleteReq = http.request(deleteOptions, (res) => {
    console.log('✅ Price updates stopped');
    process.exit(0);
  });

  deleteReq.on('error', () => {
    process.exit(0);
  });

  deleteReq.end();
});

startPriceUpdates(); 