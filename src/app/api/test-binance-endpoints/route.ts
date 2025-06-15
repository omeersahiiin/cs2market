import { NextRequest, NextResponse } from 'next/server';

const BINANCE_ENDPOINTS = [
  { name: 'Main', url: 'https://api.binance.com' },
  { name: 'Backup 1', url: 'https://api1.binance.com' },
  { name: 'Backup 2', url: 'https://api2.binance.com' },
  { name: 'Backup 3', url: 'https://api3.binance.com' },
  { name: 'Alternative CC', url: 'https://api.binance.cc' },
  { name: 'Vision', url: 'https://api.binance.vision' },
  { name: 'Testnet', url: 'https://testnet.binance.vision' }
];

export async function GET(request: NextRequest) {
  const results = [];
  
  console.log('🧪 Testing all Binance endpoints from Turkey...');
  
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
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: 'WORKING ✅',
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          accessible: true
        });
        console.log(`✅ ${endpoint.name} is accessible (${responseTime}ms)`);
      } else {
        results.push({
          name: endpoint.name,
          url: endpoint.url,
          status: `FAILED ❌ (${response.status})`,
          responseTime: `${responseTime}ms`,
          statusCode: response.status,
          accessible: false,
          error: response.statusText
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
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.log(`❌ ${endpoint.name} error:`, error);
    }
  }
  
  const workingEndpoints = results.filter(r => r.accessible);
  const blockedEndpoints = results.filter(r => !r.accessible);
  
  return NextResponse.json({
    success: true,
    message: 'Binance endpoint connectivity test completed',
    summary: {
      total: results.length,
      working: workingEndpoints.length,
      blocked: blockedEndpoints.length,
      location: 'Turkey/Vercel Servers'
    },
    workingEndpoints,
    blockedEndpoints,
    results,
    recommendations: workingEndpoints.length > 0 ? [
      `✅ Found ${workingEndpoints.length} working endpoint(s)`,
      'Your Binance API should work with these endpoints',
      'The system will automatically use the fastest working endpoint'
    ] : [
      '❌ All Binance endpoints are blocked from your location',
      '🌐 Consider using a VPN service (NordVPN, ExpressVPN, etc.)',
      '🔧 Or set up a proxy server in an allowed region',
      '📧 Contact Binance support about geographic restrictions'
    ],
    vpnSuggestions: workingEndpoints.length === 0 ? {
      immediate: [
        'Use a VPN with servers in: Singapore, Japan, UK, Germany',
        'Recommended VPN services: NordVPN, ExpressVPN, Surfshark',
        'Connect to a server outside restricted regions'
      ],
      technical: [
        'Set up a proxy server on a VPS (DigitalOcean, AWS, etc.)',
        'Use proxy environment variables in Vercel',
        'Route Binance API calls through the proxy'
      ]
    } : null
  });
} 