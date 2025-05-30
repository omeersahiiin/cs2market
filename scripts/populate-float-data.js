const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Float wear ranges (standard CS2 ranges)
const WEAR_RANGES = {
  'Factory New': { min: 0.00, max: 0.07 },
  'Minimal Wear': { min: 0.07, max: 0.15 },
  'Field-Tested': { min: 0.15, max: 0.38 },
  'Well-Worn': { min: 0.38, max: 0.45 },
  'Battle-Scarred': { min: 0.45, max: 1.00 }
};

// CS2 skin definition mappings
const SKIN_DEFINITIONS = {
  'AK-47 | Case Hardened': { defIndex: 7, paintIndex: 44 },
  'AWP | Dragon Lore': { defIndex: 9, paintIndex: 344 },
  'M4A4 | Asiimov': { defIndex: 16, paintIndex: 279 },
};

/**
 * Generate realistic float data for a skin
 */
function generateFloatData(skinName, basePrice) {
  const data = {};
  
  // Generate data for each wear condition
  Object.entries(WEAR_RANGES).forEach(([wear, range]) => {
    // Create price multipliers based on wear condition
    let priceMultipliers;
    switch (wear) {
      case 'Factory New':
        priceMultipliers = [1.8, 1.7, 1.6, 1.5, 1.4];
        break;
      case 'Minimal Wear':
        priceMultipliers = [1.3, 1.25, 1.2, 1.15];
        break;
      case 'Field-Tested':
        priceMultipliers = [1.0, 0.95, 0.9, 0.85, 0.8];
        break;
      case 'Well-Worn':
        priceMultipliers = [0.75, 0.7, 0.65];
        break;
      case 'Battle-Scarred':
        priceMultipliers = [0.6, 0.55, 0.5, 0.45];
        break;
      default:
        priceMultipliers = [1.0];
    }

    // Generate sample data points
    const samples = [];
    const rangeSize = (range.max - range.min) / priceMultipliers.length;
    
    priceMultipliers.forEach((multiplier, index) => {
      const floatValue = range.min + (index * rangeSize) + (rangeSize * Math.random());
      samples.push({
        float: Math.min(floatValue, range.max - 0.001), // Ensure within range
        price: basePrice * multiplier
      });
    });

    data[wear] = { samples };
  });

  return data;
}

/**
 * Create float ranges with pricing data
 */
function createFloatRanges(samples, wearRange) {
  const ranges = [];
  const rangeSize = (wearRange.max - wearRange.min) / 5; // Create 5 sub-ranges

  for (let i = 0; i < 5; i++) {
    const rangeMin = wearRange.min + (i * rangeSize);
    const rangeMax = wearRange.min + ((i + 1) * rangeSize);
    
    const samplesInRange = samples.filter(s => s.float >= rangeMin && s.float < rangeMax);
    
    if (samplesInRange.length > 0) {
      const avgPrice = samplesInRange.reduce((sum, s) => sum + s.price, 0) / samplesInRange.length;
      
      ranges.push({
        floatMin: rangeMin,
        floatMax: rangeMax,
        avgPrice,
        sampleSize: samplesInRange.length
      });
    }
  }

  return ranges;
}

/**
 * Populate float data for all skins
 */
async function populateFloatData() {
  try {
    console.log('🔄 Starting float data population...');
    
    // Get all skins
    const skins = await prisma.skin.findMany();
    console.log(`📊 Found ${skins.length} skins to process`);

    for (const skin of skins) {
      console.log(`\n🎯 Processing: ${skin.name}`);
      
      // Update skin with definition indices if available
      const skinDef = SKIN_DEFINITIONS[skin.name];
      if (skinDef) {
        await prisma.skin.update({
          where: { id: skin.id },
          data: {
            defIndex: skinDef.defIndex,
            paintIndex: skinDef.paintIndex,
            minFloat: 0.0,
            maxFloat: 1.0
          }
        });
        console.log(`  ✅ Updated skin definition indices`);
      }

      // Generate float data
      const floatData = generateFloatData(skin.name, skin.price);
      
      // Process each wear condition
      for (const [wear, data] of Object.entries(floatData)) {
        const samples = data.samples;
        const wearRange = WEAR_RANGES[wear];
        
        if (!samples.length || !wearRange) continue;

        const avgFloat = samples.reduce((sum, s) => sum + s.float, 0) / samples.length;
        const avgPrice = samples.reduce((sum, s) => sum + s.price, 0) / samples.length;

        // Upsert float data
        const floatDataRecord = await prisma.floatData.upsert({
          where: {
            skinId_wear: {
              skinId: skin.id,
              wear
            }
          },
          update: {
            avgFloat,
            avgPrice,
            sampleSize: samples.length,
            lastUpdated: new Date()
          },
          create: {
            skinId: skin.id,
            wear,
            floatMin: wearRange.min,
            floatMax: wearRange.max,
            avgFloat,
            avgPrice,
            sampleSize: samples.length
          }
        });

        // Clear existing price ranges
        await prisma.floatPriceRange.deleteMany({
          where: { floatDataId: floatDataRecord.id }
        });

        // Create new price ranges based on float distribution
        const ranges = createFloatRanges(samples, wearRange);
        
        for (const range of ranges) {
          await prisma.floatPriceRange.create({
            data: {
              floatDataId: floatDataRecord.id,
              floatMin: range.floatMin,
              floatMax: range.floatMax,
              avgPrice: range.avgPrice,
              sampleSize: range.sampleSize
            }
          });
        }

        console.log(`  📈 ${wear}: ${samples.length} samples, avg price $${avgPrice.toFixed(2)}`);
      }
    }

    console.log('\n🎉 Float data population completed successfully!');
    console.log('\n📋 Summary:');
    
    // Show summary statistics
    const totalFloatData = await prisma.floatData.count();
    const totalPriceRanges = await prisma.floatPriceRange.count();
    
    console.log(`  • ${totalFloatData} wear conditions processed`);
    console.log(`  • ${totalPriceRanges} price ranges created`);
    console.log(`  • Float analysis now available for all skins`);

  } catch (error) {
    console.error('❌ Error populating float data:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
populateFloatData(); 