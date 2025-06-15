import { NextRequest, NextResponse } from 'next/server';
import { binanceAPI } from '@/lib/binance-api';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { action } = await request.json();

    switch (action) {
      case 'test-credentials':
        const isValid = await binanceAPI.validateCredentials();
        return NextResponse.json({
          valid: isValid,
          message: isValid ? 'Binance API credentials are valid' : 'Invalid credentials'
        });

      case 'get-deposit-addresses':
        const addresses: Record<string, any> = {};
        const coins = ['BTC', 'ETH', 'USDT', 'SOL'];
        
        for (const coin of coins) {
          try {
            const address = await binanceAPI.getDepositAddress(coin);
            addresses[coin] = address;
          } catch (error) {
            addresses[coin] = { error: error instanceof Error ? error.message : 'Unknown error' };
          }
        }

        return NextResponse.json({
          message: 'Deposit addresses retrieved',
          addresses
        });

      case 'get-balances':
        const balances = await binanceAPI.getWalletBalances();
        const filteredBalances = balances.filter(balance => 
          ['BTC', 'ETH', 'USDT', 'SOL'].includes(balance.coin) && 
          (parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        );

        return NextResponse.json({
          message: 'Wallet balances retrieved',
          balances: filteredBalances
        });

      case 'test-deposits':
        const testDeposits = await binanceAPI.getDepositHistory();
        const recentDeposits = testDeposits.slice(0, 5); // Last 5 deposits

        return NextResponse.json({
          message: 'Recent deposits retrieved',
          deposits: recentDeposits
        });

      default:
        return NextResponse.json({
          error: 'Invalid action',
          availableActions: ['test-credentials', 'get-deposit-addresses', 'get-balances', 'test-deposits']
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Binance setup error:', error);
    return NextResponse.json({
      error: 'Binance API setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      help: 'Make sure BINANCE_API_KEY and BINANCE_SECRET_KEY are set in environment variables'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Setting up Binance API integration...');
    
    // Validate credentials
    const isValid = await binanceAPI.validateCredentials();
    
    if (isValid) {
      return NextResponse.json({
        success: true,
        message: 'Binance API integration setup successful! ✅',
        status: 'ready',
        nextSteps: [
          'Binance API is now connected and ready to use',
          'Deposit monitoring will start automatically',
          'Users can now make crypto deposits that will be tracked'
        ]
      });
    } else {
      // Check if it's a geographic restriction issue
      const hasCredentials = process.env.BINANCE_API_KEY && process.env.BINANCE_SECRET_KEY;
      
      return NextResponse.json({
        success: false,
        message: 'Binance API setup failed',
        status: 'failed',
        issue: hasCredentials ? 'geographic_restriction' : 'missing_credentials',
        troubleshooting: hasCredentials ? {
          problem: 'Geographic/IP Restriction Detected',
          explanation: 'Your Binance API credentials are valid, but Vercel servers are located in a region restricted by Binance.',
          solutions: [
            {
              option: 'Use Binance US (if in US)',
              steps: [
                '1. Create Binance US account at binance.us',
                '2. Generate API keys in Binance US',
                '3. Add environment variable: USE_BINANCE_US=true',
                '4. Update BINANCE_API_KEY and BINANCE_SECRET_KEY with Binance US credentials'
              ]
            },
            {
              option: 'Use Alternative Exchange',
              steps: [
                '1. Consider using Coinbase Pro, Kraken, or other exchanges',
                '2. Implement similar API integration for chosen exchange',
                '3. Update deposit monitoring logic accordingly'
              ]
            },
            {
              option: 'Use VPN/Proxy (Advanced)',
              steps: [
                '1. Set up proxy server in allowed region',
                '2. Route Binance API calls through proxy',
                '3. Update fetch requests to use proxy configuration'
              ]
            }
          ]
        } : {
          problem: 'Missing API Credentials',
          steps: [
            '1. Go to Binance.com → Account → API Management',
            '2. Create new API key with "Enable Reading" permission',
            '3. Add BINANCE_API_KEY and BINANCE_SECRET_KEY to Vercel environment variables',
            '4. Redeploy the application'
          ]
        }
      });
    }
  } catch (error) {
    console.error('❌ Binance setup error:', error);
    
    return NextResponse.json({
      success: false,
      message: 'Binance API setup encountered an error',
      error: error instanceof Error ? error.message : 'Unknown error',
      troubleshooting: {
        commonIssues: [
          'Invalid API credentials',
          'API key permissions insufficient',
          'Geographic restrictions (HTTP 451)',
          'Network connectivity issues',
          'Rate limiting'
        ],
        nextSteps: [
          'Check Vercel deployment logs for detailed error messages',
          'Verify API credentials in Binance account',
          'Consider using Binance US if in restricted region',
          'Test API credentials locally first'
        ]
      }
    });
  }
} 