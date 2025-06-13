const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

async function debugOrders() {
  try {
    console.log('🔍 Debugging Orders and Order Book...\n');

    // Check if we can connect to database
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connected successfully\n');

    // Check total orders
    const totalOrders = await prisma.order.count();
    console.log(`📊 Total orders in database: ${totalOrders}`);

    // Check recent orders
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { email: true } },
        skin: { select: { name: true } }
      }
    });

    console.log('\n📋 Recent orders:');
    recentOrders.forEach(order => {
      console.log(`- ${order.id}: ${order.side} ${order.quantity} ${order.skin.name} @ $${order.price} (${order.status}) - ${order.user.email}`);
    });

    // Check open orders
    const openOrders = await prisma.order.findMany({
      where: { status: 'OPEN' },
      include: {
        user: { select: { email: true } },
        skin: { select: { name: true } }
      }
    });

    console.log(`\n🔓 Open orders: ${openOrders.length}`);
    openOrders.forEach(order => {
      console.log(`- ${order.id}: ${order.side} ${order.quantity} ${order.skin.name} @ $${order.price} - ${order.user.email}`);
    });

    // Check order book for a specific skin
    const testSkinId = 'skin-1'; // AWP Dragon Lore
    console.log(`\n📖 Order book for ${testSkinId}:`);
    
    const bids = await prisma.order.findMany({
      where: {
        skinId: testSkinId,
        side: 'BUY',
        status: 'OPEN',
        remainingQty: { gt: 0 }
      },
      orderBy: { price: 'desc' },
      take: 5
    });

    const asks = await prisma.order.findMany({
      where: {
        skinId: testSkinId,
        side: 'SELL',
        status: 'OPEN',
        remainingQty: { gt: 0 }
      },
      orderBy: { price: 'asc' },
      take: 5
    });

    console.log('Bids (Buy orders):');
    bids.forEach(bid => {
      console.log(`  $${bid.price} x ${bid.remainingQty}`);
    });

    console.log('Asks (Sell orders):');
    asks.forEach(ask => {
      console.log(`  $${ask.price} x ${ask.remainingQty}`);
    });

    // Check environment variables
    console.log('\n🌍 Environment check:');
    console.log(`NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`VERCEL: ${process.env.VERCEL}`);
    console.log(`DATABASE_URL configured: ${!!process.env.DATABASE_URL}`);
    console.log(`Database URL starts with: ${process.env.DATABASE_URL?.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ Error debugging orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrders(); 