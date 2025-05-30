const http = require('http');

// Test placing a BUY SHORT order (opening a short position)
async function testShortOrder() {
  console.log('=== Testing SHORT Position Order Placement ===');
  
  // First, let's check the current order book
  console.log('\n1. Checking current order book...');
  
  const orderBookData = JSON.stringify({});
  
  const orderBookOptions = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/orderbook/cmb5otztl0001tekka6mua3r1?levels=5',
    method: 'GET'
  };
  
  const orderBookReq = http.request(orderBookOptions, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const orderBook = JSON.parse(data);
        console.log('Current Market Price:', orderBook.marketPrice);
        console.log('Best Ask (lowest sell):', orderBook.bestPrices.bestAsk);
        console.log('Best Bid (highest buy):', orderBook.bestPrices.bestBid);
        
        // Now test placing a BUY SHORT order at market price
        const testPrice = orderBook.bestPrices.bestAsk - 0.10; // Slightly below best ask
        
        console.log(`\n2. Placing BUY SHORT order at $${testPrice.toFixed(2)}...`);
        console.log('This should create a SHORT position when filled');
        
        const orderData = JSON.stringify({
          skinId: 'cmb5otztl0001tekka6mua3r1',
          side: 'BUY',
          orderType: 'LIMIT',
          positionType: 'SHORT',
          price: testPrice,
          quantity: 10,
          timeInForce: 'GTC'
        });
        
        const orderOptions = {
          hostname: 'localhost',
          port: 3000,
          path: '/api/orders',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(orderData),
            // Note: In a real test, we'd need authentication headers
            'Cookie': 'next-auth.session-token=your-session-token-here'
          }
        };
        
        const orderReq = http.request(orderOptions, (res) => {
          let orderResponse = '';
          
          res.on('data', (chunk) => {
            orderResponse += chunk;
          });
          
          res.on('end', () => {
            console.log('Order Response Status:', res.statusCode);
            console.log('Order Response:', orderResponse);
            
            if (res.statusCode === 200) {
              console.log('✅ SHORT order placed successfully!');
            } else {
              console.log('❌ SHORT order failed');
              console.log('This might be due to authentication or validation issues');
            }
          });
        });
        
        orderReq.on('error', (error) => {
          console.error('Order request error:', error);
        });
        
        orderReq.write(orderData);
        orderReq.end();
        
      } catch (error) {
        console.error('Error parsing order book response:', error);
      }
    });
  });
  
  orderBookReq.on('error', (error) => {
    console.error('Order book request error:', error);
  });
  
  orderBookReq.end();
}

// Also test the theoretical matching
console.log('=== SHORT Position Theory Test ===');
console.log('\n📚 How SHORT positions should work:');
console.log('1. BUY SHORT = Open short position (bet price goes down)');
console.log('2. SELL SHORT = Close short position (exit the short)');
console.log('3. BUY SHORT should match with SELL LONG (both are trades)');
console.log('4. When BUY SHORT matches SELL LONG:');
console.log('   - BUY SHORT trader gets SHORT position');
console.log('   - SELL LONG trader closes their LONG position');

console.log('\n🎯 Expected behavior:');
console.log('• User places BUY SHORT @ $83.00');
console.log('• Matches with existing SELL SHORT @ $83.02');
console.log('• User gets SHORT position at $83.02');
console.log('• If price drops to $80, user profits $3.02 per unit');

testShortOrder(); 