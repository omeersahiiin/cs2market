const fs = require('fs');
const path = require('path');

async function fixImages() {
  // Import Prisma fresh
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  console.log('🔧 Final Image Fix - Fresh Start\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to database\n');
    
    // Load mappings
    const filePath = path.join(__dirname, '..', 'skin-images.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const mappings = {};
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const name = line.substring(0, colonIndex).trim();
      const url = line.substring(colonIndex + 1).trim();
      
      if (name && url && url.startsWith('https://')) {
        mappings[name] = url;
        
        // Also store with pipe format
        if (!name.includes(' | ') && name.includes(' ')) {
          const parts = name.split(' ');
          if (parts.length >= 2) {
            const weapon = parts[0] + (parts[1] && parts[1].startsWith('-') ? parts[1] : '');
            const skinName = parts.slice(weapon.includes('-') ? 2 : 1).join(' ');
            const pipeFormat = `${weapon} | ${skinName}`;
            mappings[pipeFormat] = url;
          }
        }
      }
    }
    
    console.log(`📖 Loaded ${Object.keys(mappings).length} mappings\n`);
    
    // Update specific skins we know exist
    const updates = [
      { name: 'AK-47 | Case Hardened', mapping: 'AK-47 Case Hardened' },
      { name: 'AWP | Dragon Lore', mapping: 'AWP Dragon Lore' },
      { name: 'M4A4 | Asiimov', mapping: 'M4A4 Asiimov' },
      { name: 'AWP | Asiimov', mapping: 'AWP Asiimov' },
      { name: 'AK-47 | Vulcan', mapping: 'AK-47 Vulcan' },
      { name: 'Glock-18 | Fade', mapping: 'Glock-18 Fade' },
      { name: 'AK-47 | Fire Serpent', mapping: 'AK-47 Fire Serpent' },
      { name: 'M4A4 | Howl', mapping: 'M4A4 Howl' },
      { name: 'AWP | Lightning Strike', mapping: 'AWP Lightning Strike' },
      { name: 'AWP | Fade', mapping: 'AWP Fade' },
      { name: 'M4A1-S | Knight', mapping: 'M4A1-S Knight' },
      { name: 'M4A1-S | Hot Rod', mapping: 'M4A1-S Hot Rod' },
      { name: 'Desert Eagle | Blaze', mapping: 'Desert Eagle Blaze' },
      { name: 'USP-S | Kill Confirmed', mapping: 'USP-S Kill Confirmed' },
      { name: 'AK-47 | Asiimov', mapping: 'AK-47 Asiimov' },
      { name: 'AK-47 | The Empress', mapping: 'AK-47 The Empress' },
      { name: 'AWP | Printstream', mapping: 'AWP Printstream' },
      { name: 'M4A1-S | Printstream', mapping: 'M4A1-S Printstream' },
      { name: 'Desert Eagle | Printstream', mapping: 'Desert Eagle Printstream' },
      { name: 'USP-S | Printstream', mapping: 'USP-S Printstream' }
    ];
    
    let successCount = 0;
    
    for (const update of updates) {
      try {
        const imageUrl = mappings[update.name] || mappings[update.mapping];
        
        if (imageUrl) {
          const result = await prisma.skin.updateMany({
            where: { name: update.name },
            data: { iconPath: imageUrl }
          });
          
          if (result.count > 0) {
            console.log(`✅ ${update.name}`);
            successCount++;
          } else {
            console.log(`⚠️  ${update.name} - not found in DB`);
          }
        } else {
          console.log(`❌ ${update.name} - no image mapping`);
        }
        
        // Small delay
        await new Promise(resolve => setTimeout(resolve, 50));
        
      } catch (error) {
        console.log(`❌ ${update.name} - error: ${error.message}`);
      }
    }
    
    console.log(`\n🎉 Success! Updated ${successCount} skins`);
    
    // Quick verification
    const validSkins = await prisma.skin.findMany({
      where: {
        iconPath: {
          startsWith: 'https://community.cloudflare.steamstatic.com/'
        }
      },
      select: { name: true }
    });
    
    console.log(`✅ ${validSkins.length} skins now have valid Steam images`);
    console.log('\n🌐 Refresh your website to see the images!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixImages(); 