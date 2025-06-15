import crypto from 'crypto';

interface BinanceConfig {
  apiKey: string;
  secretKey: string;
  baseUrl: string;
}

interface DepositHistory {
  coin: string;
  amount: string;
  address: string;
  txId: string;
  status: number; // 0: pending, 6: credited, 1: success
  insertTime: number;
  confirmTimes: string;
}

interface WalletBalance {
  coin: string;
  free: string;
  locked: string;
}

// Multiple Binance endpoints to try - prioritizing alternatives that might work from Turkey
const BINANCE_ENDPOINTS = [
  'https://api.binance.vision', // Try production vision first (since testnet worked)
  'https://data-api.binance.vision', // Data API endpoint
  'https://stream.binance.vision', // Stream endpoint
  'https://api.binance.com', // Main (likely blocked but try anyway)
  'https://api1.binance.com', 
  'https://api2.binance.com',
  'https://api3.binance.com',
  'https://api.binance.cc' // Alternative domain
];

export class BinanceAPI {
  private baseUrl = 'https://api.binance.com';
  private workingEndpoint: string | null = null;

  // Get config dynamically to ensure environment variables are loaded
  private getConfig(): BinanceConfig {
    return {
      apiKey: process.env.BINANCE_API_KEY || '',
      secretKey: process.env.BINANCE_SECRET_KEY || '',
      baseUrl: this.workingEndpoint || this.baseUrl
    };
  }

  private createSignature(queryString: string, secretKey: string): string {
    return crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');
  }

