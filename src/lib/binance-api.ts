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
  private config: BinanceConfig;

  constructor() {
    this.config = {
      apiKey: process.env.BINANCE_API_KEY || '',
      secretKey: process.env.BINANCE_SECRET_KEY || '',
      baseUrl: 'https://api.binance.com'
    };
  }

  private createSignature(queryString: string): string {
    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(queryString)
      .digest('hex');
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    const timestamp = Date.now();
    const queryParams = new URLSearchParams({
      ...params,
      timestamp: timestamp.toString()
    });

    const signature = this.createSignature(queryParams.toString());
    queryParams.append('signature', signature);

    const url = `${this.config.baseUrl}${endpoint}?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'X-MBX-APIKEY': this.config.apiKey,
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
      await this.makeRequest('/api/v3/account');
      return true;
    } catch (error) {
      console.error('Binance API credentials validation failed:', error);
      return false;
    }
  }
}

// Singleton instance
export const binanceAPI = new BinanceAPI(); 