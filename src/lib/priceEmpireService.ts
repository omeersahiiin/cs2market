import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceEmpireConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: number;
  timeout: number;
}

interface PriceEmpireItem {
  market_hash_name: string;
  currency: string;
  suggested_price: number;
  item_page: string;
  market_page: string;
  min_price: number;
  max_price: number;
  mean_price: number;
  quantity: number;
  created_at: number;
  updated_at: number;
}

interface PriceEmpireResponse {
  success: boolean;
  data?: PriceEmpireItem[];
  error?: string;
}

export class PriceEmpireService {
  private static instance: PriceEmpireService;
  private config: PriceEmpireConfig;
  private lastRequest: number = 0;

  constructor() {
    this.config = {
      apiKey: process.env.PRICEMPIRE_API_KEY || '3d5a32f3-2a0c-414e-b98e-17160197f254',
      baseUrl: 'https://pricempire.com/api/v2',
      rateLimit: parseInt(process.env.PRICEMPIRE_RATE_LIMIT || '100'),
      timeout: parseInt(process.env.PRICEMPIRE_TIMEOUT || '10000')
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
   * Get current price for a specific skin using PriceEmpire API
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
      // Format the market hash name as expected by Steam/PriceEmpire
      const marketHashName = `${skinName} (${wear})`;
      
      const response = await this.makeRequest('/items', {
        search: marketHashName,
        currency: 'USD',
        appid: 730 // CS2/CSGO app ID
      });

      if (response.success && response.data && response.data.length > 0) {
        const item = response.data[0];
        this.updateRateLimit();
        
        // Use suggested_price as the primary price, fallback to mean_price
        const price = item.suggested_price || item.mean_price || item.min_price;
        
        console.log(`✅ PriceEmpire: ${marketHashName} = $${price.toFixed(2)}`);
        return price;
      }

      console.warn(`⚠️ PriceEmpire: No data found for ${marketHashName}`);
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

    console.log(`🔄 PriceEmpire: Fetching batch prices for ${skins.length} skins...`);

    // PriceEmpire doesn't have a true batch endpoint, so we'll make individual requests
    // with proper rate limiting
    for (const skin of skins) {
      try {
        const price = await this.getSkinPrice(skin.name, skin.wear);
        if (price && price > 0) {
          const key = `${skin.name}_${skin.wear}`;
          prices.set(key, price);
        }
        
        // Rate limiting: wait between requests
        await this.delay(1000 / (this.config.rateLimit / 60)); // Respect rate limit
      } catch (error) {
        console.error(`Error fetching price for ${skin.name}:`, error);
      }
    }

    console.log(`✅ PriceEmpire: Successfully fetched ${prices.size}/${skins.length} prices`);
    return prices;
  }

  /**
   * Search for items by name
   */
  public async searchItems(query: string, limit: number = 10): Promise<PriceEmpireItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.makeRequest('/items', {
        search: query,
        currency: 'USD',
        limit: limit,
        appid: 730
      });

      if (response.success && response.data) {
        this.updateRateLimit();
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('PriceEmpire search error:', error);
      return [];
    }
  }

  /**
   * Get all CS2 items (for initial database population)
   */
  public async getAllCS2Items(limit: number = 1000): Promise<PriceEmpireItem[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const response = await this.makeRequest('/items', {
        currency: 'USD',
        limit: limit,
        appid: 730 // CS2 items are still under app ID 730
      });

      if (response.success && response.data) {
        this.updateRateLimit();
        console.log(`✅ PriceEmpire: Retrieved ${response.data.length} CS2 items`);
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('PriceEmpire getAllItems error:', error);
      return [];
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

      // Get prices using batch method (with rate limiting)
      const skinRequests = skins.map((skin: any) => ({
        name: skin.name,
        wear: skin.wear
      }));

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
    
    // Add query parameters including API key
    url.searchParams.append('token', this.config.apiKey);
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.append(key, params[key].toString());
      }
    });

    console.log(`🌐 PriceEmpire API Request: ${url.toString().replace(this.config.apiKey, 'API_KEY_HIDDEN')}`);

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'User-Agent': 'CS2-Derivatives-Platform/1.0',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(this.config.timeout)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`PriceEmpire API error: ${response.status} ${response.statusText}`, errorText);
      throw new Error(`PriceEmpire API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      return {
        success: true,
        data: data
      };
    } else if (data.success !== undefined) {
      return data;
    } else {
      return {
        success: true,
        data: [data]
      };
    }
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
      apiKey: this.config.apiKey ? `${this.config.apiKey.slice(0, 8)}...` : 'NOT SET',
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
      console.log('🧪 Testing PriceEmpire API connection...');
      
      // Test with a simple API call first
      const response = await this.makeRequest('/items', {
        search: 'AK-47',
        currency: 'USD',
        limit: 1,
        appid: 730
      });
      
      const isWorking = Boolean(response.success === true && response.data && response.data.length > 0);
      
      if (isWorking) {
        console.log(`✅ PriceEmpire API connection successful! Found ${response.data?.length || 0} items`);
      } else {
        console.log('❌ PriceEmpire API connection failed - no data returned');
      }
      
      return isWorking;
    } catch (error) {
      console.error('❌ PriceEmpire connection test failed:', error);
      return false;
    }
  }
} 