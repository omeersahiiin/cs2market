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

  // Validate API credentials
  async validateCredentials(): Promise<boolean> {
    try {
      const config = this.getConfig();
      
      // Check if credentials exist
      if (!config.apiKey || !config.secretKey) {
        console.error('Binance API credentials not found in environment variables');
        return false;
      }

      // Log for debugging (without exposing full credentials)
      console.log('Validating Binance credentials...');
      console.log('API Key length:', config.apiKey.length);
      console.log('Secret Key length:', config.secretKey.length);
      console.log('API Key starts with:', config.apiKey.substring(0, 10) + '...');

      await this.makeRequest('/api/v3/account');
      console.log('✅ Binance API credentials validation successful');
      return true;
    } catch (error) {
      console.error('❌ Binance API credentials validation failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const binanceAPI = new BinanceAPI(); 