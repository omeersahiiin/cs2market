const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Map skin types based on weapon names
const getWeaponType = (skinName) => {
  const name = skinName.toLowerCase();
  
  if (name.includes('awp')) return 'Sniper Rifle';
  if (name.includes('ak-47') || name.includes('m4a4') || name.includes('m4a1-s') || name.includes('galil')) return 'Rifle';
  if (name.includes('glock') || name.includes('desert eagle') || name.includes('usp')) return 'Pistol';
  if (name.includes('mp9') || name.includes('mac-10')) return 'SMG';
  if (name.includes('bayonet') || name.includes('karambit')) return 'Knife';
  
  return 'Unknown';
};

// Map skin rarity based on typical patterns and names
const getSkinRarity = (skinName) => {
  const name = skinName.toLowerCase();
  
  // Legendary/Contraband skins
  if (name.includes('dragon lore') || name.includes('howl') || name.includes('gungnir')) {
    return 'Contraband';
  }
  
  // Very rare/expensive skins typically Covert
  if (name.includes('fade') || name.includes('doppler') || name.includes('marble fade') || 
      name.includes('tiger tooth') || name.includes('wild lotus') || name.includes('fire serpent') ||
      name.includes('medusa') || name.includes('knight') || name.includes('poseidon') ||
      name.includes('blaze') || name.includes('emerald') || name.includes('ruby') || 
      name.includes('sapphire') || name.includes('black pearl') || name.includes('gamma doppler')) {
    return 'Covert';
  }
  
  // High-tier skins typically Classified
  if (name.includes('asiimov') || name.includes('vulcan') || name.includes('hyper beast') ||
      name.includes('printstream') || name.includes('the prince') || name.includes('hydroponic') ||
      name.includes('kill confirmed') || name.includes('hot rod') || name.includes('orion') ||
      name.includes('twilight galaxy') || name.includes('lightning strike')) {
    return 'Classified';
  }
  
  // Mid-tier skins typically Restricted
  if (name.includes('fuel injector') || name.includes('the empress') || name.includes('inheritance') ||
      name.includes('welcome to the jungle') || name.includes('icarus fell') || name.includes('case hardened') ||
      name.includes('whiteout') || name.includes('target acquired')) {
    return 'Restricted';
  }
  
  // Some special patterns are Mil-Spec
  if (name.includes('x-ray') || name.includes('jet set') || name.includes('midnight laminate') ||
      name.includes('rainbow spoon') || name.includes('wild lily')) {
    return 'Mil-Spec';
  }
  
  // Default to Covert for most premium skins
  return 'Covert';
};

