import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';
import { binanceAPI } from '@/lib/binance-api';

export const dynamic = 'force-dynamic';

// Map our crypto symbols to Binance symbols
const CRYPTO_MAPPING = {
  'BTC': 'BTC',
  'ETH': 'ETH', 
  'USDT': 'USDT',
  'SOL': 'SOL'
};

// USD conversion rates (you might want to get these from an API)
const USD_RATES = {
  'BTC': 43000,
  'ETH': 2600,
  'USDT': 1,
  'SOL': 100
};

export async function POST() {
  return NextResponse.json({
    error: 'Crypto deposit monitoring temporarily disabled',
    message: 'Database schema needs to be migrated first',
    solution: 'Run: npx prisma db push to deploy the crypto deposit tables'
  }, { status: 503 });
}

// GET endpoint to check monitoring status
export async function GET() {
  return NextResponse.json({
    status: 'disabled',
    message: 'Crypto deposit monitoring temporarily disabled',
    reason: 'Database schema migration required'
  });
} 