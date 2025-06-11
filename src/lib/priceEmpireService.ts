import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceEmpireConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  timeout: number;
}

interface PriceEmpireResponse {
  success: boolean;
  data: {
    name: string;
    price: number;
    currency: string;
    timestamp: string;
    sources: string[];
    volume?: number;
    change24h?: number;
    history?: Array<{date: string, price: number}>;
  };
  error?: string;
}

export class PriceEmpireService {
  private static instance: PriceEmpireService;
  private config: PriceEmpireConfig;
  private lastRequest: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.PRICEMPIRE_API_KEY || '',
      baseUrl: process.env.PRICEMPIRE_API_URL || 'https://api.pricempire.com/v1',
      rateLimit: parseInt(process.env.PRICEMPIRE_RATE_LIMIT || '100'),
      timeout: parseInt(process.env.PRICEMPIRE_TIMEOUT || '5000')
    };
  }

  static getInstance(): PriceEmpireService {
    if (!PriceEmpireService.instance) {
      PriceEmpireService.instance = new PriceEmpireService();
    }
    return PriceEmpireService.instance;
  }

  /**
   * Check if PriceEmpire API is configured and available
   */
  public isConfigured(): boolean {
    return !!(
      this.config.apiKey && 
      this.config.apiKey !== 'your_pricempire_api_key_here' &&
      this.config.baseUrl
    );
  }

  /**
   * Get current price for a specific skin
   */
  public async getSkinPrice(skinName: string, wear: string = 'Field-Tested'): Promise<number | null> {
    if (!this.isConfigured()) {
      console.warn('PriceEmpire API not configured');
      return null;
    }

    if (!this.canMakeRequest()) {
      console.warn('PriceEmpire rate limit exceeded');
      return null;
    }

    try {
      const response = await this.makeRequest(`/skins/price`, {
        name: skinName,
        wear: wear,
        format: 'json'
      });

      if (response.success && response.data) {
        this.updateRateLimit();
        return response.data.price;
      }

      return null;
    } catch (error) {
      console.error('PriceEmpire API error:', error);
      return null;
    }
  }

  /**
   * Get prices for multiple skins (batch request)
   */
  public async getBatchPrices(skins: Array<{name: string, wear: string}>): Promise<Map<string, number>> {
    const prices = new Map<string, number>();

    if (!this.isConfigured()) {
      console.warn('PriceEmpire API not configured');
      return prices;
    }

    try {
      // Check if they support batch requests
      const response = await this.makeRequest(`/skins/batch-price`, {
        skins: skins,
        format: 'json'
      });

      if (response.success && Array.isArray(response.data)) {
        for (const item of response.data) {
          const key = `${item.name}_${item.wear}`;
          prices.set(key, item.price);
        }
      }

      this.updateRateLimit();
    } catch (error) {
      console.error('PriceEmpire batch API error:', error);
      
      // Fallback to individual requests if batch fails
      for (const skin of skins) {
        const price = await this.getSkinPrice(skin.name, skin.wear);
        if (price) {
          const key = `${skin.name}_${skin.wear}`;
          prices.set(key, price);
        }
        // Small delay between requests
        await this.delay(100);
      }
    }

    return prices;
  }

  /**
   * Get historical price data for a skin
   */
  public async getHistoricalPrices(
    skinName: string, 
    wear: string, 
    days: number = 30
  ): Promise<Array<{date: string, price: number}> | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await this.makeRequest(`/skins/history`, {
        name: skinName,
        wear: wear,
        days: days,
        format: 'json'
      });

      if (response.success && response.data) {
        this.updateRateLimit();
        return response.data.history || [];
      }

      return null;
    } catch (error) {
      console.error('PriceEmpire history API error:', error);
      return null;
    }
  }

  /**
   * Get market statistics for a skin
   */
  public async getMarketStats(skinName: string, wear: string): Promise<any | null> {
    if (!this.isConfigured()) {
      return null;
    }

    try {
      const response = await this.makeRequest(`/skins/stats`, {
        name: skinName,
        wear: wear,
        format: 'json'
      });

      if (response.success && response.data) {
        this.updateRateLimit();
        return {
          price: response.data.price,
          volume24h: response.data.volume,
          change24h: response.data.change24h,
          sources: response.data.sources,
          lastUpdated: response.data.timestamp
        };
      }

      return null;
    } catch (error) {
      console.error('PriceEmpire stats API error:', error);
      return null;
    }
  }

  /**
   * Update all skin prices in database using PriceEmpire
   */
  public async updateAllSkinPrices(): Promise<void> {
    if (!this.isConfigured()) {
      console.log('⚠️ PriceEmpire not configured, skipping update');
      return;
    }

    try {
      console.log('🔄 Starting PriceEmpire price update...');

      // Get all skins from database
      const skins = await prisma.skin.findMany({
        select: { id: true, name: true, wear: true }
      });

      console.log(`📊 Updating ${skins.length} skins via PriceEmpire`);

      // Prepare batch request
      const skinRequests = skins.map((skin: any) => ({
        name: skin.name,
        wear: skin.wear
      }));

      // Try batch request first
      const batchPrices = await this.getBatchPrices(skinRequests);

      // Update database with new prices
      let updatedCount = 0;
      for (const skin of skins) {
        const key = `${skin.name}_${skin.wear}`;
        const price = batchPrices.get(key);

        if (price && price > 0) {
          await prisma.skin.update({
            where: { id: skin.id },
            data: { 
              price,
              updatedAt: new Date()
            }
          });
          updatedCount++;

          if (process.env.DEBUG_PRICE_SERVICE === 'true') {
            console.log(`💰 ${skin.name}: $${price.toFixed(2)} (PriceEmpire)`);
          }
        }
      }

      console.log(`✅ PriceEmpire update completed: ${updatedCount}/${skins.length} skins updated`);
    } catch (error) {
      console.error('❌ PriceEmpire update failed:', error);
    }
  }

  /**
   * Make HTTP request to PriceEmpire API
   */
  private async makeRequest(endpoint: string, params: any): Promise<PriceEmpireResponse> {
    const url = new URL(endpoint, this.config.baseUrl);
    
    // Add query parameters
    Object.keys(params).forEach(key => {
      url.searchParams.append(key, params[key]);
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'CS2-Derivatives-Platform/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      throw new Error(`PriceEmpire API error: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Check if we can make a request (rate limiting)
   */
  private canMakeRequest(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    const minInterval = (60 * 1000) / this.config.rateLimit;

    return timeSinceLastRequest >= minInterval;
  }

  /**
   * Update rate limiting timestamp
   */
  private updateRateLimit(): void {
    this.lastRequest = Date.now();
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get service status and configuration
   */
  public getStatus(): any {
    return {
      configured: this.isConfigured(),
      apiKey: this.config.apiKey ? 'SET' : 'NOT SET',
      baseUrl: this.config.baseUrl,
      rateLimit: this.config.rateLimit,
      lastRequest: new Date(this.lastRequest),
      canMakeRequest: this.canMakeRequest()
    };
  }

  /**
   * Test the API connection
   */
  public async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      return false;
    }

    try {
      // Test with a popular skin
      const price = await this.getSkinPrice('AK-47 | Redline', 'Field-Tested');
      return price !== null && price > 0;
    } catch (error) {
      console.error('PriceEmpire connection test failed:', error);
      return false;
    }
  }
} 