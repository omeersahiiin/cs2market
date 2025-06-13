const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Most liquid CS2 skins based on trading volume analysis
const MOST_LIQUID_SKINS = [
  // Ultra High Liquidity - Most traded skins
  { name: 'AK-47 | Case Hardened', basePrice: 425.00, type: 'Rifle', rarity: 'Classified', liquidity: 'Ultra High' },
  { name: 'AWP | Dragon Lore', basePrice: 8500.00, type: 'Rifle', rarity: 'Covert', liquidity: 'Ultra High' },
  { name: 'AWP | Asiimov', basePrice: 145.20, type: 'Rifle', rarity: 'Covert', liquidity: 'Ultra High' },
  { name: 'M4A4 | Asiimov', basePrice: 95.30, type: 'Rifle', rarity: 'Covert', liquidity: 'Ultra High' },
  { name: 'AK-47 | Vulcan', basePrice: 185.75, type: 'Rifle', rarity: 'Covert', liquidity: 'Ultra High' },
  { name: 'Glock-18 | Fade', basePrice: 425.00, type: 'Pistol', rarity: 'Restricted', liquidity: 'Ultra High' },
  
  // Very High Liquidity
  { name: 'AK-47 | Fire Serpent', basePrice: 2850.00, type: 'Rifle', rarity: 'Covert', liquidity: 'Very High' },
  { name: 'M4A4 | Howl', basePrice: 4200.00, type: 'Rifle', rarity: 'Contraband', liquidity: 'Very High' },
  { name: 'AWP | Lightning Strike', basePrice: 285.50, type: 'Rifle', rarity: 'Covert', liquidity: 'Very High' },
  { name: 'AWP | Fade', basePrice: 1250.00, type: 'Rifle', rarity: 'Covert', liquidity: 'Very High' },
  { name: 'M4A1-S | Knight', basePrice: 1850.00, type: 'Rifle', rarity: 'Covert', liquidity: 'Very High' },
  { name: 'M4A1-S | Hot Rod', basePrice: 485.00, type: 'Rifle', rarity: 'Classified', liquidity: 'Very High' },
  { name: 'Desert Eagle | Blaze', basePrice: 385.00, type: 'Pistol', rarity: 'Restricted', liquidity: 'Very High' },
  { name: 'USP-S | Kill Confirmed', basePrice: 95.30, type: 'Pistol', rarity: 'Classified', liquidity: 'Very High' },
  
  // High Liquidity - Popular trading skins
  { name: 'AK-47 | Asiimov', basePrice: 125.50, type: 'Rifle', rarity: 'Covert', liquidity: 'High' },
  { name: 'AK-47 | The Empress', basePrice: 185.00, type: 'Rifle', rarity: 'Covert', liquidity: 'High' },
  { name: 'AWP | Printstream', basePrice: 425.00, type: 'Rifle', rarity: 'Covert', liquidity: 'High' },
  { name: 'M4A1-S | Printstream', basePrice: 285.00, type: 'Rifle', rarity: 'Covert', liquidity: 'High' },
  { name: 'Desert Eagle | Printstream', basePrice: 125.00, type: 'Pistol', rarity: 'Classified', liquidity: 'High' },
  { name: 'USP-S | Printstream', basePrice: 85.00, type: 'Pistol', rarity: 'Classified', liquidity: 'High' }
];

