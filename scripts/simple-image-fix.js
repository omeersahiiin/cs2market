const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function fixSkinImages() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CS2 Derivatives - Simple Image Fix\n');
    
    // Connect to database
    await prisma.$connect();
    console.log('✅ Connected to Supabase database\n');
    
    // Load skin-images.txt
    console.log('📖 Loading skin-images.txt...');
    const filePath = path.join(__dirname, '..', 'skin-images.txt');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const lines = fileContent.split('\n').filter(line => line.trim());
    
    // Parse mappings
    const mappings = new Map();
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const skinName = line.substring(0, colonIndex).trim();
      const imageUrl = line.substring(colonIndex + 1).trim();
      
      if (skinName && imageUrl && imageUrl.startsWith('https://')) {
        mappings.set(skinName, imageUrl);
        
        // Also store with pipe format
        if (!skinName.includes(' | ') && skinName.includes(' ')) {
          const parts = skinName.split(' ');
          if (parts.length >= 2) {
            const weapon = parts[0] + (parts[1] && parts[1].startsWith('-') ? parts[1] : '');
            const skinNamePart = parts.slice(weapon.includes('-') ? 2 : 1).join(' ');
            const pipeFormat = `${weapon} | ${skinNamePart}`;
            mappings.set(pipeFormat, imageUrl);
          }
        }
      }
    }
    
    console.log(`✅ Loaded ${mappings.size} image mappings\n`);
    
    // Get all skins and update them one by one
    console.log('🖼️  Updating skin images...');
    
    // Manual updates for the skins we know exist
    const knownSkins = [
      'AK-47 | Case Hardened',
      'AWP | Dragon Lore', 
      'M4A4 | Asiimov',
      'AWP | Asiimov',
      'AK-47 | Vulcan',
      'Glock-18 | Fade',
      'AK-47 | Fire Serpent',
      'M4A4 | Howl',
      'AWP | Lightning Strike',
      'AWP | Fade',
      'M4A1-S | Knight',
      'M4A1-S | Hot Rod',
      'Desert Eagle | Blaze',
      'USP-S | Kill Confirmed',
      'AK-47 | Asiimov',
      'AK-47 | The Empress',
      'AWP | Printstream',
      'M4A1-S | Printstream',
      'Desert Eagle | Printstream',
      'USP-S | Printstream'
    ];
    
    let updatedCount = 0;
    
    for (const skinName of knownSkins) {
      try {
        // Find image URL
        let imageUrl = mappings.get(skinName);
        if (!imageUrl) {
          // Try without pipe
          const withoutPipe = skinName.replace(' | ', ' ');
          imageUrl = mappings.get(withoutPipe);
        }
        
        if (imageUrl) {
          // Update the skin
          const result = await prisma.skin.updateMany({
            where: { name: skinName },
            data: { iconPath: imageUrl }
          });
          
          if (result.count > 0) {
            console.log(`✅ Updated: ${skinName}`);
            updatedCount++;
          } else {
            console.log(`⚠️  Not found: ${skinName}`);
          }
        } else {
          console.log(`❌ No image mapping for: ${skinName}`);
        }
        
        // Small delay to avoid connection issues
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`❌ Error updating ${skinName}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Update Complete!`);
    console.log(`📊 Updated ${updatedCount} skins with proper images`);
    
    // Verify a few skins
    console.log('\n🔍 Verifying some updated skins...');
    try {
      const verifyList = ['AK-47 | Case Hardened', 'AWP | Dragon Lore', 'M4A4 | Asiimov'];
      for (const skinName of verifyList) {
        const skin = await prisma.skin.findFirst({
          where: { name: skinName },
          select: { name: true, iconPath: true }
        });
        
        if (skin) {
          const isValid = skin.iconPath && skin.iconPath.startsWith('https://community.cloudflare.steamstatic.com/');
          console.log(`${isValid ? '✅' : '❌'} ${skin.name}: ${isValid ? 'Valid' : 'Invalid'} URL`);
        }
      }
    } catch (error) {
      console.log('⚠️  Could not verify skins');
    }
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Refresh your website');
    console.log('   2. Check if skin images are now displaying properly');
    console.log('   3. If some images are still missing, run this script again');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkinImages(); 