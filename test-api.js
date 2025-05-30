const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/orderbook/cmb5otztl0001tekka6mua3r1?levels=5');
    const data = await response.json();
    
    console.log('=== Order Book API Test ===');
    console.log('Market Price:', data.marketPrice);
    console.log('Best Bid:', data.bestPrices.bestBid);
    console.log('Best Ask:', data.bestPrices.bestAsk);
    console.log('Spread:', data.bestPrices.spread);
    
    console.log('\nBids:');
    data.orderBook.bids.forEach((bid, i) => {
      console.log(`  ${i+1}. $${bid.price.toFixed(2)} - ${bid.remainingQty} qty`);
    });
    
    console.log('\nAsks:');
    data.orderBook.asks.forEach((ask, i) => {
      console.log(`  ${i+1}. $${ask.price.toFixed(2)} - ${ask.remainingQty} qty`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI(); 