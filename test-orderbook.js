const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testOrderMatching() {
  try {
    console.log('=== Testing Order Matching ===');
    
    // Get all buy and sell orders
    const buyOrders = await prisma.order.findMany({
      where: {
        skinId: 'cmb5otztl0001tekka6mua3r1',
        side: 'BUY',
        status: 'PENDING'
      },
      orderBy: { price: 'desc' }
    });
    
    const sellOrders = await prisma.order.findMany({
      where: {
        skinId: 'cmb5otztl0001tekka6mua3r1',
        side: 'SELL',
        status: 'PENDING'
      },
      orderBy: { price: 'asc' }
    });
    
    console.log('\nBuy Orders:');
    buyOrders.forEach(order => {
      console.log(`  $${order.price} (${order.remainingQty})`);
    });
    
    console.log('\nSell Orders:');
    sellOrders.forEach(order => {
      console.log(`  $${order.price} (${order.remainingQty})`);
    });
    
    // Find potential matches
    console.log('\nPotential matches:');
    for (const buyOrder of buyOrders) {
      for (const sellOrder of sellOrders) {
        const tolerance = 0.001;
        if (buyOrder.price >= (sellOrder.price - tolerance)) {
          console.log(`MATCH: Buy $${buyOrder.price} vs Sell $${sellOrder.price} (diff: ${Math.abs(buyOrder.price - sellOrder.price).toFixed(6)})`);
        }
      }
    }
    

    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testOrderMatching(); 