// Generate realistic prices based on rarity and popularity
const generatePrice = (skinName, rarity) => {
  const name = skinName.toLowerCase();
  
  // Special high-value skins
  if (name.includes('dragon lore')) return Math.floor(Math.random() * 3000) + 12000; // 12k-15k
  if (name.includes('howl')) return Math.floor(Math.random() * 1000) + 4000; // 4k-5k
  if (name.includes('gungnir')) return Math.floor(Math.random() * 2000) + 8000; // 8k-10k
  if (name.includes('wild lotus')) return Math.floor(Math.random() * 1000) + 8000; // 8k-9k
  if (name.includes('fire serpent')) return Math.floor(Math.random() * 500) + 2500; // 2.5k-3k
  if (name.includes('medusa')) return Math.floor(Math.random() * 1000) + 4000; // 4k-5k
  
  // Knife prices
  if (name.includes('bayonet') || name.includes('karambit')) {
    if (name.includes('ruby') || name.includes('sapphire') || name.includes('emerald') || name.includes('black pearl')) {
      return Math.floor(Math.random() * 2000) + 3000; // 3k-5k for special gems
    }
    if (name.includes('doppler') || name.includes('gamma doppler')) {
      return Math.floor(Math.random() * 1000) + 800; // 800-1800 for doppler
    }
    if (name.includes('fade') || name.includes('marble fade') || name.includes('tiger tooth')) {
      return Math.floor(Math.random() * 800) + 600; // 600-1400 for other patterns
    }
  }
  
  // Premium AWP skins
  if (name.includes('awp')) {
    if (name.includes('fade')) return Math.floor(Math.random() * 300) + 800; // 800-1100
    if (name.includes('asiimov')) return Math.floor(Math.random() * 50) + 150; // 150-200
    if (name.includes('lightning strike')) return Math.floor(Math.random() * 100) + 300; // 300-400
    return Math.floor(Math.random() * 200) + 100; // 100-300 for other AWPs
  }
  
  // AK-47 skins
  if (name.includes('ak-47')) {
    if (name.includes('vulcan')) return Math.floor(Math.random() * 200) + 600; // 600-800
    if (name.includes('asiimov')) return Math.floor(Math.random() * 100) + 400; // 400-500
    if (name.includes('fuel injector')) return Math.floor(Math.random() * 100) + 250; // 250-350
    return Math.floor(Math.random() * 150) + 50; // 50-200 for other AKs
  }
  
  // M4 skins
  if (name.includes('m4a') || name.includes('m4a1')) {
    if (name.includes('knight')) return Math.floor(Math.random() * 1000) + 2000; // 2k-3k
    if (name.includes('hot rod')) return Math.floor(Math.random() * 200) + 400; // 400-600
    if (name.includes('asiimov')) return Math.floor(Math.random() * 100) + 200; // 200-300
    return Math.floor(Math.random() * 100) + 50; // 50-150 for other M4s
  }
  
  // Glock skins
  if (name.includes('glock')) {
    if (name.includes('fade')) return Math.floor(Math.random() * 200) + 350; // 350-550
    if (name.includes('gamma doppler')) {
      if (name.includes('emerald')) return Math.floor(Math.random() * 500) + 1000; // 1k-1.5k
      return Math.floor(Math.random() * 100) + 200; // 200-300 for other phases
    }
    return Math.floor(Math.random() * 50) + 25; // 25-75 for other Glocks
  }
  
  // Desert Eagle skins
  if (name.includes('desert eagle')) {
    if (name.includes('blaze')) return Math.floor(Math.random() * 100) + 300; // 300-400
    if (name.includes('emerald')) return Math.floor(Math.random() * 200) + 400; // 400-600
    return Math.floor(Math.random() * 100) + 50; // 50-150 for other Deagles
  }
  
  // USP skins
  if (name.includes('usp')) {
    if (name.includes('kill confirmed')) return Math.floor(Math.random() * 50) + 150; // 150-200
    if (name.includes('orion')) return Math.floor(Math.random() * 30) + 80; // 80-110
    return Math.floor(Math.random() * 50) + 20; // 20-70 for other USPs
  }
  
  // Default pricing based on rarity
  switch (rarity) {
    case 'Contraband': return Math.floor(Math.random() * 5000) + 5000; // 5k-10k
    case 'Covert': return Math.floor(Math.random() * 800) + 200; // 200-1000
    case 'Classified': return Math.floor(Math.random() * 300) + 100; // 100-400
    case 'Restricted': return Math.floor(Math.random() * 100) + 50; // 50-150
    case 'Mil-Spec': return Math.floor(Math.random() * 50) + 20; // 20-70
    default: return Math.floor(Math.random() * 100) + 50; // 50-150
  }
};

// Generate float ranges based on skin type and rarity
const generateFloatRange = (skinName, rarity) => {
  // Most skins have these standard ranges, some exceptions
  const name = skinName.toLowerCase();
  
  if (name.includes('doppler') || name.includes('gamma doppler')) {
    return { minFloat: 0.0, maxFloat: 0.08 }; // Doppler only FN-MW
  }
  
  if (name.includes('fade') || name.includes('marble fade') || name.includes('tiger tooth')) {
    return { minFloat: 0.0, maxFloat: 0.08 }; // Fade patterns only FN-MW
  }
  
  // Most skins have full range
  return { minFloat: 0.0, maxFloat: 1.0 };
};

