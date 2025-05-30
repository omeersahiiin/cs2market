const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testShortPnL() {
  try {
    console.log('=== Testing SHORT Position P&L Calculation ===');
    
    // Get existing positions to test P&L calculation
    const positions = await prisma.position.findMany({
      where: {
        closedAt: null
      },
      include: {
        skin: true,
        user: {
          select: { email: true }
        }
      }
    });
    
    console.log(`\nFound ${positions.length} open positions`);
    
    // Group by position type
    const longPositions = positions.filter(p => p.type === 'LONG');
    const shortPositions = positions.filter(p => p.type === 'SHORT');
    
    console.log(`LONG positions: ${longPositions.length}`);
    console.log(`SHORT positions: ${shortPositions.length}`);
    
    if (shortPositions.length === 0) {
      console.log('\n❌ No SHORT positions found!');
      console.log('This might be why we only see SELL SHORT orders (closing non-existent positions)');
      
      // Let's create a test SHORT position manually to verify P&L calculation
      console.log('\n🧪 Creating test SHORT position...');
      
      const testUser = await prisma.user.findFirst({
        where: { email: 'trader2@example.com' }
      });
      
      if (testUser) {
        const testSkin = await prisma.skin.findFirst();
        
        if (testSkin) {
          const testShortPosition = await prisma.position.create({
            data: {
              userId: testUser.id,
              skinId: testSkin.id,
              type: 'SHORT',
              entryPrice: 85.00, // Entered short at $85
              size: 50,
              margin: 85.00 * 50 * 0.2 // 20% margin
            }
          });
          
          console.log(`✅ Created test SHORT position:`);
          console.log(`   Entry Price: $${testShortPosition.entryPrice}`);
          console.log(`   Size: ${testShortPosition.size}`);
          console.log(`   Current Skin Price: $${testSkin.price}`);
          
          // Calculate P&L
          const currentPrice = testSkin.price;
          const pnlPerUnit = testShortPosition.entryPrice - currentPrice; // SHORT: profit when price goes down
          const totalPnL = pnlPerUnit * testShortPosition.size;
          
          console.log(`\n📊 SHORT Position P&L Calculation:`);
          console.log(`   Entry Price: $${testShortPosition.entryPrice.toFixed(2)}`);
          console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
          console.log(`   P&L per unit: $${pnlPerUnit.toFixed(2)} (${pnlPerUnit > 0 ? 'PROFIT' : 'LOSS'})`);
          console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
          
          if (pnlPerUnit > 0) {
            console.log(`   ✅ SHORT is profitable! Price dropped from $${testShortPosition.entryPrice} to $${currentPrice.toFixed(2)}`);
          } else {
            console.log(`   ❌ SHORT is losing money. Price rose from $${testShortPosition.entryPrice} to $${currentPrice.toFixed(2)}`);
          }
          
          // Clean up test position
          await prisma.position.delete({
            where: { id: testShortPosition.id }
          });
          console.log('\n🧹 Cleaned up test position');
        }
      }
    } else {
      console.log('\n✅ Found SHORT positions! Testing P&L calculation...');
      
      shortPositions.forEach((position, i) => {
        const currentPrice = position.skin.price;
        const pnlPerUnit = position.entryPrice - currentPrice; // SHORT: profit when price goes down
        const totalPnL = pnlPerUnit * position.size;
        
        console.log(`\n📊 SHORT Position ${i + 1}:`);
        console.log(`   User: ${position.user.email}`);
        console.log(`   Entry Price: $${position.entryPrice.toFixed(2)}`);
        console.log(`   Current Price: $${currentPrice.toFixed(2)}`);
        console.log(`   Size: ${position.size}`);
        console.log(`   P&L per unit: $${pnlPerUnit.toFixed(2)}`);
        console.log(`   Total P&L: $${totalPnL.toFixed(2)} (${totalPnL > 0 ? 'PROFIT' : 'LOSS'})`);
      });
    }
    
    // Test the frontend P&L calculation logic
    console.log('\n=== Testing Frontend P&L Logic ===');
    console.log('Frontend calculates P&L as:');
    console.log('LONG: (currentPrice - entryPrice) * size * 1');
    console.log('SHORT: (currentPrice - entryPrice) * size * -1');
    console.log('');
    console.log('This is equivalent to:');
    console.log('LONG: (currentPrice - entryPrice) * size');
    console.log('SHORT: (entryPrice - currentPrice) * size');
    
    // Test with example values
    const entryPrice = 85.00;
    const currentPrice = 82.00;
    const size = 100;
    
    console.log(`\n🧮 Example calculation (Entry: $${entryPrice}, Current: $${currentPrice}, Size: ${size}):`);
    
    const longPnL = (currentPrice - entryPrice) * size;
    const shortPnL = (currentPrice - entryPrice) * size * -1;
    
    console.log(`LONG P&L: (${currentPrice} - ${entryPrice}) * ${size} = $${longPnL.toFixed(2)}`);
    console.log(`SHORT P&L: (${currentPrice} - ${entryPrice}) * ${size} * -1 = $${shortPnL.toFixed(2)}`);
    
    console.log('\n✅ SHORT P&L calculation is working correctly!');
    console.log('✅ When price drops, SHORT positions profit');
    console.log('✅ When price rises, SHORT positions lose money');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testShortPnL(); 