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
        skinImageMap[skinName.trim()] = imageUrl.trim();
      }
    }
    
    console.log(`📋 Found ${Object.keys(skinImageMap).length} skin image mappings`);
    
    // Get all skins from database
    const skins = await prisma.skin.findMany();
    console.log(`🎯 Found ${skins.length} skins in database`);
    
    let updatedCount = 0;
    let notFoundCount = 0;
    
    // Update each skin with its corresponding image
    for (const skin of skins) {
      const imageUrl = skinImageMap[skin.name];
      
      if (imageUrl) {
        await prisma.skin.update({
          where: { id: skin.id },
          data: { imageUrl: imageUrl }
        });
        console.log(`✅ Updated ${skin.name} with image URL`);
        updatedCount++;
      } else {
        console.log(`❌ No image found for: ${skin.name}`);
        notFoundCount++;
      }
    }
    
    console.log('\n📊 Update Summary:');
    console.log(`✅ Successfully updated: ${updatedCount} skins`);
    console.log(`❌ No image found for: ${notFoundCount} skins`);
    console.log(`📋 Total skin mappings available: ${Object.keys(skinImageMap).length}`);
    
    // Show which mappings weren't used
    const usedMappings = skins.filter(skin => skinImageMap[skin.name]).map(skin => skin.name);
    const unusedMappings = Object.keys(skinImageMap).filter(name => !usedMappings.includes(name));
    
    if (unusedMappings.length > 0) {
      console.log('\n🔍 Unused image mappings (these skins might not exist in database):');
      unusedMappings.forEach(name => console.log(`   - ${name}`));
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