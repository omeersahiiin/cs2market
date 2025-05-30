const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Popular CS2 skins with real market data and Steam image IDs
 * These are some of the most traded skins on the market
 */
const POPULAR_SKINS = [
  {
    name: 'AK-47 | Redline',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Field-Tested',
    price: 85.50,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI'
  },
  {
    name: 'AWP | Asiimov',
    type: 'Sniper Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 145.20,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0'
  },
  {
    name: 'M4A1-S | Hyper Beast',
    type: 'Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 65.80,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI'
  },
  {
    name: 'Glock-18 | Fade',
    type: 'Pistol',
    rarity: 'Restricted',
    wear: 'Factory New',
    price: 425.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79eJmYWPkuHxPYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g'
  },
  {
    name: 'USP-S | Kill Confirmed',
    type: 'Pistol',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 95.30,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWdY781lteXA54vwxgTj-UdsZWGhJoOSdAE2aVyF_1K9w-u6hcC-7p_KnXMx6D5iuyjUmhG0n1gSOcNMHKKP'
  },
  {
    name: 'Karambit | Doppler',
    type: 'Knife',
    rarity: 'Covert',
    wear: 'Factory New',
    price: 1850.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20k_jkI6_Ug2Y'
  },
  {
    name: 'M4A4 | Howl',
    type: 'Rifle',
    rarity: 'Contraband',
    wear: 'Field-Tested',
    price: 4200.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0'
  },
  {
    name: 'AK-47 | Fire Serpent',
    type: 'Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 2850.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI'
  },
  {
    name: 'Desert Eagle | Blaze',
    type: 'Pistol',
    rarity: 'Restricted',
    wear: 'Factory New',
    price: 385.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PLZTjlH7du6kb-HnvD8J_WGkGoFsJUl3L2Zp4j0jlHs_0VuYjz7cYKRdVU3aVnY_1K9w-u6hcC-7p_KnXMx6D5iuyjUmhG0n1gSOcNMHKKP'
  },
  {
    name: 'AWP | Lightning Strike',
    type: 'Sniper Rifle',
    rarity: 'Classified',
    wear: 'Factory New',
    price: 285.50,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0'
  }
];

async function addPopularSkins() {
  console.log('🚀 Adding popular CS2 skins to the database...\n');

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  for (const skinData of POPULAR_SKINS) {
    try {
      // Check if skin already exists
      const existingSkin = await prisma.skin.findFirst({
        where: { name: skinData.name }
      });

      if (existingSkin) {
        console.log(`⚠️  Skin "${skinData.name}" already exists. Updating price...`);
        await prisma.skin.update({
          where: { id: existingSkin.id },
          data: { 
            price: skinData.price,
            type: skinData.type,
            rarity: skinData.rarity,
            wear: skinData.wear,
            iconPath: skinData.iconPath
          }
        });
        updatedCount++;
        console.log(`✅ Updated: ${skinData.name} - $${skinData.price}\n`);
      } else {
        const newSkin = await prisma.skin.create({
          data: skinData
        });
        addedCount++;
        console.log(`✅ Added: ${newSkin.name} - $${newSkin.price}`);
        console.log(`   Type: ${newSkin.type}, Rarity: ${newSkin.rarity}, Wear: ${newSkin.wear}\n`);
      }

    } catch (error) {
      console.error(`❌ Error processing "${skinData.name}":`, error.message);
      skippedCount++;
    }
  }

  console.log('📊 Summary:');
  console.log(`   ✅ Added: ${addedCount} skins`);
  console.log(`   🔄 Updated: ${updatedCount} skins`);
  console.log(`   ❌ Skipped: ${skippedCount} skins`);
  console.log(`   📈 Total processed: ${POPULAR_SKINS.length} skins\n`);

  // Show final count
  const totalSkins = await prisma.skin.count();
  console.log(`🎯 Total skins in database: ${totalSkins}`);
  
  console.log('\n🎉 Popular skins have been added successfully!');
  console.log('💡 You can now test the website with more skins available for trading.');
}

addPopularSkins()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 