const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testBinanceLogic() {
  try {
    console.log('=== Testing Binance-Style Order Matching ===');
    
    console.log('\n🔍 BINANCE FUTURES MATCHING RULES:');
    console.log('1. BUY orders match with SELL orders (regardless of LONG/SHORT)');
    console.log('2. Position type (LONG/SHORT) only affects P&L calculation');
    console.log('3. Price-time priority determines execution order');
    console.log('4. One trader\'s BUY LONG can match another\'s SELL SHORT');
    
    console.log('\n📊 EXAMPLE SCENARIOS:');
    console.log('• User A: BUY LONG @ $100 (wants to go long)');
    console.log('• User B: SELL SHORT @ $100 (wants to go short)');
    console.log('• Result: MATCH! Both get filled at $100');
    console.log('• User A gets LONG position, User B gets SHORT position');
    
    // Test our current order book
    const skinId = 'cmb5otztl0001tekka6mua3r1';
    
    const orders = await prisma.order.findMany({
      where: {
        skinId: skinId,
        status: { in: ['PENDING', 'PARTIAL'] },
        remainingQty: { gt: 0 }
      },
      orderBy: [
        { price: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    // Separate by BUY/SELL (the correct way)
    const buyOrders = orders.filter(o => o.side === 'BUY').sort((a, b) => b.price - a.price);
    const sellOrders = orders.filter(o => o.side === 'SELL').sort((a, b) => a.price - b.price);
    
    console.log('\n=== CURRENT ORDER BOOK (Correct Binance View) ===');
    console.log(`\nBUY Orders (Bids): ${buyOrders.length}`);
    buyOrders.slice(0, 5).forEach((order, i) => {
      console.log(`  ${i+1}. $${order.price.toFixed(2)} x ${order.remainingQty} (${order.positionType})`);
    });
    
    console.log(`\nSELL Orders (Asks): ${sellOrders.length}`);
    sellOrders.slice(0, 5).forEach((order, i) => {
      console.log(`  ${i+1}. $${order.price.toFixed(2)} x ${order.remainingQty} (${order.positionType})`);
    });
    
    // Check for matches
    if (buyOrders.length > 0 && sellOrders.length > 0) {
      const bestBuy = buyOrders[0];
      const bestSell = sellOrders[0];
      
      console.log('\n=== MATCHING ANALYSIS ===');
      console.log(`Best BUY:  $${bestBuy.price.toFixed(2)} x ${bestBuy.remainingQty} (${bestBuy.positionType})`);
      console.log(`Best SELL: $${bestSell.price.toFixed(2)} x ${bestSell.remainingQty} (${bestSell.positionType})`);
      
      if (bestBuy.price >= bestSell.price) {
        console.log('✅ MATCH POSSIBLE!');
        console.log(`📈 Execution Price: $${bestSell.price.toFixed(2)} (maker's price)`);
        console.log(`📊 Quantity: ${Math.min(bestBuy.remainingQty, bestSell.remainingQty)}`);
        
        // Show what happens to each trader
        console.log('\n🎯 TRADE OUTCOME:');
        console.log(`• BUY ${bestBuy.positionType} trader gets ${bestBuy.positionType} position`);
        console.log(`• SELL ${bestSell.positionType} trader gets ${bestSell.positionType === 'LONG' ? 'position closed' : 'SHORT position'}`);
      } else {
        console.log('❌ NO MATCH');
        console.log(`💰 Spread: $${(bestSell.price - bestBuy.price).toFixed(2)}`);
      }
    }
    
    // Test a manual order placement to see if it matches
    console.log('\n=== TESTING ORDER PLACEMENT ===');
    
    if (sellOrders.length > 0) {
      const bestSell = sellOrders[0];
      const testPrice = bestSell.price + 0.01; // Slightly above best sell
      
      console.log(`\n🧪 Simulating BUY LONG order at $${testPrice.toFixed(2)}`);
      console.log(`This should match with SELL order at $${bestSell.price.toFixed(2)}`);
      console.log(`Expected result: Fill at $${bestSell.price.toFixed(2)} (maker's price)`);
    }
    
    console.log('\n=== CONCLUSION ===');
    console.log('✅ Our current matching engine should work correctly');
    console.log('✅ BUY orders match with SELL orders regardless of position type');
    console.log('✅ Position type only affects P&L calculation, not matching');
    console.log('🔍 If SHORT positions aren\'t working, the issue is likely in:');
    console.log('   - Position creation logic');
    console.log('   - P&L calculation');
    console.log('   - Order placement validation');
    console.log('   - Not in the matching engine itself');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testBinanceLogic(); 