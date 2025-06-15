const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function deploySchema() {
  console.log('🚀 Deploying crypto deposit database schema...');
  
  try {
    // Deploy the schema using Prisma
    console.log('📋 Running: npx prisma db push');
    const { stdout, stderr } = await execAsync('npx prisma db push --accept-data-loss');
    
    if (stderr && !stderr.includes('warning')) {
      console.error('❌ Error:', stderr);
      process.exit(1);
    }
    
    console.log('✅ Schema deployed successfully!');
    console.log(stdout);
    
    // Generate Prisma client
    console.log('🔄 Regenerating Prisma client...');
    const { stdout: genStdout } = await execAsync('npx prisma generate');
    console.log('✅ Prisma client regenerated!');
    console.log(genStdout);
    
    console.log('🎉 Database schema deployment complete!');
    console.log('');
    console.log('📝 Next steps:');
    console.log('1. Your crypto deposit tables are now created');
    console.log('2. The deposit page should work without errors');
    console.log('3. You can now set up Binance API for automatic monitoring');
    
  } catch (error) {
    console.error('❌ Failed to deploy schema:', error.message);
    console.log('');
    console.log('🔧 Manual deployment:');
    console.log('1. Run: npx prisma db push');
    console.log('2. Run: npx prisma generate');
    process.exit(1);
  }
}

deploySchema(); 