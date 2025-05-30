const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  // Create first test user (or update if exists)
  const hashedPassword = await bcrypt.hash('test123', 10);
  await prisma.user.upsert({
    where: { email: 'omeersahiiin8@gmail.com' },
    update: {},
    create: {
      email: 'omeersahiiin8@gmail.com',
      username: 'omeersahiiin8',
      password: hashedPassword,
      balance: 10000 // $10,000 starting balance
    }
  });

  // Create second test user for order matching testing
  const hashedPassword2 = await bcrypt.hash('test456', 10);
  await prisma.user.upsert({
    where: { email: 'trader2@example.com' },
    update: {},
    create: {
      email: 'trader2@example.com',
      username: 'trader2',
      password: hashedPassword2,
      balance: 15000 // $15,000 starting balance
    }
  });

  // Create market maker account to collect commission fees
  const marketMakerPassword = await bcrypt.hash('marketmaker123', 10);
  await prisma.user.upsert({
    where: { email: 'marketmaker@cs2derivatives.com' },
    update: {},
    create: {
      email: 'marketmaker@cs2derivatives.com',
      username: 'marketmaker',
      password: marketMakerPassword,
      balance: 0 // $0 starting balance - will collect commission fees
    }
  });

  // Sample CS2 skins data with real Steam CDN URLs
  const skins = [
    {
      name: 'AK-47 | Case Hardened',
      type: 'Rifle',
      rarity: 'Classified',
      wear: 'Field-Tested',
      iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mtYbiJkjoDvcAlj7yVotmtjAfjrkpoZW36IoaWclM3MFnY8lK9k-vnm9bi67lSw9Es',
      price: 85.50,
    },
    {
      name: 'AWP | Dragon Lore',
      type: 'Sniper Rifle',
      rarity: 'Covert',
      wear: 'Field-Tested',
      iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g',
      price: 7276.30,
    },
    {
      name: 'M4A4 | Asiimov',
      type: 'Rifle',
      rarity: 'Covert',
      wear: 'Battle-Scarred',
      iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0',
      price: 125.75,
    },
  ];

  // Check if skins already exist
  const existingSkins = await prisma.skin.count();
  
  if (existingSkins === 0) {
  for (const skin of skins) {
    await prisma.skin.create({
      data: skin,
    });
    }
    console.log('Created sample skins.');
  } else {
    console.log('Skins already exist, skipping skin creation.');
  }

  console.log('Database has been seeded. 🌱');
  console.log('Test accounts created:');
  console.log('1. omeersahiiin8@gmail.com / test123 ($10,000 balance)');
  console.log('2. trader2@example.com / test456 ($15,000 balance)');
  console.log('3. marketmaker@cs2derivatives.com / marketmaker123 ($0 balance - collects commission fees)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 