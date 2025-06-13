const { PrismaClient } = require('@prisma/client');

// Simple retry mechanism for prepared statement errors
async function executeWithRetry(operation, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (error.message?.includes('prepared statement') && attempt < maxRetries) {
        console.log(`Attempt ${attempt} failed with prepared statement error, retrying...`);
        // Wait a bit before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        continue;
      }
      throw error;
    }
  }
}

async function fixPendingOrders() {
  let prisma;
  try {
    console.log('🔧 Fixing PENDING orders to OPEN status...\n');

    // Create fresh Prisma client
    prisma = new PrismaClient({
      log: ['error', 'warn'],
    });

    // Check current PENDING orders
    const pendingOrders = await executeWithRetry(async () => {
      return await prisma.order.findMany({
        where: { status: 'PENDING' },
        include: {
          user: { select: { email: true } },
          skin: { select: { name: true } }
        }
      });
    });

    console.log(`📊 Found ${pendingOrders.length} PENDING orders:`);
    pendingOrders.forEach(order => {
      console.log(`- ${order.id}: ${order.side} ${order.quantity} ${order.skin.name} @ $${order.price} - ${order.user.email}`);
    });

    if (pendingOrders.length === 0) {
      console.log('✅ No PENDING orders to fix');
      return;
    }

    // Update all PENDING orders to OPEN
    const updateResult = await executeWithRetry(async () => {
      return await prisma.order.updateMany({
        where: { status: 'PENDING' },
        data: { status: 'OPEN' }
      });
    });

    console.log(`\n✅ Updated ${updateResult.count} orders from PENDING to OPEN`);

    // Verify the update
    const openOrders = await executeWithRetry(async () => {
      return await prisma.order.findMany({
        where: { status: 'OPEN' },
        include: {
          user: { select: { email: true } },
          skin: { select: { name: true } }
        }
      });
    });

    console.log(`\n📈 Now have ${openOrders.length} OPEN orders:`);
    openOrders.forEach(order => {
      console.log(`- ${order.id}: ${order.side} ${order.quantity} ${order.skin.name} @ $${order.price} - ${order.user.email}`);
    });

    // Test order book for a specific skin
    const testSkinId = 'skin-2'; // AK-47 Fire Serpent (has the most orders)
    console.log(`\n📖 Order book for ${testSkinId} after fix:`);
    
    const bids = await executeWithRetry(async () => {
      return await prisma.order.findMany({
        where: {
          skinId: testSkinId,
          side: 'BUY',
          status: 'OPEN',
          remainingQty: { gt: 0 }
        },
        orderBy: { price: 'desc' },
        take: 5
      });
    });

    const asks = await executeWithRetry(async () => {
      return await prisma.order.findMany({
        where: {
          skinId: testSkinId,
          side: 'SELL',
          status: 'OPEN',
          remainingQty: { gt: 0 }
        },
        orderBy: { price: 'asc' },
        take: 5
      });
    });

    console.log('Bids (Buy orders):');
    bids.forEach(bid => {
      console.log(`  $${bid.price} x ${bid.remainingQty}`);
    });

    console.log('Asks (Sell orders):');
    asks.forEach(ask => {
      console.log(`  $${ask.price} x ${ask.remainingQty}`);
    });

    console.log('\n🎉 Order book fix completed! Orders should now appear in the trading interface.');

  } catch (error) {
    console.error('❌ Error fixing orders:', error);
  } finally {
    if (prisma) {
      await prisma.$disconnect();
    }
  }
}

fixPendingOrders(); 