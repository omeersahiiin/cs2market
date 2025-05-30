const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Helper script to add new skins to the database
 * Usage: node scripts/add-skin.js "Skin Name" "Type" "Rarity" "Wear" "Price" "SteamImageID"
 * 
 * Example:
 * node scripts/add-skin.js "AK-47 | Redline" "Rifle" "Classified" "Field-Tested" "85.50" "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mtYbiJkjoDvcAlj7yVotmtjAfjrkpoZW36IoaWclM3MFnY8lK9k-vnm9bi67lSw9Es"
 * 
 * To get the Steam Image ID:
 * 1. Go to wiki.cs.money and find the skin page
 * 2. Look for the Steam CDN image URL in the page source or inspect element
 * 3. Copy the part after "/economy/image/" (the long base64-like string)
 */

async function addSkin() {
  const args = process.argv.slice(2);
  
  if (args.length !== 6) {
    console.log('Usage: node scripts/add-skin.js "Skin Name" "Type" "Rarity" "Wear" "Price" "SteamImageID"');
    console.log('');
    console.log('Example:');
    console.log('node scripts/add-skin.js "AK-47 | Redline" "Rifle" "Classified" "Field-Tested" "85.50" "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mtYbiJkjoDvcAlj7yVotmtjAfjrkpoZW36IoaWclM3MFnY8lK9k-vnm9bi67lSw9Es"');
    console.log('');
    console.log('To get the Steam Image ID:');
    console.log('1. Go to wiki.cs.money and find the skin page');
    console.log('2. Look for the Steam CDN image URL in the page source or inspect element');
    console.log('3. Copy the part after "/economy/image/" (the long base64-like string)');
    process.exit(1);
  }

  const [name, type, rarity, wear, priceStr, iconPath] = args;
  const price = parseFloat(priceStr);

  if (isNaN(price)) {
    console.error('Error: Price must be a valid number');
    process.exit(1);
  }

  try {
    // Check if skin already exists
    const existingSkin = await prisma.skin.findFirst({
      where: { name }
    });

    if (existingSkin) {
      console.log(`Skin "${name}" already exists. Updating...`);
      const updatedSkin = await prisma.skin.update({
        where: { id: existingSkin.id },
        data: { type, rarity, wear, price, iconPath }
      });
      console.log(`✅ Updated skin: ${updatedSkin.name}`);
    } else {
      const newSkin = await prisma.skin.create({
        data: { name, type, rarity, wear, price, iconPath }
      });
      console.log(`✅ Added new skin: ${newSkin.name}`);
    }

    // Verify the image URL works
    const fullImageUrl = `https://steamcommunity-a.akamaihd.net/economy/image/${iconPath}`;
    console.log(`🖼️  Image URL: ${fullImageUrl}`);
    
  } catch (error) {
    console.error('Error adding skin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

addSkin(); 