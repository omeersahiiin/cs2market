const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create test users
  const hashedPassword = await bcrypt.hash('test123', 10);
  
  const user1 = await prisma.user.upsert({
    where: { email: 'omeersahiiin8@gmail.com' },
    update: {},
    create: {
      email: 'omeersahiiin8@gmail.com',
      username: 'omeersahiiin8',
      password: hashedPassword,
      balance: 10000,
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: 'trader2@example.com' },
    update: {},
    create: {
      email: 'trader2@example.com',
      username: 'trader2',
      password: hashedPassword,
      balance: 15000,
    },
  });

  console.log('✅ Users created');

  // Create skins
  const skins = [
    {
      name: 'AWP | Dragon Lore',
      type: 'Sniper Rifle',
      rarity: 'Contraband',
      wear: 'Field-Tested',
      price: 7500.00,
      iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2PrdSijAWwqkVtN272JIGdJw46YVrYqVO3xLy-gJC9u5vByCBh6ygi7WGdwUKTYdRD8A',
    },
    {
      name: 'AK-47 | Fire Serpent',
      type: 'Rifle',
      rarity: 'Covert',
      wear: 'Field-Tested',
      price: 1250.00,
      iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszOeC9H_9mkhIWFg8j1OO-GqWlD6dN-teHE9Jrsxgfn_hBvMm6nIoaRIQA9aVqF8ljrxuu-jZfv6J_PnXQw73Ii4nqJzBGpwUYbKJ7O0IM',
    },
    {
      name: 'AWP | Asiimov',
      type: 'Sniper Rifle',
      rarity: 'Covert',
      wear: 'Field-Tested',
      price: 151.25,
      iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2DMBupQn2eqVotqkiwHiqhdlMmigJtOWJwE5Zw3X8wS-yea8jcDo7c7XiSw0g89L9us',
    },
    {
      name: 'M4A4 | Asiimov',
      type: 'Rifle',
      rarity: 'Covert',
      wear: 'Field-Tested',
      price: 109.99,
      iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GpQ7JMg0uyYoYin2wHj-kU6YGD0cYOUcFA9YFnS_AC9xeq508K0us7XiSw0vgXM_Rw',
    },
    {
      name: 'AK-47 | Vulcan',
      type: 'Rifle',
      rarity: 'Classified',
      wear: 'Minimal Wear',
      price: 185.75,
      iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV086jloKOhcj5Nr_Yg2Yf6cR02LmS9tn3ilK1qBVkMGzyIICRdgRvYVCDqwTsyO7n1JTo6M7PwGwj5Hei-fvc4A',
    }
  ];

  for (const skinData of skins) {
    await prisma.skin.upsert({
      where: { name: skinData.name },
      update: {},
      create: skinData,
    });
  }

  console.log('✅ Skins created');
  console.log('🎉 Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 