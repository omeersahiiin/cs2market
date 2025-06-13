const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

async function fixSkinImagesDirectSQL() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔧 CS2 Derivatives - Direct SQL Image Fix\n');
    
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
    
    // Get all skins using raw SQL
    console.log('🔍 Getting all skins from database...');
    const skins = await prisma.$queryRaw`SELECT id, name, "iconPath" FROM "skins"`;
    console.log(`Found ${skins.length} skins in database\n`);
    
    console.log('🖼️  Updating skin images...');
    let updatedCount = 0;
    
    for (const skin of skins) {
      try {
        // Find image URL
        let imageUrl = mappings.get(skin.name);
        if (!imageUrl) {
          // Try without pipe
          const withoutPipe = skin.name.replace(' | ', ' ');
          imageUrl = mappings.get(withoutPipe);
        }
        
        if (imageUrl && imageUrl !== skin.iconPath) {
          // Update using raw SQL
          await prisma.$executeRaw`
            UPDATE "skins" 
            SET "iconPath" = ${imageUrl} 
            WHERE id = ${skin.id}
          `;
          
          console.log(`✅ Updated: ${skin.name}`);
          updatedCount++;
        } else if (imageUrl) {
          console.log(`⏭️  Already correct: ${skin.name}`);
        } else {
          console.log(`❌ No image mapping for: ${skin.name}`);
        }
        
      } catch (error) {
        console.error(`❌ Error updating ${skin.name}:`, error.message);
      }
    }
    
    console.log(`\n🎉 Update Complete!`);
    console.log(`📊 Updated ${updatedCount} skins with proper images`);
    
    // Verify results using raw SQL
    console.log('\n🔍 Verifying updated skins...');
    const verifiedSkins = await prisma.$queryRaw`
      SELECT name, "iconPath" 
      FROM "skins" 
      WHERE "iconPath" LIKE 'https://community.cloudflare.steamstatic.com/%'
    `;
    
    console.log(`✅ ${verifiedSkins.length} skins now have valid Steam image URLs`);
    
    // Show some examples
    console.log('\n📋 Sample updated skins:');
    for (let i = 0; i < Math.min(5, verifiedSkins.length); i++) {
      const skin = verifiedSkins[i];
      console.log(`   ✅ ${skin.name}`);
    }
    
    console.log('\n🌐 Next Steps:');
    console.log('   1. Refresh your website');
    console.log('   2. All skin images should now display properly');
    console.log('   3. The "Image loading..." placeholders should be replaced with actual skin images');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

fixSkinImagesDirectSQL(); 