async function loadSkinImageMappings() {
  console.log('📖 Loading skin image mappings from skin-images.txt...');
  
  try {
    const filePath = path.join(__dirname, '..', 'skin-images.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    const mappings = new Map();
    
    for (const line of lines) {
      const [skinName, imageUrl] = line.split(':');
      if (skinName && imageUrl) {
        const cleanName = skinName.trim();
        const cleanUrl = imageUrl.trim();
        
        // Store both with and without pipe format
        mappings.set(cleanName, cleanUrl);
        
        // If name doesn't have pipe, also store with pipe format
        if (!cleanName.includes(' | ') && cleanName.includes(' ')) {
          const parts = cleanName.split(' ');
          if (parts.length >= 2) {
            const weapon = parts[0] + (parts[1].startsWith('-') ? parts[1] : '');
            const skinNamePart = parts.slice(weapon.includes('-') ? 2 : 1).join(' ');
            const pipeFormat = `${weapon} | ${skinNamePart}`;
            mappings.set(pipeFormat, cleanUrl);
          }
        }
        
        // If name has pipe, also store without pipe format
        if (cleanName.includes(' | ')) {
          const withoutPipe = cleanName.replace(' | ', ' ');
          mappings.set(withoutPipe, cleanUrl);
        }
      }
    }
    
    console.log(`✅ Loaded ${mappings.size} skin image mappings`);
    return mappings;
  } catch (error) {
    console.error('❌ Error loading skin image mappings:', error.message);
    return new Map();
  }
}

function getImageUrlForSkin(skinName, imageMappings) {
  // Try exact match first
  if (imageMappings.has(skinName)) {
    return imageMappings.get(skinName);
  }
  
  // Try case-insensitive match
  for (const [mappedName, url] of imageMappings.entries()) {
    if (mappedName.toLowerCase() === skinName.toLowerCase()) {
      return url;
    }
  }
  
  // Try partial match
  for (const [mappedName, url] of imageMappings.entries()) {
    if (mappedName.toLowerCase().includes(skinName.toLowerCase()) || 
        skinName.toLowerCase().includes(mappedName.toLowerCase())) {
      return url;
    }
  }
  
  return null;
}

async function updateExistingSkinsWithImages(imageMappings) {
  console.log('\n🖼️  Updating existing skins with images...');
  
  try {
    const existingSkins = await prisma.skin.findMany();
    console.log(`Found ${existingSkins.length} existing skins in database`);
    
    let updatedCount = 0;
    
    for (const skin of existingSkins) {
      const imageUrl = getImageUrlForSkin(skin.name, imageMappings);
      
      if (imageUrl && imageUrl !== skin.iconPath) {
        await prisma.skin.update({
          where: { id: skin.id },
          data: { iconPath: imageUrl }
        });
        
        console.log(`✅ Updated image for: ${skin.name}`);
        updatedCount++;
      }
    }
    
    console.log(`🎯 Updated ${updatedCount} existing skins with new images`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error updating existing skins:', error.message);
    return 0;
  }
}

async function addLiquidSkins(imageMappings) {
  console.log('\n💧 Adding most liquid CS2 skins to the market...');
  
  let addedCount = 0;
  let skippedCount = 0;
  
  for (const skinData of MOST_LIQUID_SKINS) {
    try {
      // Check if skin already exists
      const existingSkin = await prisma.skin.findFirst({
        where: { name: skinData.name }
      });
      
      if (existingSkin) {
        console.log(`⏭️  Skipped (already exists): ${skinData.name}`);
        skippedCount++;
        continue;
      }
      
      // Get image URL from mappings
      const imageUrl = getImageUrlForSkin(skinData.name, imageMappings);
      
      // Calculate current price with small variation
      const variation = 0.02; // 2% price variation
      const currentPrice = skinData.basePrice * (1 + (Math.random() - 0.5) * variation);
      
      // Create skin
      const skin = await prisma.skin.create({
        data: {
          name: skinData.name,
          iconPath: imageUrl || `https://via.placeholder.com/256x192?text=${encodeURIComponent(skinData.name)}`,
          type: skinData.type,
          rarity: skinData.rarity,
          price: parseFloat(currentPrice.toFixed(2)),
          wear: 'Factory New'
        }
      });
      
      console.log(`✅ Added: ${skinData.name}`);
      console.log(`   💰 Price: $${currentPrice.toFixed(2)}`);
      console.log(`   💧 Liquidity: ${skinData.liquidity}`);
      console.log(`   🖼️  Image: ${imageUrl ? '✅ Found' : '❌ Placeholder'}`);
      
      addedCount++;
      
    } catch (error) {
      console.error(`❌ Error adding ${skinData.name}:`, error.message);
    }
  }
  
  console.log(`\n🎯 Added ${addedCount} new liquid skins, skipped ${skippedCount} existing skins`);
  return addedCount;
}

async function generateMarketSummary() {
  console.log('\n📊 Market Summary:');
  
  try {
    const totalSkins = await prisma.skin.count();
    const avgPrice = await prisma.skin.aggregate({
      _avg: { price: true }
    });
    
    const skinsByType = await prisma.skin.groupBy({
      by: ['type'],
      _count: { type: true }
    });
    
    const skinsByRarity = await prisma.skin.groupBy({
      by: ['rarity'],
      _count: { rarity: true }
    });
    
    console.log(`📈 Total Skins: ${totalSkins}`);
    console.log(`💰 Average Price: $${avgPrice._avg.price?.toFixed(2) || '0.00'}`);
    
    console.log('\n🔫 By Type:');
    skinsByType.forEach(type => {
      console.log(`   ${type.type}: ${type._count.type} skins`);
    });
    
    console.log('\n💎 By Rarity:');
    skinsByRarity.forEach(rarity => {
      console.log(`   ${rarity.rarity}: ${rarity._count.rarity} skins`);
    });
    
    // Show most expensive skins
    const expensiveSkins = await prisma.skin.findMany({
      orderBy: { price: 'desc' },
      take: 5,
      select: { name: true, price: true, type: true }
    });
    
    console.log('\n💎 Most Expensive Skins:');
    expensiveSkins.forEach((skin, index) => {
      console.log(`   ${index + 1}. ${skin.name} - $${skin.price.toFixed(2)}`);
    });
    
  } catch (error) {
    console.error('❌ Error generating market summary:', error.message);
  }
}

async function main() {
  console.log('🚀 CS2 Derivatives - Skin Images & Liquid Market Setup\n');
  
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Connected to Supabase database\n');
    
    // Load skin image mappings
    const imageMappings = await loadSkinImageMappings();
    
    // Update existing skins with images
    const updatedImages = await updateExistingSkinsWithImages(imageMappings);
    
    // Add most liquid skins to the market
    const addedSkins = await addLiquidSkins(imageMappings);
    
    // Generate market summary
    await generateMarketSummary();
    
    console.log('\n🎉 Setup Complete!');
    console.log(`📊 Summary:`);
    console.log(`   🖼️  Updated ${updatedImages} existing skins with images`);
    console.log(`   💧 Added ${addedSkins} new liquid skins to the market`);
    console.log(`   📈 Your CS2 derivatives platform is ready for trading!`);
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Visit your deployed site to see the updated skins');
    console.log('   2. Test trading functionality with the new liquid skins');
    console.log('   3. Monitor trading volume and add more skins as needed');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Handle script termination
process.on('SIGINT', async () => {
  console.log('\n⏹️  Script interrupted');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️  Script terminated');
  await prisma.$disconnect();
  process.exit(0);
});

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 