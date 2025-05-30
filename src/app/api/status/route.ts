import { NextResponse } from 'next/server';
import ProfessionalPriceService from '@/lib/professionalPriceService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const status = ProfessionalPriceService.getServiceStatus();
    
    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      apiKeys: status.apiKeys,
      cacheSize: status.cacheSize,
      lastRequests: status.lastRequests,
      recommendations: {
        csfloat: status.apiKeys.csfloat ? '✅ Configured' : '❌ Missing - Get from https://csfloat.com/api',
        steam: status.apiKeys.steam ? '✅ Configured' : '❌ Missing - Get from https://steamcommunity.com/dev/apikey',
        skinport: status.apiKeys.skinport ? '✅ Configured' : '⚠️ Optional - Get from https://skinport.com/api',
        dmarket: status.apiKeys.dmarket ? '✅ Configured' : '⚠️ Optional - Get from https://api.dmarket.com/docs'
      },
      nextSteps: status.apiKeys.csfloat && status.apiKeys.steam ? 
        ['All critical API keys configured!', 'Platform ready for real-time pricing'] :
        ['Get CSFloat API key (highest priority)', 'Get Steam API key (free)', 'Restart the application']
    });
  } catch (error) {
    console.error('Error getting service status:', error);
    return NextResponse.json(
      { error: 'Failed to get service status' },
      { status: 500 }
    );
  }
} 