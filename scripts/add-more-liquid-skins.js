const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Additional highly liquid CS2 skins from user's collected data
 * Selected based on trading volume and market activity
 */
const ADDITIONAL_LIQUID_SKINS = [
  // High-tier AWP skins
  {
    name: 'AWP | Gungnir',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJF-dKxmomZqPrxN7LEmyVT65wl2r7HrdWm21a3r0I_ZmimIoDEIVA8YlDQr1TswOjmh5G-tM_J1zI97acIhrrF',
    basePrice: 12500.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'AWP | The Prince',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FABz7PLfYQJH4t27kYy0mvLwOq7c2D4B7cQl3byS89um2Ffh_RE-Yzz3IYHDd1BoZ1yC_FLqyL2-gpa7u5jXiSw0eTyRlhg',
    basePrice: 3850.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'AWP | Printstream',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZ3w8zYYzRM-M-ihoWKmsj4OrzZgiUHscYiib6Q8Nj02QWw_EtsMjyhd9LEIFM3MgzX_lXvxLvr05Lt6smc1zI97QkMXi74',
    basePrice: 485.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // High-tier AK-47 skins
  {
    name: 'AK-47 | Wild Lotus',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJegJL_9C3moS0kfv7IbrdqWdY781lxOrH9tyl2APj_RFkYm6ncISWdw42ZwvX8wfoku3s15Tu6czKySZgu3U8pSGKi-NSbdE',
    basePrice: 8500.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'AK-47 | Hydroponic',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhh3szKcDBA49OJnpWFkPvxDLfYkWNFpsYhi7rFrNimilKy80doa2j6LYKRIwZrYw7W_QC7lenvgp_p7prKz3d9-n51eq1qbu8',
    basePrice: 1850.00,
    type: 'Rifle',
    rarity: 'Classified',
    liquidity: 'High'
  },
  {
    name: 'AK-47 | The Empress',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhnwMzJemkV09m7hJKOhOTLP7LWnn8f6pQn2L2Wptr0jlew-EJlN2-hINKcelM9aQ3VrAPsx-a5jJ-_78-bmmwj5HcHDHHAjQ',
    basePrice: 485.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // M4A1-S skins
  {
    name: 'M4A1-S | Blue Phosphor',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO3mb-Gw_alIITTmn5U-8h-gez--YXygED68hdkMm_1IoCcI1A_aQ6E81nvk-nogcO_tZ-cwHdjuHEqt3vYzRSziQYMMLLcIJ2naA',
    basePrice: 285.00,
    type: 'Rifle',
    rarity: 'Classified',
    liquidity: 'High'
  },
  {
    name: 'M4A1-S | Printstream',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITBhGJf_NZlmOzA-LP4jVC9vh5yYmGhJIKRdVA_NF6C-AC2yOjngJXu6MiaznU3v3Un7X-Iy0e1iEoeP_sv26JaEqwbxg',
    basePrice: 385.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // High-tier pistols
  {
    name: 'Glock-18 | Gamma Doppler',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0v73dDBH_t26kL-GluX2P77YjG5V18J9herKyoD8j1yg5RJsMGDzLNSddANoZ1jQ8lO4k7q5hJG86ZrAynsx63Mn5XmOmB2_hRlSLrs4qY6sP5g',
    basePrice: 1250.00,
    type: 'Pistol',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'Desert Eagle | Printstream',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PDdTjlH7duJhJKCmePnJ6nUl2Zu5Mx2gv2P9o-t21fj-RI_Nz2ncYbDcFNoYArYrgDql-3m08PptcjBn3tgs3Yis2GdwUJr9IfvpA',
    basePrice: 285.00,
    type: 'Pistol',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'USP-S | Printstream',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8jkIbLfgnhF-sBwh9bN_Iv9nBrj-BE-Nz2iJoXBJFJtYFzY_1e9yO-51pK-7prInHdl7yEi5niJzUawn1gSOR_ZgPWk',
    basePrice: 185.00,
    type: 'Pistol',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // Additional knives
  {
    name: 'Bayonet | Marble Fade',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLu8JAllx8zJfwJW5duzhr-Ehfb6NL7ummJW4NE_jOqWo4ijiQew_RVsZj-hJNDEc1A4aA6F_gW_yebnjMLo6JXLy3dguT5iuyg7TQfKWA',
    basePrice: 2850.00,
    type: 'Knife',
    rarity: 'Covert',
    liquidity: 'Ultra High'
  },
  {
    name: 'Bayonet | Tiger Tooth',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLu8JAllx8zJfwJW5duzhr-Ehfb6NL7ummJW4NE_jOqWo4ijiQew_RVsZj-hJNDEc1A4aA6F_gW_yebnjMLo6JXLy3dguT5iuyg7TQfKWA',
    basePrice: 1850.00,
    type: 'Knife',
    rarity: 'Covert',
    liquidity: 'Ultra High'
  }
];

async function addMoreLiquidSkins() {
  console.log('➕ Adding more highly liquid CS2 skins...\n');

  try {
    let addedCount = 0;
    let skippedCount = 0;

    for (const skinData of ADDITIONAL_LIQUID_SKINS) {
      // Check if skin already exists
      const existingSkin = await prisma.skin.findFirst({
        where: { name: skinData.name }
      });

      if (existingSkin) {
        console.log(`⏭️  Skipped: ${skinData.name} (already exists)`);
        skippedCount++;
        continue;
      }

      console.log(`➕ Adding: ${skinData.name}`);

      // Calculate price with small variation
      const basePrice = skinData.basePrice;
      const variation = 0.02; // 2% price variation
      const currentPrice = basePrice * (1 + (Math.random() - 0.5) * variation);

      // Create skin with price
      const skin = await prisma.skin.create({
        data: {
          name: skinData.name,
          iconPath: skinData.iconPath,
          type: skinData.type,
          rarity: skinData.rarity,
          price: parseFloat(currentPrice.toFixed(2)),
          wear: 'Factory New'
        }
      });

      console.log(`   💰 Price: $${currentPrice.toFixed(2)}`);
      console.log(`   🏷️  Type: ${skinData.type} | Rarity: ${skinData.rarity}`);
      console.log(`   💧 Liquidity: ${skinData.liquidity}`);
      console.log('');

      addedCount++;
    }

    // Get total count
    const totalSkins = await prisma.skin.count();

    console.log('📊 Summary:');
    console.log(`   ✅ Added: ${addedCount} new skins`);
    console.log(`   ⏭️  Skipped: ${skippedCount} existing skins`);
    console.log(`   🎯 Total skins: ${totalSkins}`);
    console.log(`   💧 Focus: High liquidity prevents manipulation\n`);

    console.log('🎯 New Skin Categories:');
    const categories = {};
    ADDITIONAL_LIQUID_SKINS.forEach(skin => {
      categories[skin.type] = (categories[skin.type] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} skins`);
    });

    console.log('\n💡 Next steps:');
    console.log('1. ✅ Database updated with additional liquid skins');
    console.log('2. 🔄 Restart your development server');
    console.log('3. 🌐 Visit http://localhost:3000/skins to see all skins');
    console.log('4. 🔍 Test the new filtering functionality');

  } catch (error) {
    console.error('❌ Error adding skins:', error.message);
    throw error;
  }
}

addMoreLiquidSkins()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 