const { PrismaClient } = require('@prisma/client');

async function debugOrderIssue() {
  console.log('=== CS2 Market Order Debug ===');
  console.log('Timestamp:', new Date().toISOString());
  
  const prisma = new PrismaClient();
  
  try {
    // Test basic connection
    console.log('\n1. Testing database connection...');
    await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    
    // Check for the specific order
    const orderId = 'cmbvfxwt40001kz04akblmq5y';
    console.log(`\n2. Looking for order: ${orderId}`);
    
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        skin: { select: { name: true } },
        user: { select: { email: true } }
      }
    });
    
    if (order) {
      console.log('✅ Order found:');
      console.log('- ID:', order.id);
      console.log('- Status:', order.status);
      console.log('- Side:', order.side);
      console.log('- Price:', order.price);
      console.log('- Quantity:', order.quantity);
      console.log('- Remaining Qty:', order.remainingQty);
      console.log('- Skin:', order.skin?.name);
      console.log('- User:', order.user?.email);
      console.log('- Created:', order.createdAt);
    } else {
      console.log('❌ Order not found in database');
    }
    
    // Check recent orders
    console.log('\n3. Recent orders (last 10):');
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        skin: { select: { name: true } },
        user: { select: { email: true } }
      }
    });
    
    recentOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.id} - ${order.status} - ${order.side} - $${order.price} - ${order.skin?.name}`);
    });
    
    // Check orders by status
    console.log('\n4. Orders by status:');
    const statusCounts = await prisma.order.groupBy({
      by: ['status'],
      _count: { status: true }
    });
    
    statusCounts.forEach(item => {
      console.log(`- ${item.status}: ${item._count.status}`);
    });
    
    // Check open orders for order book
    console.log('\n5. Open orders for order book:');
    const openOrders = await prisma.order.findMany({
      where: {
        status: { in: ['OPEN', 'PARTIAL'] },
        remainingQty: { gt: 0 }
      },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        skin: { select: { name: true } }
      }
    });
    
    console.log(`Found ${openOrders.length} open orders:`);
    openOrders.forEach((order, index) => {
      console.log(`${index + 1}. ${order.id} - ${order.side} - $${order.price} - Qty: ${order.remainingQty} - ${order.skin?.name}`);
    });
    
    // Environment check
    console.log('\n6. Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- VERCEL:', process.env.VERCEL);
    console.log('- DATABASE_URL exists:', !!process.env.DATABASE_URL);
    console.log('- DATABASE_URL preview:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrderIssue().catch(console.error); 