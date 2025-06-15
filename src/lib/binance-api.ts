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

export class BinanceAPI {
  private baseUrl = 'https://api.binance.com';

  // Get config dynamically to ensure environment variables are loaded
  private getConfig(): BinanceConfig {
    return {
      apiKey: process.env.BINANCE_API_KEY || '',
      secretKey: process.env.BINANCE_SECRET_KEY || '',
      baseUrl: this.baseUrl
    };
  }

  private createSignature(queryString: string, secretKey: string): string {
    return crypto
      .createHmac('sha256', secretKey)
      .update(queryString)
      .digest('hex');
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const config = this.getConfig();
    
    // Check if credentials are available
    if (!config.apiKey || !config.secretKey) {
      throw new Error('Binance API credentials not configured');
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

  // Validate API credentials with detailed debugging
  async validateCredentials(): Promise<boolean> {
    try {
      const config = this.getConfig();
      
      // Enhanced debugging for production
      console.log('🔍 Binance API Validation Debug:');
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

      console.log('🚀 Making test request to Binance API...');
      
      // Create test request manually for better debugging
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = this.createSignature(queryString, config.secretKey);
      const url = `${config.baseUrl}/api/v3/account?${queryString}&signature=${signature}`;
      
      console.log('- Request URL:', config.baseUrl + '/api/v3/account');
      console.log('- Timestamp:', timestamp);
      console.log('- Signature length:', signature.length);
      
      const response = await fetch(url, {
        headers: {
          'X-MBX-APIKEY': config.apiKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('- Response status:', response.status);
      console.log('- Response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        const data = await response.json();
        console.log('✅ Binance API credentials validation successful');
        console.log('- Account type:', data.accountType);
        console.log('- Can trade:', data.canTrade);
        console.log('- Permissions:', data.permissions);
        return true;
      } else {
        const errorText = await response.text();
        console.error('❌ Binance API validation failed');
        console.error('- Status:', response.status);
        console.error('- Error:', errorText);
        
        try {
          const errorData = JSON.parse(errorText);
          console.error('- Error code:', errorData.code);
          console.error('- Error message:', errorData.msg);
        } catch (e) {
          console.error('- Could not parse error response');
        }
        
        return false;
      }
    } catch (error) {
      console.error('❌ Binance API credentials validation failed with exception:', error);
      return false;
    }
  }
}

// Singleton instance
export const binanceAPI = new BinanceAPI(); 