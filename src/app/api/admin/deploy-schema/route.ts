import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// POST /api/admin/deploy-schema - Deploy database schema
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Starting database schema deployment...');
    
    const prisma = new PrismaClient();
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    console.log('📊 Checking database tables...');
    
    // Try to query each main table to see if they exist
    const tableChecks = [];
    const tables = [
      { name: 'User', model: 'user' },
      { name: 'Skin', model: 'skin' },
      { name: 'Order', model: 'order' },
      { name: 'Position', model: 'position' },
      { name: 'Trade', model: 'trade' },
      { name: 'OrderFill', model: 'orderFill' },
      { name: 'ConditionalOrder', model: 'conditionalOrder' },
      { name: 'FloatData', model: 'floatData' }
    ];
    
    for (const table of tables) {
      try {
        const count = await (prisma as any)[table.model].count();
        tableChecks.push({ table: table.name, status: 'exists', count });
        console.log(`✅ Table ${table.name}: ${count} records`);
      } catch (error) {
        tableChecks.push({ 
          table: table.name, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        console.log(`❌ Table ${table.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    await prisma.$disconnect();
    console.log('✅ Schema deployment check completed');
    
    return NextResponse.json({
      success: true,
      message: 'Database schema check completed',
      tables: tableChecks,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Schema deployment failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Schema deployment failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET /api/admin/deploy-schema - Check database status
export async function GET(request: NextRequest) {
  try {
    const prisma = new PrismaClient();
    
    await prisma.$connect();
    
    // Quick health check
    const userCount = await prisma.user.count();
    const skinCount = await prisma.skin.count();
    const orderCount = await prisma.order.count();
    
    await prisma.$disconnect();
    
    return NextResponse.json({
      status: 'healthy',
      tables: {
        users: userCount,
        skins: skinCount,
        orders: orderCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 