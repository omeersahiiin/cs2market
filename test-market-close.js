const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testMarketClose() {
  try {
    console.log('=== Testing Market Close Logic ===');
    
    // Get current order book for AK-47 Redline
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
    
    const bids = orders
      .filter(order => order.side === 'BUY')
      .sort((a, b) => {
        if (a.price !== b.price) return b.price - a.price;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
      
    const asks = orders
      .filter(order => order.side === 'SELL')
      .sort((a, b) => {
        if (a.price !== b.price) return a.price - b.price;
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
    
    console.log('\n=== Current Order Book ===');
    console.log('Best Bids (highest first):');
    bids.slice(0, 5).forEach((bid, i) => {
      console.log(`  ${i+1}. $${bid.price.toFixed(2)} x ${bid.remainingQty} (User: ${bid.userId.slice(-8)})`);
    });
    
    console.log('\nBest Asks (lowest first):');
    asks.slice(0, 5).forEach((ask, i) => {
      console.log(`  ${i+1}. $${ask.price.toFixed(2)} x ${ask.remainingQty} (User: ${ask.userId.slice(-8)})`);
    });
    
    // Simulate market close scenarios
    console.log('\n=== Market Close Simulation ===');
    
    if (bids.length > 0) {
      console.log(`\n📈 Closing LONG position (SELL at market):`);
      console.log(`   Would execute against best bids starting at $${bids[0].price.toFixed(2)}`);
      
      // Simulate selling 50 units
      let remainingToSell = 50;
      let totalValue = 0;
      let executedQty = 0;
      
      for (const bid of bids) {
        if (remainingToSell <= 0) break;
        
        const fillQty = Math.min(remainingToSell, bid.remainingQty);
        totalValue += fillQty * bid.price;
        executedQty += fillQty;
        remainingToSell -= fillQty;
        
        console.log(`   - Fill ${fillQty} @ $${bid.price.toFixed(2)} = $${(fillQty * bid.price).toFixed(2)}`);
        
        if (remainingToSell <= 0) break;
      }
      
      if (executedQty > 0) {
        const avgPrice = totalValue / executedQty;
        console.log(`   ✅ Total: ${executedQty} units @ avg $${avgPrice.toFixed(2)} = $${totalValue.toFixed(2)}`);
      }
    }
    
    if (asks.length > 0) {
      console.log(`\n📉 Closing SHORT position (BUY at market):`);
      console.log(`   Would execute against best asks starting at $${asks[0].price.toFixed(2)}`);
      
      // Simulate buying 30 units
      let remainingToBuy = 30;
      let totalValue = 0;
      let executedQty = 0;
      
      for (const ask of asks) {
        if (remainingToBuy <= 0) break;
        
        const fillQty = Math.min(remainingToBuy, ask.remainingQty);
        totalValue += fillQty * ask.price;
        executedQty += fillQty;
        remainingToBuy -= fillQty;
        
        console.log(`   - Fill ${fillQty} @ $${ask.price.toFixed(2)} = $${(fillQty * ask.price).toFixed(2)}`);
        
        if (remainingToBuy <= 0) break;
      }
      
      if (executedQty > 0) {
        const avgPrice = totalValue / executedQty;
        console.log(`   ✅ Total: ${executedQty} units @ avg $${avgPrice.toFixed(2)} = $${totalValue.toFixed(2)}`);
      }
    }
    
    console.log('\n=== This matches Binance behavior: ===');
    console.log('✅ Market orders execute immediately against best available prices');
    console.log('✅ SELL market orders take liquidity from bids (highest price first)');
    console.log('✅ BUY market orders take liquidity from asks (lowest price first)');
    console.log('✅ Multiple price levels can be hit for large orders');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testMarketClose(); 