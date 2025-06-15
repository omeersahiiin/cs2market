import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { PrismaClientSingleton } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// POST /api/admin/deploy-schema - Deploy database schema
export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'Database schema deployment required',
    status: 'pending',
    instructions: {
      step1: 'Run: npx prisma db push (to create crypto deposit tables)',
      step2: 'Run: npx prisma generate (to update Prisma client)',
      step3: 'Redeploy your application',
      step4: 'Visit /deposit page to test crypto deposits'
    },
    tables_to_create: [
      'crypto_deposits - for tracking user deposits',
      'supported_cryptos - for managing supported cryptocurrencies'
    ],
    note: 'After migration, the deposit system will be fully functional'
  });
}

// GET /api/admin/deploy-schema - Check database status
export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Database Schema Deployment Status',
    current_status: 'Tables need to be created',
    required_tables: [
      'crypto_deposits',
      'supported_cryptos'
    ],
    migration_command: 'npx prisma db push',
    next_steps: [
      '1. Connect to your database',
      '2. Run the migration command',
      '3. Redeploy the application',
      '4. Test the deposit functionality'
    ]
  });
} 