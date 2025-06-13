const fs = require('fs');
const path = require('path');

async function updateAllSkinImages() {
  // Import Prisma fresh each time
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  console.log('🔧 Complete Skin Image Update - All Skins\n');
  
  try {
    await prisma.$connect();
    console.log('✅ Connected to Supabase database\n');
    
    // Load all mappings from skin-images.txt
    console.log('📖 Loading skin-images.txt...');
    const filePath = path.join(__dirname, '..', 'skin-images.txt');
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n').filter(line => line.trim());
    
    const mappings = new Map();
    
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex === -1) continue;
      
      const skinName = line.substring(0, colonIndex).trim();
      const imageUrl = line.substring(colonIndex + 1).trim();
      
      if (skinName && imageUrl && imageUrl.startsWith('https://')) {
        // Store original mapping
        mappings.set(skinName, imageUrl);
        
        // Create pipe format version (database format)
        if (!skinName.includes(' | ') && skinName.includes(' ')) {
          const parts = skinName.split(' ');
          if (parts.length >= 2) {
            let weapon = parts[0];
            let startIndex = 1;
            
            // Handle weapons with hyphens (AK-47, M4A1-S, etc.)
            if (parts[1] && parts[1].startsWith('-')) {
              weapon += parts[1];
              startIndex = 2;
            }
            
            const skinNamePart = parts.slice(startIndex).join(' ');
            const pipeFormat = `${weapon} | ${skinNamePart}`;
            mappings.set(pipeFormat, imageUrl);
            
            console.log(`📝 Mapped: ${skinName} -> ${pipeFormat}`);
          }
        }
      }
    }
    
    console.log(`✅ Loaded ${mappings.size} total mappings\n`);
    
    // Get all skins from database using raw SQL to avoid cache issues
    console.log('🔍 Getting all skins from database...');
    const skins = await prisma.$queryRaw`SELECT id, name, "iconPath" FROM skins`;
    console.log(`Found ${skins.length} skins in database\n`);
    
    let updatedCount = 0;
    let alreadyCorrect = 0;
    let notFound = 0;
    
    console.log('🖼️  Updating skin images...\n');
    
    for (const skin of skins) {
      try {
        // Find matching image URL
        const imageUrl = mappings.get(skin.name);
        
        if (imageUrl) {
          // Check if already correct
          if (skin.iconPath === imageUrl) {
            console.log(`⏭️  ${skin.name} - Already correct`);
            alreadyCorrect++;
          } else {
            // Update using raw SQL to avoid prepared statement cache
            await prisma.$executeRaw`
              UPDATE skins 
              SET "iconPath" = ${imageUrl} 
              WHERE id = ${skin.id}
            `;
            
            console.log(`✅ ${skin.name}`);
            console.log(`   🔗 ${imageUrl.substring(0, 60)}...`);
            updatedCount++;
          }
        } else {
          console.log(`❌ ${skin.name} - No mapping found`);
          notFound++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 10));
        
      } catch (error) {
        console.error(`❌ Error updating ${skin.name}:`, error.message);
      }
    }
    
    console.log(`\n📊 Update Summary:`);
    console.log(`   ✅ Updated: ${updatedCount} skins`);
    console.log(`   ⏭️  Already correct: ${alreadyCorrect} skins`);
    console.log(`   ❌ No mapping: ${notFound} skins`);
    console.log(`   📈 Total processed: ${skins.length} skins`);
    
    // Verify results
    console.log('\n🔍 Verifying results...');
    const validSkins = await prisma.$queryRaw`
      SELECT COUNT(*) as count 
      FROM skins 
      WHERE "iconPath" LIKE 'https://community.cloudflare.steamstatic.com/%'
    `;
    
    const totalValidCount = Number(validSkins[0].count);
    console.log(`✅ ${totalValidCount} skins now have valid Steam image URLs`);
    
    // Show some examples of updated skins
    console.log('\n📋 Sample updated skins:');
    const sampleSkins = await prisma.$queryRaw`
      SELECT name, "iconPath" 
      FROM skins 
      WHERE "iconPath" LIKE 'https://community.cloudflare.steamstatic.com/%'
      LIMIT 5
    `;
    
    for (const skin of sampleSkins) {
      console.log(`   ✅ ${skin.name}`);
    }
    
    console.log('\n🎉 Complete! All available skin images have been updated.');
    console.log('\n🌐 Next Steps:');
    console.log('   1. Deploy to production: vercel --prod');
    console.log('   2. Clear browser cache and refresh your website');
    console.log('   3. All mapped skins should now display proper images');
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

updateAllSkinImages(); 