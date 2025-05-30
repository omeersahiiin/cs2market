const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSkinPrice() {
  try {
    // First, let's see all skins
    const skins = await prisma.skin.findMany();
    console.log('=== All Skins ===');
    skins.forEach(skin => {
      console.log(`ID: ${skin.id}`);
      console.log(`Name: ${skin.name}`);
      console.log(`Price: $${skin.price}`);
      console.log(`Updated: ${skin.updatedAt}`);
      console.log('---');
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkSkinPrice(); 