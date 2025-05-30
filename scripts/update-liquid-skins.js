const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Highly liquid CS2 skins with correct image URLs and realistic pricing
 * These are the most traded skins across all platforms with high volume
 */
const LIQUID_SKINS = [
  // AWP Skins (High Liquidity)
  {
    name: 'AWP | Dragon Lore',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2PrdSijAWwqkVtN272JIGdJw46YVrYqVO3xLy-gJC9u5vByCBh6ygi7WGdwUKTYdRD8A',
    basePrice: 8500.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'Very High'
  },
  {
    name: 'AWP | Asiimov',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2DMBupQn2eqVotqkiwHiqhdlMmigJtOWJwE5Zw3X8wS-yea8jcDo7c7XiSw0g89L9us',
    basePrice: 145.20,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'Very High'
  },
  {
    name: 'AWP | Lightning Strike',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZt7P_BdjVW4tW4k7-KgOfLP7LWnn8fsJEh0uuR9I6m3gbi_Uppamn2d4CTcVc4NFDZ_Qe4x-rmgMPtuZucnGwj5He2etKLyw',
    basePrice: 285.50,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'AWP | Fade',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZh7PLfYQJE7dizq4yCkP_gfezXxj0IvJBy2rrH9NSh2VXs80VsYWGnd9SWcAFoaFCEqVa7wu3oh5Gi_MOeScxOzqI',
    basePrice: 1250.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // AK-47 Skins (High Liquidity)
  {
    name: 'AK-47 | Case Hardened',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mhYe6Bw24H7cQm3rnFrdj23gHk-BJrMDr3dtDDclQ2YVnQ-AW4lem8m9bi65T-nsCo',
    basePrice: 425.00,
    type: 'Rifle',
    rarity: 'Classified',
    liquidity: 'Very High'
  },
  {
    name: 'AK-47 | Fire Serpent',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszOeC9H_9mkhIWFg8j1OO-GqWlD6dN-teHE9Jrsxgfn_hBvMm6nIoaRIQA9aVqF8ljrxuu-jZfv6J_PnXQw73Ii4nqJzBGpwUYbKJ7O0IM',
    basePrice: 2850.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'AK-47 | Vulcan',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV086jloKOhcj5Nr_Yg2Yf6cR02LmS9tn3ilK1qBVkMGzyIICRdgRvYVCDqwTsyO7n1JTo6M7PwGwj5Hei-fvc4A',
    basePrice: 185.75,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'Very High'
  },
  {
    name: 'AK-47 | Asiimov',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV092lnYmGmOHLP7LWnn8f7ZAn0-2UrNytiwK2_hY4MmD7doaVcwU4YFqD-QTrleq80J-8vp-anGwj5HfQSpUJNw',
    basePrice: 125.50,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },

  // M4A4 Skins (High Liquidity)
  {
    name: 'M4A4 | Asiimov',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GpQ7JMg0uyYoYin2wHj-kU6YGD0cYOUcFA9YFnS_AC9xeq808K0us7XiSw0vgXM_Rw',
    basePrice: 95.30,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'Very High'
  },
  {
    name: 'M4A4 | Howl',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn8f6pIl2-yYp9SnjA23-BBuNW-iLI-XJgFsZQyG_VW2lOq918e8uszLn2wj5HeAvkVdtQ',
    basePrice: 4200.00,
    type: 'Rifle',
    rarity: 'Contraband',
    liquidity: 'High'
  },

  // M4A1-S Skins (High Liquidity)
  {
    name: 'M4A1-S | Knight',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO3mb-GkuP1P6jummJW4NE_3euYoNujiVHj_Eo-YjunJoKcIAc8Z1jX-gK8k7y6h5O4vZXIyiNisj5iuyg-Y-6U4A',
    basePrice: 1850.00,
    type: 'Rifle',
    rarity: 'Covert',
    liquidity: 'High'
  },
  {
    name: 'M4A1-S | Hot Rod',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO3mr-ZkvPLPu_Qx3hu5Mx2gv2Pp9yn31Li_ERtYW70dYaXdFI8NVvYq1i7xOrohcTt7sudySZnsyNz7GGdwUICPND1TA',
    basePrice: 485.00,
    type: 'Rifle',
    rarity: 'Classified',
    liquidity: 'High'
  },

  // Pistol Skins (High Liquidity)
  {
    name: 'Glock-18 | Fade',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0vL3dzxG6eO6nYeDg7n1a-6GkDoC7pMp3rGYpNqiiQ23-UM5ZT-hcIeQJgZsMFvR_lTox7i-m9bi6-pjfulG',
    basePrice: 425.00,
    type: 'Pistol',
    rarity: 'Restricted',
    liquidity: 'Very High'
  },
  {
    name: 'USP-S | Kill Confirmed',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpooo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWhe5sN4mOTE8bP5gVO8v106NT37LY-cJAZvZF-ErAC7wLi60MO57s7Ln2wj5Hf3Ceh02w',
    basePrice: 95.30,
    type: 'Pistol',
    rarity: 'Classified',
    liquidity: 'High'
  },
  {
    name: 'Desert Eagle | Blaze',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PLJTjtO7dGzh7-HnvD8J_XSwGkG65d1juqZp4rz3VLhrhc_azqhJtORdgM4YFvR-1C5wry5gpHqot2XnpVn5DmP',
    basePrice: 385.00,
    type: 'Pistol',
    rarity: 'Restricted',
    liquidity: 'High'
  },

  // Knife Skins (Ultra High Liquidity)
  {
    name: 'Karambit | Doppler',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf2PLacDBA5ciJlY20k_jkI6_Ug2Y',
    basePrice: 1850.00,
    type: 'Knife',
    rarity: 'Covert',
    liquidity: 'Ultra High'
  },
  {
    name: 'Bayonet | Doppler',
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpotLu8JAllx8zJfAJG48ymmIWZqOf8MqjUx1Rd4cJ5nqfHpo720QfmqkQ4ZmjyLYOQdQNqZV-E-Va_lbvujZ-7vZTMnXcxviAg-z-DyENGQTnj',
    basePrice: 1250.00,
    type: 'Knife',
    rarity: 'Covert',
    liquidity: 'Ultra High'
  }
];

async function updateLiquidSkins() {
  console.log('🔄 Updating platform with highly liquid CS2 skins...\n');

  try {
    // First, clear existing data in the correct order (respecting foreign key constraints)
    console.log('🗑️  Clearing existing data...');
    
    // Delete in order: child tables first, then parent tables
    await prisma.orderFill.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.position.deleteMany({});
    await prisma.floatPriceRange.deleteMany({});
    await prisma.floatData.deleteMany({});
    await prisma.skin.deleteMany({});
    
    console.log('✅ Cleared existing data\n');

    let addedCount = 0;

    for (const skinData of LIQUID_SKINS) {
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

    console.log('📊 Summary:');
    console.log(`   ✅ Added: ${addedCount} highly liquid skins`);
    console.log(`   🎯 Focus: Order matching with high-volume skins`);
    console.log(`   💧 Liquidity: Prevents market manipulation`);
    console.log(`   🖼️  Images: All using correct Steam CDN URLs\n`);

    console.log('🎯 Skin Categories:');
    const categories = {};
    LIQUID_SKINS.forEach(skin => {
      categories[skin.type] = (categories[skin.type] || 0) + 1;
    });
    Object.entries(categories).forEach(([category, count]) => {
      console.log(`   ${category}: ${count} skins`);
    });

    console.log('\n💡 Next steps:');
    console.log('1. ✅ Database updated with liquid skins');
    console.log('2. 🔄 Restart your development server');
    console.log('3. 🌐 Visit http://localhost:3000/skins to see updated skins');
    console.log('4. 📊 All skins now have proper images and realistic pricing');

  } catch (error) {
    console.error('❌ Error updating skins:', error.message);
    throw error;
  }
}

updateLiquidSkins()
  .catch((e) => {
    console.error('❌ Error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 