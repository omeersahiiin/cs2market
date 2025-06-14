const { execSync } = require('child_process');

console.log('🚀 Deploying database schema to production...');

try {
  // Generate Prisma client
  console.log('📦 Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
  
  // Push schema to database (creates tables if they don't exist)
  console.log('🗄️  Pushing schema to database...');
  execSync('npx prisma db push', { stdio: 'inherit' });
  
  console.log('✅ Database schema deployed successfully!');
  
} catch (error) {
  console.error('❌ Error deploying database schema:', error.message);
  process.exit(1);
} 