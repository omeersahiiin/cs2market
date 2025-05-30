const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugOrderMatching() {
  try {
    console.log('=== Debug Order Matching ===');
    
    // Get all orders for the AK-47 skin
    const orders = await prisma.order.findMany({
      where: {
        skinId: 'cmb5otztl0001tekka6mua3r1'
      }
    });
    
    console.log(`Total orders found: ${orders.length}`);
    
    if (orders.length > 0) {
      console.log('\nAll orders:');
      orders.forEach((order, i) => {
        console.log(`${i+1}. ${order.side} | $${order.price} | Qty: ${order.quantity} | Remaining: ${order.remainingQty} | Status: ${order.status}`);
      });
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugOrderMatching(); 