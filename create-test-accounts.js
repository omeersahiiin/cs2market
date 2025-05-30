const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

// Test accounts for friends
const TEST_ACCOUNTS = [
  { email: 'alex@cs2trading.com', username: 'alex_trader', name: 'Alex', balance: 25000 },
  { email: 'sarah@cs2trading.com', username: 'sarah_pro', name: 'Sarah', balance: 25000 },
  { email: 'mike@cs2trading.com', username: 'mike_sniper', name: 'Mike', balance: 25000 },
  { email: 'emma@cs2trading.com', username: 'emma_ak47', name: 'Emma', balance: 25000 },
  { email: 'david@cs2trading.com', username: 'david_awp', name: 'David', balance: 25000 },
  { email: 'lisa@cs2trading.com', username: 'lisa_knife', name: 'Lisa', balance: 25000 },
  { email: 'james@cs2trading.com', username: 'james_glock', name: 'James', balance: 25000 },
  { email: 'anna@cs2trading.com', username: 'anna_m4a4', name: 'Anna', balance: 25000 },
  { email: 'tom@cs2trading.com', username: 'tom_deagle', name: 'Tom', balance: 25000 },
  { email: 'kate@cs2trading.com', username: 'kate_usp', name: 'Kate', balance: 25000 }
];

async function createTestAccounts() {
  console.log('🎮 Creating 10 Test Accounts for CS2 Derivatives Trading');
  console.log('=' .repeat(60));
  
  try {
    const hashedPassword = await bcrypt.hash('cs2trading123', 12);
    
    console.log('🔐 Creating accounts with password: cs2trading123');
    console.log('💰 Each account starts with $25,000 balance\n');
    
    for (const account of TEST_ACCOUNTS) {
      // Check if account already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: account.email }
      });
      
      if (existingUser) {
        // Update existing account
        await prisma.user.update({
          where: { email: account.email },
          data: { 
            balance: account.balance,
            username: account.username
          }
        });
        console.log(`✅ Updated: ${account.name} (${account.username}) - ${account.email}`);
      } else {
        // Create new account
        await prisma.user.create({
          data: {
            email: account.email,
            username: account.username,
            password: hashedPassword,
            balance: account.balance
          }
        });
        console.log(`🆕 Created: ${account.name} (${account.username}) - ${account.email}`);
      }
    }
    
    console.log('\n🎯 Test Account Summary:');
    console.log('=' .repeat(40));
    console.log('📧 Login Credentials:');
    console.log('   Password for all accounts: cs2trading123');
    console.log('   Balance for all accounts: $25,000\n');
    
    console.log('👥 Account List:');
    TEST_ACCOUNTS.forEach((account, index) => {
      console.log(`${index + 1}.  ${account.name.padEnd(6)} | ${account.username.padEnd(12)} | ${account.email}`);
    });
    
    console.log('\n🚀 Ready for Testing!');
    console.log('   Your friends can now log in and start trading CS2 skin derivatives');
    console.log('   Each account has $25,000 to test with');
    console.log('   They can trade LONG/SHORT positions on any CS2 skin');
    
    // Get total user count
    const totalUsers = await prisma.user.count();
    console.log(`\n📊 Total users in database: ${totalUsers}`);
    
  } catch (error) {
    console.error('❌ Error creating test accounts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestAccounts(); 