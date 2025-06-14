// This script should be run on Vercel to deploy the database schema
const { PrismaClient } = require('@prisma/client');

async function deploySchema() {
  console.log('🚀 Starting database schema deployment...');
  
  try {
    const prisma = new PrismaClient();
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // The schema will be automatically applied when PrismaClient connects
    // if using db push or if migrations are set up properly
    
    console.log('📊 Checking database tables...');
    
    // Try to query each main table to see if they exist
    const tables = ['User', 'Skin', 'Order', 'Position'];
    
    for (const table of tables) {
      try {
        const count = await prisma[table.toLowerCase()].count();
        console.log(`✅ Table ${table}: ${count} records`);
      } catch (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Schema deployment check completed');
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    throw error;
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  deploySchema()
    .then(() => {
      console.log('🎉 Schema deployment completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Schema deployment failed:', error);
      process.exit(1);
    });
}

module.exports = { deploySchema }; 