  // Test all available Binance endpoints to find a working one
  private async findWorkingEndpoint(): Promise<string | null> {
    const config = this.getConfig();
    
    if (!config.apiKey || !config.secretKey) {
      console.error('❌ Binance API credentials not found');
      return null;
    }

    console.log('🔍 Testing Binance endpoints for Turkey (prioritizing alternatives)...');

    for (const endpoint of BINANCE_ENDPOINTS) {
      try {
        console.log(`🧪 Testing endpoint: ${endpoint}`);
        
        // First test basic connectivity
        const pingResponse = await fetch(`${endpoint}/api/v3/ping`, {
          signal: AbortSignal.timeout(5000)
        });

        if (!pingResponse.ok) {
          console.log(`❌ Ping failed for ${endpoint}: ${pingResponse.status}`);
          continue;
        }

        // If ping works, test with authentication
        const timestamp = Date.now();
        const queryString = `timestamp=${timestamp}`;
        const signature = this.createSignature(queryString, config.secretKey);
        const testUrl = `${endpoint}/api/v3/account?${queryString}&signature=${signature}`;
        
        const response = await fetch(testUrl, {
          headers: {
            'X-MBX-APIKEY': config.apiKey,
            'Content-Type': 'application/json'
          },
          signal: AbortSignal.timeout(10000)
        });

        if (response.ok) {
          console.log(`✅ Found working production endpoint: ${endpoint}`);
          this.workingEndpoint = endpoint;
          this.baseUrl = endpoint;
          return endpoint;
        } else {
          const errorText = await response.text();
          console.log(`❌ Auth failed for ${endpoint}: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.log(`❌ Endpoint ${endpoint} failed:`, error instanceof Error ? error.message : 'Unknown error');
        continue;
      }
    }

    console.error('❌ No working Binance production endpoints found');
    return null;
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const config = this.getConfig();
    
    // Check if credentials are available
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Binance API credentials not configured');
    }

    // If no working endpoint found yet, try to find one
    if (!this.workingEndpoint) {
      const workingUrl = await this.findWorkingEndpoint();
      if (!workingUrl) {
        throw new Error('No accessible Binance endpoints found from your location. Consider using a VPN.');
      }
    }

    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });

    const signature = this.createSignature(queryParams.toString(), config.secretKey);
    queryParams.append('signature', signature);

    const url = `${config.baseUrl}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': config.apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Binance API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  // Get deposit history for a specific coin
  async getDepositHistory(coin?: string, startTime?: number, endTime?: number): Promise<DepositHistory[]> {
    const params: Record<string, any> = {};
    
    if (coin) params.coin = coin;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;

    const response = await this.makeRequest('/sapi/v1/capital/deposit/hisrec', params);
    return response;
  }

  // Get wallet balances
  async getWalletBalances(): Promise<WalletBalance[]> {
    const response = await this.makeRequest('/sapi/v1/capital/config/getall');
    return response.map((item: any) => ({
      coin: item.coin,
      free: item.free,
      locked: item.locked
    }));
  }

  // Get specific coin balance
  async getCoinBalance(coin: string): Promise<WalletBalance | null> {
    const balances = await this.getWalletBalances();
    return balances.find(balance => balance.coin === coin) || null;
  }

  // Get deposit address for a coin
  async getDepositAddress(coin: string, network?: string): Promise<{ address: string; tag?: string }> {
    const params: Record<string, any> = { coin };
    if (network) params.network = network;

    const response = await this.makeRequest('/sapi/v1/capital/deposit/address', params);
    return {
      address: response.address,
      tag: response.tag
    };
  }

  // Check for new deposits since last check
  async checkNewDeposits(lastCheckTime: number, coins: string[] = ['BTC', 'ETH', 'USDT', 'SOL']): Promise<DepositHistory[]> {
    const allDeposits: DepositHistory[] = [];

    for (const coin of coins) {
      try {
        const deposits = await this.getDepositHistory(coin, lastCheckTime);
        allDeposits.push(...deposits);
      } catch (error) {
        console.error(`Error fetching deposits for ${coin}:`, error);
      }
    }

    // Filter for successful deposits only
    return allDeposits.filter(deposit => deposit.status === 1);
  }

  // Enhanced validation with multiple endpoint testing
  async validateCredentials(): Promise<boolean> {
    const config = this.getConfig();
    
    // Enhanced debugging for production
    console.log('🔍 Binance API Validation for Turkey:');
    console.log('- Environment:', process.env.NODE_ENV);
    console.log('- Vercel Environment:', process.env.VERCEL_ENV);
    console.log('- API Key exists:', !!config.apiKey);
    console.log('- Secret Key exists:', !!config.secretKey);
    
    if (config.apiKey) {
      console.log('- API Key length:', config.apiKey.length);
      console.log('- API Key starts with:', config.apiKey.substring(0, 10) + '...');
      console.log('- API Key ends with:', '...' + config.apiKey.substring(config.apiKey.length - 10));
    }
    
    if (config.secretKey) {
      console.log('- Secret Key length:', config.secretKey.length);
      console.log('- Secret Key starts with:', config.secretKey.substring(0, 10) + '...');
      console.log('- Secret Key ends with:', '...' + config.secretKey.substring(config.secretKey.length - 10));
    }

    // Check if credentials exist
    if (!config.apiKey || !config.secretKey) {
      console.error('❌ Binance API credentials not found in environment variables');
      console.log('Available env vars with BINANCE:', Object.keys(process.env).filter(key => key.includes('BINANCE')));
      return false;
    }

    // Check for common issues
    if (config.apiKey.includes('your_') || config.secretKey.includes('your_')) {
      console.error('❌ Binance API credentials still contain placeholder values');
      return false;
    }

    // Try to find a working endpoint
    const workingEndpoint = await this.findWorkingEndpoint();
    
    if (workingEndpoint) {
      console.log('✅ Binance API validation successful using:', workingEndpoint);
      return true;
    } else {
      console.error('❌ All Binance endpoints are blocked from your location');
      console.log('💡 Recommendations:');
      console.log('   1. Use VPN (NordVPN, ExpressVPN) with Singapore/Japan server');
      console.log('   2. Set up proxy server in allowed region');
      console.log('   3. Use manual deposit system as fallback');
      return false;
    }
  }
}

// Singleton instance
export const binanceAPI = new BinanceAPI(); 