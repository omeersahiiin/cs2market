const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testSelfMatching() {
  try {
    console.log('=== Testing Self-Matching Prevention ===');
    
    // Get orders from the same user that could potentially match
    const orders = await prisma.order.findMany({
      where: {
        skinId: 'cmb5otztl0001tekka6mua3r1',
        status: 'PENDING'
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Group orders by user
    const ordersByUser = {};
    orders.forEach(order => {
      if (!ordersByUser[order.userId]) {
        ordersByUser[order.userId] = { buy: [], sell: [] };
      }
      ordersByUser[order.userId][order.side.toLowerCase()].push(order);
    });
    
    console.log('\nOrders by user:');
    Object.entries(ordersByUser).forEach(([userId, userOrders]) => {
      console.log(`\nUser ${userId.slice(-8)}:`);
      console.log(`  Buy orders: ${userOrders.buy.length}`);
      userOrders.buy.forEach(order => {
        console.log(`    $${order.price} (${order.remainingQty})`);
      });
      console.log(`  Sell orders: ${userOrders.sell.length}`);
      userOrders.sell.forEach(order => {
        console.log(`    $${order.price} (${order.remainingQty})`);
      });
      
      // Check for potential self-matches
      for (const buyOrder of userOrders.buy) {
        for (const sellOrder of userOrders.sell) {
          if (buyOrder.price >= sellOrder.price) {
            console.log(`  ⚠️  POTENTIAL SELF-MATCH: Buy $${buyOrder.price} vs Sell $${sellOrder.price}`);
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testSelfMatching(); 