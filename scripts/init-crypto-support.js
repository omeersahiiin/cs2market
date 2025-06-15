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
    name: 'Tether',
    network: 'Ethereum',
    contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    decimals: 6,
    minDeposit: 10,
    requiredConfirmations: 12,
    depositFee: 0,
    iconUrl: '/crypto/usdt.png'
  },
  {
    symbol: 'TRX',
    name: 'Tron',
    network: 'Tron',
    decimals: 6,
    minDeposit: 100,
    requiredConfirmations: 20,
    depositFee: 0,
    iconUrl: '/crypto/trx.png'
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