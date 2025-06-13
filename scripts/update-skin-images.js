const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function updateSkinImages() {
  try {
    console.log('🔄 Starting skin image update process...');
    
    // Read the skin-images.txt file
    const skinImagesPath = path.join(__dirname, '..', 'skin-images.txt');
    const skinImagesContent = fs.readFileSync(skinImagesPath, 'utf-8');
    
    // Parse the content into a mapping object
    const skinImageMap = {};
    const lines = skinImagesContent.split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const [skinName, imageUrl] = line.split(':');
      if (skinName && imageUrl) {
        const cleanName = skinName.trim();
        skinImageMap[cleanName] = imageUrl.trim();
        
        // Also create variations with pipe separator
        if (cleanName.includes(' ')) {
          const parts = cleanName.split(' ');
          if (parts.length >= 2) {
            // Create version with pipe: "AWP Dragon Lore" -> "AWP | Dragon Lore"
            const withPipe = parts[0] + ' | ' + parts.slice(1).join(' ');
            skinImageMap[withPipe] = imageUrl.trim();
          }
        }
      }
    }
    
    console.log(`📋 Found ${Object.keys(skinImageMap).length} skin image mappings (including variations)`);
    
    // Get all skins from database
    const skins = await prisma.skin.findMany();
    console.log(`🎯 Found ${skins.length} skins in database`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    const updatedSkins = [];
    const notFoundSkins = [];
    
    // Update each skin with its corresponding image
    for (const skin of skins) {
      console.log(`🔍 Looking for: "${skin.name}"`);
      
      let imageUrl = skinImageMap[skin.name];
      
      // If not found, try alternative formats
      if (!imageUrl) {
        // Try without pipe: "AWP | Dragon Lore" -> "AWP Dragon Lore"
        const withoutPipe = skin.name.replace(' | ', ' ');
        imageUrl = skinImageMap[withoutPipe];
        
        if (imageUrl) {
          console.log(`📝 Found match using format: "${withoutPipe}"`);
        }
      }
      
      if (imageUrl) {
        await prisma.skin.update({
          where: { id: skin.id },
          data: { imageUrl: imageUrl }
        });
        console.log(`✅ Updated ${skin.name} with image URL`);
        updatedCount++;
        updatedSkins.push(skin.name);
      } else {
        console.log(`❌ No image found for: ${skin.name}`);
        notFoundCount++;
        notFoundSkins.push(skin.name);
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} skins`);
    console.log(`❌ No image found for: ${notFoundCount} skins`);
    
    if (updatedSkins.length > 0) {
      console.log('\n🎉 Updated skins:');
      updatedSkins.forEach(name => console.log(`   ✅ ${name}`));
    }
    
    if (notFoundSkins.length > 0) {
      console.log('\n❌ Skins without images:');
      notFoundSkins.forEach(name => console.log(`   ❌ ${name}`));
    }
    
    console.log('\n🎉 Skin image update process completed!');
    
  } catch (error) {
    console.error('❌ Error updating skin images:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the update
updateSkinImages(); 