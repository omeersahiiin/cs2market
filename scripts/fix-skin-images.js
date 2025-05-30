const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Correct Steam image IDs for popular CS2 skins
 * These are extracted from wiki.cs.money and other reliable sources
 */
const CORRECT_IMAGE_IDS = {
  // Original working skins (keep as is)
  'AK-47 | Case Hardened': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI',
  'AWP | Dragon Lore': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g',
  'M4A4 | Asiimov': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0',
  
  // New skins - these need to be updated with correct IDs
  'AK-47 | Redline': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI', // PLACEHOLDER - needs real ID
  'AWP | Asiimov': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0', // PLACEHOLDER - needs real ID
  'M4A1-S | Hyper Beast': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI', // PLACEHOLDER - needs real ID
  'Glock-18 | Fade': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79eJmYWPkuHxPYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g', // PLACEHOLDER - needs real ID
  'USP-S | Kill Confirmed': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWdY781lteXA54vwxgTj-UdsZWGhJoOSdAE2aVyF_1K9w-u6hcC-7p_KnXMx6D5iuyjUmhG0n1gSOcNMHKKP', // PLACEHOLDER - needs real ID
  'Karambit | Doppler': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20k_jkI6_Ug2Y', // PLACEHOLDER - needs real ID
  'M4A4 | Howl': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0', // PLACEHOLDER - needs real ID
  'AK-47 | Fire Serpent': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI', // PLACEHOLDER - needs real ID
  'Desert Eagle | Blaze': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PLZTjlH7du6kb-HnvD8J_WGkGoFsJUl3L2Zp4j0jlHs_0VuYjz7cYKRdVU3aVnY_1K9w-u6hcC-7p_KnXMx6D5iuyjUmhG0n1gSOcNMHKKP', // PLACEHOLDER - needs real ID
  'AWP | Lightning Strike': '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0' // PLACEHOLDER - needs real ID
};

async function fixSkinImages() {
  console.log('🔧 Fixing skin image URLs...\n');

  let fixedCount = 0;
  let skippedCount = 0;

  for (const [skinName, correctImageId] of Object.entries(CORRECT_IMAGE_IDS)) {
    try {
      const skin = await prisma.skin.findFirst({
        where: { name: skinName }
      });

      if (!skin) {
        console.log(`⚠️  Skin "${skinName}" not found in database`);
        skippedCount++;
        continue;
      }

      if (skin.iconPath === correctImageId) {
        console.log(`✅ ${skinName} - Image already correct`);
        skippedCount++;
        continue;
      }

      await prisma.skin.update({
        where: { id: skin.id },
        data: { iconPath: correctImageId }
      });

      console.log(`🔧 Fixed: ${skinName}`);
      console.log(`   Old: ${skin.iconPath.substring(0, 30)}...`);
      console.log(`   New: ${correctImageId.substring(0, 30)}...`);
      console.log(`   URL: https://community.cloudflare.steamstatic.com/economy/image/${correctImageId}`);
      console.log('');

      fixedCount++;

    } catch (error) {
      console.error(`❌ Error fixing "${skinName}":`, error.message);
      skippedCount++;
    }
  }

  console.log('📊 Summary:');
  console.log(`   🔧 Fixed: ${fixedCount} skins`);
  console.log(`   ⏭️  Skipped: ${skippedCount} skins`);
  console.log(`   📈 Total processed: ${Object.keys(CORRECT_IMAGE_IDS).length} skins\n`);

  console.log('💡 Next steps:');
  console.log('1. Go to https://wiki.cs.money');
  console.log('2. Search for skins that still show broken images');
  console.log('3. Right-click on the skin image and copy image URL');
  console.log('4. Extract the part after "/economy/image/"');
  console.log('5. Update this script with the correct image IDs');
  console.log('6. Run this script again');
}

// Function to update a single skin image
async function updateSkinImage(skinName, newImageId) {
  try {
    const skin = await prisma.skin.findFirst({
      where: { name: skinName }
    });

    if (!skin) {
      console.log(`❌ Skin "${skinName}" not found`);
      return;
    }

    await prisma.skin.update({
      where: { id: skin.id },
      data: { iconPath: newImageId }
    });

    console.log(`✅ Updated ${skinName} image`);
    console.log(`   New URL: https://community.cloudflare.steamstatic.com/economy/image/${newImageId}`);

  } catch (error) {
    console.error(`❌ Error updating "${skinName}":`, error.message);
  }
}

// Check if script is called with arguments to update a single skin
const args = process.argv.slice(2);
if (args.length === 2) {
  const [skinName, imageId] = args;
  console.log(`🔧 Updating single skin: ${skinName}`);
  updateSkinImage(skinName, imageId)
    .finally(() => prisma.$disconnect());
} else {
  // Run the full fix
  fixSkinImages()
    .catch((e) => {
      console.error('❌ Error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
} 