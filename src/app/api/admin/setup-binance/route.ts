import { NextResponse } from 'next/server';
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

export async function GET() {
  return NextResponse.json({
    message: 'Binance API Setup Endpoint',
    instructions: {
      step1: 'Set BINANCE_API_KEY and BINANCE_SECRET_KEY in your environment variables',
      step2: 'POST to this endpoint with action: "test-credentials" to validate',
      step3: 'Use action: "get-deposit-addresses" to get your deposit addresses',
      step4: 'Use action: "get-balances" to check wallet balances',
      step5: 'Use action: "test-deposits" to see recent deposit history'
    },
    availableActions: ['test-credentials', 'get-deposit-addresses', 'get-balances', 'test-deposits']
  });
} 