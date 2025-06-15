const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const supportedCryptos = [
  {
    symbol: 'BTC',
    name: 'Bitcoin',
    network: 'Bitcoin',
    decimals: 8,
    minDeposit: 0.001,
    requiredConfirmations: 3,
    depositFee: 0,
    iconUrl: '/crypto/btc.png'
  },
  {
    symbol: 'ETH',
    name: 'Ethereum',
    network: 'Ethereum',
    decimals: 18,
    minDeposit: 0.01,
    requiredConfirmations: 12,
    depositFee: 0,
    iconUrl: '/crypto/eth.png'
  },
  {
    symbol: 'USDT',
    name: 'Tether (TRC20)',
    network: 'Tron',
    contractAddress: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    decimals: 6,
    minDeposit: 10,
    requiredConfirmations: 20,
    depositFee: 0,
    iconUrl: '/crypto/usdt.png'
  },
  {
    symbol: 'SOL',
    name: 'Solana',
    network: 'Solana',
    decimals: 9,
    minDeposit: 0.1,
    requiredConfirmations: 1,
    depositFee: 0,
    iconUrl: '/crypto/sol.png'
  }
];

async function initializeCryptoSupport() {
  try {
    console.log('🚀 Initializing supported cryptocurrencies...');

    for (const crypto of supportedCryptos) {
      const result = await prisma.supportedCrypto.upsert({
        where: { symbol: crypto.symbol },
        update: {
          ...crypto,
          isActive: true
        },
        create: {
          ...crypto,
          isActive: true
        }
      });

      console.log(`✅ ${crypto.symbol} (${crypto.name}) - ${result.id}`);
    }

    console.log('🎉 Successfully initialized all supported cryptocurrencies!');
  } catch (error) {
    console.error('❌ Error initializing crypto support:', error);
  } finally {
    await prisma.$disconnect();
  }
}

initializeCryptoSupport(); 