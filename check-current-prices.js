const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkCurrentPrices() {
  try {
    console.log('🔍 Checking current prices in database...\n');

    // Check specific skins mentioned by user
    const specificSkins = ['AWP | Gungnir', 'AK-47 | Wild Lotus', 'AK-47 | Vulcan', 'AWP | Fade'];
    
    console.log('🎯 User-mentioned skins:');
    for (const skinName of specificSkins) {
      const skin = await prisma.skin.findFirst({
        where: { name: skinName }
      });
      
      if (skin) {
        console.log(`   ${skin.name}: $${parseFloat(skin.price).toLocaleString()}`);
      } else {
        console.log(`   ${skinName}: ❌ NOT FOUND`);
      }
    }

    // Check all skins with prices around $52 (problematic ones)
    console.log('\n🚨 Skins with prices around $52 (should be fixed):');
    const problematicSkins = await prisma.skin.findMany({
      where: {
        price: {
          gte: 50,
          lte: 55
        }
      },
      orderBy: { name: 'asc' }
    });

    if (problematicSkins.length > 0) {
      problematicSkins.forEach(skin => {
        console.log(`   ❌ ${skin.name}: $${parseFloat(skin.price).toFixed(2)}`);
      });
    } else {
      console.log('   ✅ No skins found with problematic pricing!');
    }

    // Show top 10 most expensive
    console.log('\n💎 Top 10 Most Expensive Skins:');
    const topSkins = await prisma.skin.findMany({
      orderBy: { price: 'desc' },
      take: 10
    });

    topSkins.forEach((skin, i) => {
      console.log(`   ${i+1}. ${skin.name}: $${parseFloat(skin.price).toLocaleString()}`);
    });

    // Show total count and market value
    console.log('\n📊 Market Summary:');
    const totalSkins = await prisma.skin.count();
    const allSkins = await prisma.skin.findMany();
    const totalValue = allSkins.reduce((sum, skin) => sum + parseFloat(skin.price), 0);
    
    console.log(`   Total Skins: ${totalSkins}`);
    console.log(`   Total Market Value: $${totalValue.toLocaleString()}`);
    console.log(`   Average Price: $${(totalValue / totalSkins).toFixed(2)}`);

  } catch (error) {
    console.error('❌ Error checking prices:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkCurrentPrices(); 