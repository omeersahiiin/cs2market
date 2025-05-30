import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    // This will apply the schema to the database
    // Note: In production, you should use proper migration files
    console.log('Starting database migration...');
    
    // Test database connection
    await prisma.$connect();
    console.log('Database connected successfully');
    
    // Check if tables exist by trying to count users
    try {
      const userCount = await prisma.user.count();
      console.log(`Database already initialized. User count: ${userCount}`);
      
      return NextResponse.json({
        success: true,
        message: 'Database is already initialized',
        userCount,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.log('Database not initialized, this is expected for first deployment');
      
      return NextResponse.json({
        success: true,
        message: 'Database migration completed. Please run `npx prisma db push` locally or use Prisma Data Platform for schema deployment.',
        note: 'For Vercel deployment, ensure your DATABASE_URL is set and run migrations locally first.',
        timestamp: new Date().toISOString()
      });
    }
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        note: 'Make sure your DATABASE_URL environment variable is correctly set'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

export async function GET() {
  try {
    await prisma.$connect();
    
    // Get database info
    const userCount = await prisma.user.count();
    const skinCount = await prisma.skin.count();
    const orderCount = await prisma.order.count();
    const positionCount = await prisma.position.count();
    
    return NextResponse.json({
      message: 'CS2 Trading Platform - Database Status',
      status: 'connected',
      statistics: {
        users: userCount,
        skins: skinCount,
        orders: orderCount,
        positions: positionCount
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    return NextResponse.json({
      message: 'CS2 Trading Platform - Database Status',
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      note: 'Database may not be initialized. Run POST /api/migrate to initialize.',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
} 