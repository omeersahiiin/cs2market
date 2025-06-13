const { PrismaClient } = require('@prisma/client');

async function checkDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Checking database connection...');
    
    const skins = await prisma.skin.findMany({
      select: {
        id: true,
        name: true,
        iconPath: true
      }
    });
    
    console.log(`✅ Found ${skins.length} skins in database:`);
    skins.forEach((skin, index) => {
      console.log(`${index + 1}. ID: ${skin.id} | Name: ${skin.name}`);
      console.log(`   Image: ${skin.iconPath ? 'Has image' : 'No image'}`);
    });
    
  } catch (error) {
    console.error('❌ Database error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkDatabase(); 