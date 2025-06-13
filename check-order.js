const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  try {
    console.log('🔍 Checking for order ID: cmbv65o4x0001lb04i1aqhzzh');
    
    const order = await prisma.order.findUnique({
      where: { id: 'cmbv65o4x0001lb04i1aqhzzh' },
      include: {
        user: true,
        skin: true,
        fills: true
      }
    });
    
    if (order) {
      console.log('✅ Order found:');
      console.log('- ID:', order.id);
      console.log('- User:', order.user.email);
      console.log('- Skin:', order.skin.name);
      console.log('- Side:', order.side);
      console.log('- Status:', order.status);
      console.log('- Price:', order.price);
      console.log('- Quantity:', order.quantity);
      console.log('- Remaining:', order.remainingQty);
      console.log('- Created:', order.createdAt);
      console.log('- Fills:', order.fills.length);
    } else {
      console.log('❌ Order not found in database');
    }
    
    // Also check all recent orders
    console.log('\n📋 Recent orders:');
    const recentOrders = await prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        skin: true
      }
    });
    
    recentOrders.forEach((order, i) => {
      console.log(`${i+1}. ${order.id} - ${order.user.email} - ${order.side} ${order.quantity} ${order.skin.name} @ $${order.price} (${order.status})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkOrder(); 