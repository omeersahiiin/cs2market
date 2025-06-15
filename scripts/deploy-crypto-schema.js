const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function deployCryptoSchema() {
  try {
    console.log('🚀 Deploying crypto deposit schema...');

    // Check if tables exist by trying to query them
    try {
      await prisma.supportedCrypto.findFirst();
      console.log('✅ SupportedCrypto table already exists');
    } catch (error) {
      console.log('❌ SupportedCrypto table does not exist - needs migration');
    }

    try {
      await prisma.cryptoDeposit.findFirst();
      console.log('✅ CryptoDeposit table already exists');
    } catch (error) {
      console.log('❌ CryptoDeposit table does not exist - needs migration');
    }

    console.log('📋 Schema deployment check complete');
    console.log('');
    console.log('🔧 To deploy the schema, run:');
    console.log('   npx prisma db push');
    console.log('');
    console.log('⚠️  Or use the admin API endpoint:');
    console.log('   POST /api/admin/deploy-schema');

  } catch (error) {
    console.error('❌ Error checking schema:', error);
  } finally {
    await prisma.$disconnect();
  }
}

deployCryptoSchema(); 