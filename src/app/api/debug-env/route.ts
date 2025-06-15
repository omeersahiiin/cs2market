import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check environment variables without exposing full values
    const binanceApiKey = process.env.BINANCE_API_KEY;
    const binanceSecretKey = process.env.BINANCE_SECRET_KEY;
    
    const debug = {
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      hasApiKey: !!binanceApiKey,
      hasSecretKey: !!binanceSecretKey,
      apiKeyLength: binanceApiKey ? binanceApiKey.length : 0,
      secretKeyLength: binanceSecretKey ? binanceSecretKey.length : 0,
      apiKeyStart: binanceApiKey ? binanceApiKey.substring(0, 10) + '...' : 'NOT_FOUND',
      secretKeyStart: binanceSecretKey ? binanceSecretKey.substring(0, 10) + '...' : 'NOT_FOUND',
      allEnvKeys: Object.keys(process.env).filter(key => key.includes('BINANCE')),
      timestamp: new Date().toISOString()
    };

    console.log('🔍 Environment Debug:', debug);

    return NextResponse.json({
      success: true,
      message: 'Environment debug information',
      debug
    });

  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 