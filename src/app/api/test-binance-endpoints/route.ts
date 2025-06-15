import { NextRequest, NextResponse } from 'next/server';

const BINANCE_ENDPOINTS = [
  { name: 'Production Vision', url: 'https://api.binance.vision' },
  { name: 'Data API Vision', url: 'https://data-api.binance.vision' },
  { name: 'Stream Vision', url: 'https://stream.binance.vision' },
  { name: 'Main', url: 'https://api.binance.com' },
  { name: 'Backup 1', url: 'https://api1.binance.com' },
  { name: 'Backup 2', url: 'https://api2.binance.com' },
  { name: 'Backup 3', url: 'https://api3.binance.com' },
  { name: 'Alternative CC', url: 'https://api.binance.cc' },
  { name: 'Testnet Vision', url: 'https://testnet.binance.vision' }
];

export async function GET(request: NextRequest) {
  const results = [];
  
  console.log('🧪 Testing all Binance endpoints from Turkey (including production alternatives)...');
  
  for (const endpoint of BINANCE_ENDPOINTS) {
    try {
      console.log(`Testing ${endpoint.name}: ${endpoint.url}`);
      
      const startTime = Date.now();
      
      // Test basic connectivity first (without auth)
      const response = await fetch(`${endpoint.url}/api/v3/ping`, {
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });
      
      const responseTime = Date.now() - startTime;
      
      if (response.ok) {
        // If basic ping works, test with authentication (if we have credentials)
        const hasCredentials = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
        let authStatus = 'N/A';
        
        if (hasCredentials && !endpoint.url.includes('testnet')) {
          try {
            const timestamp = Date.now();
            const queryString = `timestamp=${timestamp}`;
            const signature = require('crypto')
              .createHmac('sha256', process.env.BINANCE_SECRET_KEY)
              .update(queryString)
              .digest('hex');
            
            const authUrl = `${endpoint.url}/api/v3/account?${queryString}&signature=${signature}`;
            const authResponse = await fetch(authUrl, {
              headers: {
                'X-MBX-APIKEY': process.env.BINANCE_API_KEY!,
                'Content-Type': 'application/json'
              },
              signal: AbortSignal.timeout(5000)
            });
            
            authStatus = authResponse.ok ? 'AUTH_OK ✅' : `AUTH_FAILED (${authResponse.status})`;
          } catch (authError) {
            authStatus = 'AUTH_ERROR';
          }
        }
        
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'WORKING ✅',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          accessible: true,
          authStatus
        });
        console.log(`✅ ${endpoint.name} is accessible (${responseTime}ms) - Auth: ${authStatus}`);
      } else {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: `FAILED ❌ (${response.status})`,
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          accessible: false,
          error: response.statusText,
          authStatus: 'N/A'
        });
        console.log(`❌ ${endpoint.name} failed with status ${response.status}`);
      }
    } catch (error) {
      results.push({
        name: endpoint.name,
        url: endpoint.url,
        status: 'ERROR ❌',
        responseTime: 'Timeout/Error',
        statusCode: 0,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        authStatus: 'N/A'
      });
      console.log(`❌ ${endpoint.name} error:`, error);
    }
  }
  
  const workingEndpoints = results.filter(r => r.accessible);
  const productionEndpoints = workingEndpoints.filter(r => r.authStatus === 'AUTH_OK ✅');
  const blockedEndpoints = results.filter(r => !r.accessible);
  
  return NextResponse.json({
    success: true,
    message: 'Binance endpoint connectivity test completed',
    summary: {
      total: results.length,
      working: workingEndpoints.length,
      productionReady: productionEndpoints.length,
      blocked: blockedEndpoints.length,
      location: 'Turkey/Vercel Servers'
    },
    workingEndpoints,
    productionEndpoints,
    blockedEndpoints,
    results,
    recommendations: productionEndpoints.length > 0 ? [
      `🎉 Found ${productionEndpoints.length} production-ready endpoint(s)!`,
      'Your Binance API will work with real trading data',
      'The system will automatically use the fastest working endpoint',
      'You can now use crypto deposits and real-time data'
    ] : workingEndpoints.length > 0 ? [
      `⚠️ Found ${workingEndpoints.length} working endpoint(s) but authentication failed`,
      'Check your Binance API credentials in Vercel environment variables',
      'Ensure API keys have proper permissions (Enable Reading)',
      'Some endpoints may be testnet-only'
    ] : [
      '❌ All Binance endpoints are blocked from your location',
      '🌐 Use VPN service (NordVPN, ExpressVPN, etc.)',
      '🔧 Or set up a proxy server in an allowed region',
      '📧 Contact Binance support about geographic restrictions'
    ],
    vpnSuggestions: productionEndpoints.length === 0 ? {
      immediate: [
        'Use a VPN with servers in: Singapore, Japan, UK, Germany',
        'Recommended VPN services: NordVPN, ExpressVPN, Surfshark',
        'Connect to a server outside restricted regions',
        'Test again after connecting to VPN'
      ],
      technical: [
        'Set up a proxy server on a VPS (DigitalOcean, AWS, etc.)',
        'Use proxy environment variables in Vercel',
        'Route Binance API calls through the proxy',
        'Consider using Cloudflare Workers as proxy'
      ]
    } : null,
    nextSteps: productionEndpoints.length > 0 ? [
      '✅ Your Binance integration is ready to use!',
      'Test crypto deposits and withdrawals',
      'Monitor API rate limits and usage',
      'Set up deposit monitoring automation'
    ] : [
      '🔧 Fix API credentials or use VPN',
      'Check Vercel environment variables',
      'Test with VPN from allowed region',
      'Consider manual deposit system as backup'
    ]
  });
} 