import { NextResponse } from 'next/server';
import { binanceAPI } from '@/lib/binance-api';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🧪 Testing Binance API in Next.js environment...');
    
    // Test environment variables
    const hasApiKey = !!process.env.BINANCE_API_KEY;
    const hasSecretKey = !!process.env.BINANCE_SECRET_KEY;
    
    console.log('Environment check:');
    console.log('- BINANCE_API_KEY exists:', hasApiKey);
    console.log('- BINANCE_SECRET_KEY exists:', hasSecretKey);
    
    if (hasApiKey) {
      console.log('- API Key length:', process.env.BINANCE_API_KEY!.length);
      console.log('- API Key starts with:', process.env.BINANCE_API_KEY!.substring(0, 10) + '...');
    }
    
    if (hasSecretKey) {
      console.log('- Secret Key length:', process.env.BINANCE_SECRET_KEY!.length);
      console.log('- Secret Key starts with:', process.env.BINANCE_SECRET_KEY!.substring(0, 10) + '...');
    }

    // Test Binance API validation
    console.log('Testing Binance API validation...');
    const isValid = await binanceAPI.validateCredentials();
    
    return NextResponse.json({
      success: true,
      message: 'Binance API test completed',
      results: {
        environmentVariables: {
          hasApiKey,
          hasSecretKey,
          apiKeyLength: hasApiKey ? process.env.BINANCE_API_KEY!.length : 0,
          secretKeyLength: hasSecretKey ? process.env.BINANCE_SECRET_KEY!.length : 0
        },
        binanceValidation: {
          isValid,
          status: isValid ? 'SUCCESS' : 'FAILED'
        }
      }
    });

  } catch (error) {
    console.error('❌ Binance API test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Binance API test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 