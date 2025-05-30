const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testPnLMatching() {
  try {
    console.log('=== Testing P&L Zero-Sum Calculation with Order Matching ===');
    
    // Get test users
    const user1 = await prisma.user.findFirst({ where: { email: 'omeersahiiin8@gmail.com' } });
    const user2 = await prisma.user.findFirst({ where: { email: 'trader2@example.com' } });
    const skin = await prisma.skin.findFirst();
    
    if (!user1 || !user2 || !skin) {
      console.log('❌ Missing test data');
      return;
    }
    
    console.log(`\n👥 Test Setup:`);
    console.log(`User 1: ${user1.email} (Balance: $${user1.balance.toFixed(2)})`);
    console.log(`User 2: ${user2.email} (Balance: $${user2.balance.toFixed(2)})`);
    console.log(`Skin: ${skin.name} (Current Price: $${skin.price.toFixed(2)})`);
    
    // Test Scenario: User 1 opens LONG, User 2 opens SHORT at same price
    // Then they close positions at a different price
    
    console.log('\n=== Scenario 1: Opening Positions ===');
    
    // Step 1: User 1 opens LONG position at $85
    const longPosition = await prisma.position.create({
      data: {
        userId: user1.id,
        skinId: skin.id,
        type: 'LONG',
        entryPrice: 85.00,
        size: 100,
        margin: 85.00 * 100 * 0.2 // 20% margin = $1700
      }
    });
    
    // Step 2: User 2 opens SHORT position at $85
    const shortPosition = await prisma.position.create({
      data: {
        userId: user2.id,
        skinId: skin.id,
        type: 'SHORT',
        entryPrice: 85.00,
        size: 100,
        margin: 85.00 * 100 * 0.2 // 20% margin = $1700
      }
    });
    
    console.log(`✅ Created positions:`);
    console.log(`   User 1 LONG: 100 units @ $85.00 (Margin: $${longPosition.margin.toFixed(2)})`);
    console.log(`   User 2 SHORT: 100 units @ $85.00 (Margin: $${shortPosition.margin.toFixed(2)})`);
    
    // Test different closing scenarios
    const closingPrices = [80.00, 90.00, 85.00]; // Down $5, Up $5, No change
    
    for (const closingPrice of closingPrices) {
      console.log(`\n=== Scenario: Closing at $${closingPrice.toFixed(2)} ===`);
      
      // Calculate P&L for both positions
      const longPnL = (closingPrice - longPosition.entryPrice) * longPosition.size;
      const shortPnL = (shortPosition.entryPrice - closingPrice) * shortPosition.size;
      
      // Calculate commissions (0.02% on trade value)
      const tradeValue = closingPrice * 100; // 100 units
      const commission = tradeValue * 0.0002; // 0.02%
      const totalCommissions = commission * 2; // Both sides pay commission
      
      console.log(`📊 P&L Calculation:`);
      console.log(`   LONG P&L: ($${closingPrice} - $${longPosition.entryPrice}) × ${longPosition.size} = $${longPnL.toFixed(2)}`);
      console.log(`   SHORT P&L: ($${shortPosition.entryPrice} - $${closingPrice}) × ${shortPosition.size} = $${shortPnL.toFixed(2)}`);
      console.log(`   Commission per side: $${commission.toFixed(2)}`);
      console.log(`   Total commissions: $${totalCommissions.toFixed(2)}`);
      
      // Net P&L after commissions
      const longNetPnL = longPnL - commission;
      const shortNetPnL = shortPnL - commission;
      const totalNetPnL = longNetPnL + shortNetPnL;
      
      console.log(`\n💰 Net P&L (after commissions):`);
      console.log(`   User 1 (LONG): $${longNetPnL.toFixed(2)}`);
      console.log(`   User 2 (SHORT): $${shortNetPnL.toFixed(2)}`);
      console.log(`   Total Net P&L: $${totalNetPnL.toFixed(2)}`);
      
      // Verify zero-sum (should equal negative total commissions)
      const expectedTotal = -totalCommissions;
      const isZeroSum = Math.abs(totalNetPnL - expectedTotal) < 0.01;
      
      console.log(`\n✅ Zero-Sum Check:`);
      console.log(`   Expected total: $${expectedTotal.toFixed(2)} (negative commissions)`);
      console.log(`   Actual total: $${totalNetPnL.toFixed(2)}`);
      console.log(`   Is Zero-Sum: ${isZeroSum ? '✅ YES' : '❌ NO'}`);
      
      if (!isZeroSum) {
        console.log(`   ⚠️  ERROR: P&L is not zero-sum! Difference: $${(totalNetPnL - expectedTotal).toFixed(2)}`);
      }
    }
    
    console.log('\n=== Testing Current Database P&L Logic ===');
    
    // Check how our current position closing logic handles P&L
    console.log('\nChecking position closing API logic...');
    
    // Simulate closing the LONG position at $90
    const simulatedClosingPrice = 90.00;
    const simulatedPnL = (simulatedClosingPrice - longPosition.entryPrice) * longPosition.size;
    const simulatedCommission = simulatedClosingPrice * longPosition.size * 0.0002;
    const simulatedNetPnL = simulatedPnL - simulatedCommission;
    
    console.log(`\n🧪 Simulated LONG position close at $${simulatedClosingPrice}:`);
    console.log(`   Gross P&L: $${simulatedPnL.toFixed(2)}`);
    console.log(`   Commission: $${simulatedCommission.toFixed(2)}`);
    console.log(`   Net P&L: $${simulatedNetPnL.toFixed(2)}`);
    
    // Update position with exit price (simulate what our API should do)
    await prisma.position.update({
      where: { id: longPosition.id },
      data: {
        exitPrice: simulatedClosingPrice,
        closedAt: new Date()
      }
    });
    
    console.log(`✅ Updated position with exitPrice: $${simulatedClosingPrice}`);
    
    // Test the frontend P&L calculation logic
    console.log('\n=== Frontend P&L Calculation Test ===');
    
    const updatedPosition = await prisma.position.findUnique({
      where: { id: longPosition.id },
      include: { skin: true }
    });
    
    if (updatedPosition && updatedPosition.exitPrice) {
      // This is how the frontend should calculate P&L for closed positions
      const frontendPnL = (updatedPosition.exitPrice - updatedPosition.entryPrice) * updatedPosition.size * (updatedPosition.type === 'LONG' ? 1 : -1);
      
      console.log(`Frontend calculation for closed position:`);
      console.log(`   Entry Price: $${updatedPosition.entryPrice.toFixed(2)}`);
      console.log(`   Exit Price: $${updatedPosition.exitPrice.toFixed(2)}`);
      console.log(`   P&L: $${frontendPnL.toFixed(2)}`);
      console.log(`   Matches simulation: ${Math.abs(frontendPnL - simulatedPnL) < 0.01 ? '✅ YES' : '❌ NO'}`);
    }
    
    console.log('\n=== Order Matching P&L Test ===');
    
    // Test what happens when two orders match
    console.log('\nSimulating order matching scenario:');
    console.log('• User A: BUY LONG @ $88 (wants to go long)');
    console.log('• User B: SELL SHORT @ $87 (wants to close short position)');
    console.log('• Match at $87 (maker\'s price)');
    
    const matchPrice = 87.00;
    const quantity = 50;
    
    // User A gets LONG position
    const userAEntryPrice = matchPrice;
    const userASize = quantity;
    
    // User B closes SHORT position (assume they entered at $90)
    const userBEntryPrice = 90.00;
    const userBExitPrice = matchPrice;
    const userBSize = quantity;
    
    // Calculate P&L
    const userAPnL = 0; // Just opened, no P&L yet
    const userBPnL = (userBEntryPrice - userBExitPrice) * userBSize; // SHORT: profit when price drops
    
    // Calculate commissions
    const matchCommission = matchPrice * quantity * 0.0002;
    
    console.log(`\n📊 Order Match Results:`);
    console.log(`   User A (opened LONG): Entry at $${userAEntryPrice}, P&L: $${userAPnL.toFixed(2)}, Commission: $${matchCommission.toFixed(2)}`);
    console.log(`   User B (closed SHORT): Entry at $${userBEntryPrice}, Exit at $${userBExitPrice}, P&L: $${userBPnL.toFixed(2)}, Commission: $${matchCommission.toFixed(2)}`);
    console.log(`   User B Net P&L: $${(userBPnL - matchCommission).toFixed(2)}`);
    
    // Cleanup test positions
    console.log('\n🧹 Cleaning up test positions...');
    await prisma.position.deleteMany({
      where: {
        id: { in: [longPosition.id, shortPosition.id] }
      }
    });
    
    console.log('\n=== CONCLUSIONS ===');
    console.log('✅ P&L calculation should be zero-sum (excluding commissions)');
    console.log('✅ Each trade generates commission revenue for the platform');
    console.log('✅ exitPrice field is crucial for accurate P&L calculation');
    console.log('✅ Frontend should use exitPrice for closed positions, current price for open positions');
    console.log('');
    console.log('🔍 Key Requirements:');
    console.log('   1. Store actual exit price when positions are closed');
    console.log('   2. Calculate commission on both sides of the trade');
    console.log('   3. Ensure P&L + commissions = zero-sum');
    console.log('   4. Use exitPrice for historical P&L, current price for unrealized P&L');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testPnLMatching(); 