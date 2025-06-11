#!/usr/bin/env node

/**
 * Cloud Database Migration Script
 * Migrate from localhost PostgreSQL to cloud database
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

console.log('🚀 CS2 Derivatives - Cloud Database Migration\n');

const CLOUD_OPTIONS = {
  supabase: {
    name: 'Supabase (PostgreSQL)',
    pricing: {
      free: '$0/month - 500MB, 2 CPU cores',
      pro: '$25/month - 8GB RAM, 4 CPU cores',
      team: '$599/month - 32GB RAM, 8 CPU cores'
    },
    features: [
      '✅ Real-time subscriptions',
      '✅ Built-in connection pooling',
      '✅ Automatic backups',
      '✅ Global CDN',
      '✅ Perfect for Prisma'
    ],
    setup: 'https://supabase.com/dashboard/projects'
  },
  planetscale: {
    name: 'PlanetScale (MySQL)',
    pricing: {
      hobby: '$0/month - 1 database, 1GB',
      scaler: '$39/month - 10GB, branching',
      pro: '$99/month - 100GB, analytics'
    },
    features: [
      '✅ Serverless scaling',
      '✅ Database branching',
      '✅ Zero-downtime schema changes',
      '✅ Global read replicas'
    ],
    setup: 'https://planetscale.com/dashboard'
  },
  neon: {
    name: 'Neon (PostgreSQL)',
    pricing: {
      free: '$0/month - 512MB, 1 compute unit',
      launch: '$19/month - 10GB, autoscaling',
      scale: '$69/month - 200GB, advanced features'
    },
    features: [
      '✅ Cost-effective',
      '✅ Auto-scaling',
      '✅ Branching',
      '✅ Serverless'
    ],
    setup: 'https://neon.tech/dashboard'
  }
};

function displayOptions() {
  console.log('🏗️ RECOMMENDED CLOUD DATABASE OPTIONS:\n');
  
  Object.entries(CLOUD_OPTIONS).forEach(([key, option]) => {
    console.log(`📊 ${option.name}`);
    console.log('   Pricing:');
    Object.entries(option.pricing).forEach(([tier, price]) => {
      console.log(`   - ${tier}: ${price}`);
    });
    console.log('   Features:');
    option.features.forEach(feature => {
      console.log(`   ${feature}`);
    });
    console.log(`   Setup: ${option.setup}`);
    console.log('');
  });
}

function generateMigrationSteps() {
  console.log('🔄 MIGRATION STEPS:\n');
  
  console.log('Step 1: Choose Your Cloud Provider');
  console.log('- Recommended: Supabase Pro ($25/month)');
  console.log('- Alternative: PlanetScale Scaler ($39/month)');
  console.log('- Budget: Neon Launch ($19/month)');
  console.log('');
  
  console.log('Step 2: Create Cloud Database');
  console.log('- Sign up for chosen provider');
  console.log('- Create new project/database');
  console.log('- Get connection string');
  console.log('');
  
  console.log('Step 3: Update Environment Variables');
  console.log('- Update DATABASE_URL in .env');
  console.log('- Test connection');
  console.log('');
  
  console.log('Step 4: Run Migration');
  console.log('- npx prisma migrate deploy');
  console.log('- npx prisma db seed');
  console.log('');
  
  console.log('Step 5: Verify & Test');
  console.log('- Test all API endpoints');
  console.log('- Verify price updates work');
  console.log('- Check trading functionality');
  console.log('');
}

function generateSupabaseSetup() {
  console.log('🎯 SUPABASE SETUP (RECOMMENDED):\n');
  
  console.log('1. Go to: https://supabase.com/dashboard/projects');
  console.log('2. Click "New Project"');
  console.log('3. Choose:');
  console.log('   - Name: cs2-derivatives-prod');
  console.log('   - Database Password: [generate strong password]');
  console.log('   - Region: [closest to your users]');
  console.log('4. Wait for database to be ready (2-3 minutes)');
  console.log('5. Go to Settings > Database');
  console.log('6. Copy connection string');
  console.log('7. Update your .env file:');
  console.log('');
  console.log('DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"');
  console.log('');
  console.log('8. Run migration:');
  console.log('   npx prisma migrate deploy');
  console.log('   npx prisma db seed');
  console.log('');
}

function generatePerformanceOptimizations() {
  console.log('⚡ PERFORMANCE OPTIMIZATIONS FOR TRADING:\n');
  
  console.log('Database Indexes (add to schema.prisma):');
  console.log('```prisma');
  console.log('model Order {');
  console.log('  // ... existing fields ...');
  console.log('  @@index([skinId, status, createdAt])');
  console.log('  @@index([userId, status])');
  console.log('  @@index([price, side, skinId])');
  console.log('}');
  console.log('');
  console.log('model Position {');
  console.log('  // ... existing fields ...');
  console.log('  @@index([userId, skinId])');
  console.log('  @@index([skinId, type])');
  console.log('}');
  console.log('');
  console.log('model Skin {');
  console.log('  // ... existing fields ...');
  console.log('  @@index([price])');
  console.log('  @@index([type, rarity])');
  console.log('}');
  console.log('```');
  console.log('');
  
  console.log('Connection Pool Settings:');
  console.log('```env');
  console.log('DATABASE_URL="postgresql://...?connection_limit=20&pool_timeout=20"');
  console.log('```');
  console.log('');
  
  console.log('Real-time Price Updates:');
  console.log('- Use database triggers for instant notifications');
  console.log('- Implement WebSocket connections');
  console.log('- Cache frequently accessed data');
  console.log('');
}

function generateCostEstimation() {
  console.log('💰 COST ESTIMATION FOR YOUR PLATFORM:\n');
  
  console.log('Development Phase (0-100 users):');
  console.log('- Database: Supabase Free ($0/month)');
  console.log('- Hosting: Vercel Free ($0/month)');
  console.log('- APIs: Free tiers ($0/month)');
  console.log('- Total: $0/month');
  console.log('');
  
  console.log('Beta Phase (100-1000 users):');
  console.log('- Database: Supabase Pro ($25/month)');
  console.log('- Hosting: Vercel Pro ($20/month)');
  console.log('- APIs: PriceEmpire (~$30/month)');
  console.log('- Total: ~$75/month');
  console.log('');
  
  console.log('Production Phase (1000+ users):');
  console.log('- Database: Supabase Team ($599/month)');
  console.log('- Hosting: Vercel Team ($100/month)');
  console.log('- APIs: Premium tiers (~$100/month)');
  console.log('- CDN: Cloudflare Pro ($20/month)');
  console.log('- Total: ~$819/month');
  console.log('');
  
  console.log('💡 Revenue Potential:');
  console.log('- 1000 active traders × $10/month = $10,000/month');
  console.log('- Trading fees: 0.1% × $1M volume = $1,000/month');
  console.log('- Total potential: $11,000/month');
  console.log('- Profit margin: ~93% ($10,181/month profit)');
  console.log('');
}

async function testCurrentDatabase() {
  console.log('🧪 Testing Current Database Connection:\n');
  
  try {
    const prisma = new PrismaClient();
    
    // Test basic connection
    const userCount = await prisma.user.count();
    const skinCount = await prisma.skin.count();
    const orderCount = await prisma.order.count();
    
    console.log('✅ Database connection successful');
    console.log(`📊 Current data: ${userCount} users, ${skinCount} skins, ${orderCount} orders`);
    
    // Test query performance
    const start = Date.now();
    await prisma.skin.findMany({ take: 10 });
    const queryTime = Date.now() - start;
    
    console.log(`⚡ Query performance: ${queryTime}ms`);
    
    if (queryTime > 100) {
      console.log('⚠️  Slow queries detected - cloud database will improve this');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
  }
}

// Main execution
async function main() {
  displayOptions();
  generateMigrationSteps();
  generateSupabaseSetup();
  generatePerformanceOptimizations();
  generateCostEstimation();
  await testCurrentDatabase();
  
  console.log('🎯 RECOMMENDATION:');
  console.log('Start with Supabase Pro ($25/month) for the best balance of');
  console.log('performance, features, and cost for your CS2 trading platform.');
  console.log('');
  console.log('🚀 Ready to migrate? Follow the Supabase setup steps above!');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main }; 