// Parse the skin-images.txt file
async function parseSkinData() {
  const filePath = path.join(__dirname, '..', 'skin-images.txt');
  const fileContent = fs.readFileSync(filePath, 'utf-8');
  const lines = fileContent.split('\n').filter(line => line.trim());
  
  const skins = [];
  
  for (const line of lines) {
    const [skinName, imageUrl] = line.split(':https://');
    if (skinName && imageUrl) {
      const fullImageUrl = 'https://' + imageUrl.trim();
      const type = getWeaponType(skinName);
      const rarity = getSkinRarity(skinName);
      const price = generatePrice(skinName, rarity);
      const floatRange = generateFloatRange(skinName, rarity);
      
      // Extract wear from skin name if present
      let wear = 'Factory New';
      const wearPattern = /\((Factory New|Minimal Wear|Field-Tested|Well-Worn|Battle-Scarred)\)/i;
      const wearMatch = skinName.match(wearPattern);
      if (wearMatch) {
        wear = wearMatch[1];
      }
      
      skins.push({
        name: skinName.trim(),
        type: type,
        rarity: rarity,
        price: price,
        iconPath: fullImageUrl,
        imageUrl: fullImageUrl,
        wear: wear,
        minFloat: floatRange.minFloat,
        maxFloat: floatRange.maxFloat,
        description: `Premium CS2 skin: ${skinName.trim()}`,
      });
    }
  }
  
  return skins;
}

async function populateSkinsDatabase() {
  try {
    console.log('🔄 Starting to populate database with premium skins...');
    
    // Parse skin data from file
    const skins = await parseSkinData();
    console.log(`📊 Found ${skins.length} skins to add to database`);
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const skinData of skins) {
      try {
        // Check if skin already exists
        const existingSkin = await prisma.skin.findUnique({
          where: { name: skinData.name }
        });
        
        if (existingSkin) {
          console.log(`⏭️  Skipped: ${skinData.name} (already exists)`);
          skippedCount++;
          continue;
        }
        
        // Create new skin
        await prisma.skin.create({
          data: skinData
        });
        
        console.log(`✅ Added: ${skinData.name} - ${skinData.type} - ${skinData.rarity} - $${skinData.price}`);
        addedCount++;
        
        // Add a small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error adding ${skinData.name}:`, error.message);
      }
    }
    
    console.log('\n🎉 Database population completed!');
    console.log(`📈 Added: ${addedCount} new skins`);
    console.log(`⏭️  Skipped: ${skippedCount} existing skins`);
    console.log(`📊 Total skins processed: ${skins.length}`);
    
    // Display some statistics
    const totalSkins = await prisma.skin.count();
    const skinsByRarity = await prisma.skin.groupBy({
      by: ['rarity'],
      _count: { rarity: true }
    });
    
    console.log(`\n📊 Database Statistics:`);
    console.log(`Total skins in database: ${totalSkins}`);
    console.log(`Breakdown by rarity:`);
    for (const group of skinsByRarity) {
      console.log(`  ${group.rarity}: ${group._count.rarity} skins`);
    }
    
    // Show price ranges
    const priceStats = await prisma.skin.aggregate({
      _min: { price: true },
      _max: { price: true },
      _avg: { price: true }
    });
    
    console.log(`\n💰 Price Statistics:`);
    console.log(`Lowest price: $${priceStats._min.price}`);
    console.log(`Highest price: $${priceStats._max.price}`);
    console.log(`Average price: $${Math.round(priceStats._avg.price)}`);
    
  } catch (error) {
    console.error('❌ Error populating database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  populateSkinsDatabase()
    .then(() => {
      console.log('✨ Script completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = { populateSkinsDatabase }; 