import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PriceData {
  platform: string;
  price: number;
  currency: string;
  timestamp: Date;
  volume?: number;
  wear?: string;
}

interface PriceSource {
  name: string;
  priority: number;
  rateLimit: number;
  lastRequest: number;
  isEnabled: boolean;
  apiKey?: string;
}

export class PriceServiceManager {
  private static instance: PriceServiceManager;
  private priceSources: Map<string, PriceSource>;
  private priceCache: Map<string, { price: number; timestamp: Date; sources: string[] }>;
  private updateInterval: number;
  private isRunning: boolean = false;

  constructor() {
    this.priceSources = new Map();
    this.priceCache = new Map();
    this.updateInterval = parseInt(process.env.PRICE_UPDATE_INTERVAL || '30000');
    this.initializePriceSources();
  }

  static getInstance(): PriceServiceManager {
    if (!PriceServiceManager.instance) {
      PriceServiceManager.instance = new PriceServiceManager();
    }
    return PriceServiceManager.instance;
  }

  private initializePriceSources(): void {
    // Initialize all price sources based on environment configuration
    this.priceSources.set('steam', {
      name: 'Steam Market',
      priority: 3,
      rateLimit: parseInt(process.env.STEAM_RATE_LIMIT || '60'),
      lastRequest: 0,
      isEnabled: process.env.ENABLE_STEAM_PRICES === 'true',
      apiKey: process.env.STEAM_API_KEY
    });

    this.priceSources.set('csfloat', {
      name: 'CSFloat',
      priority: 1, // Highest priority
      rateLimit: parseInt(process.env.CSFLOAT_RATE_LIMIT || '100'),
      lastRequest: 0,
      isEnabled: process.env.ENABLE_CSFLOAT_PRICES === 'true',
      apiKey: process.env.CSFLOAT_API_KEY
    });

    this.priceSources.set('skinport', {
      name: 'SkinPort',
      priority: 2,
      rateLimit: parseInt(process.env.SKINPORT_RATE_LIMIT || '100'),
      lastRequest: 0,
      isEnabled: process.env.ENABLE_SKINPORT_PRICES === 'true',
      apiKey: process.env.SKINPORT_API_KEY
    });

    this.priceSources.set('bitskins', {
      name: 'BitSkins',
      priority: 4,
      rateLimit: parseInt(process.env.BITSKINS_RATE_LIMIT || '120'),
      lastRequest: 0,
      isEnabled: process.env.ENABLE_BITSKINS_PRICES === 'true',
      apiKey: process.env.BITSKINS_API_KEY
    });

    console.log('🔧 Initialized price sources:', Array.from(this.priceSources.keys()));
  }

  /**
   * Start the price update service
   */
  public startPriceUpdates(): void {
    if (this.isRunning) {
      console.log('⚠️ Price update service is already running');
      return;
    }

    this.isRunning = true;
    console.log(`🚀 Starting price updates every ${this.updateInterval / 1000} seconds`);

    // Initial update
    this.updateAllPrices();

    // Set up recurring updates
    setInterval(() => {
      this.updateAllPrices();
    }, this.updateInterval);
  }

  /**
   * Stop the price update service
   */
  public stopPriceUpdates(): void {
    this.isRunning = false;
    console.log('🛑 Price update service stopped');
  }

  /**
   * Update prices for all skins from all enabled sources
   */
  private async updateAllPrices(): Promise<void> {
    try {
      console.log('🔄 Starting price update cycle...');
      
      // Get all skins from database
      const skins = await prisma.skin.findMany({
        select: { id: true, name: true, wear: true }
      });

      console.log(`📊 Updating prices for ${skins.length} skins`);

      // Update prices for each skin
      for (const skin of skins) {
        await this.updateSkinPrice(skin.id, skin.name, skin.wear);
        // Small delay to respect rate limits
        await this.delay(100);
      }

      console.log('✅ Price update cycle completed');
    } catch (error) {
      console.error('❌ Error in price update cycle:', error);
    }
  }

  /**
   * Update price for a specific skin from all sources
   */
  private async updateSkinPrice(skinId: string, skinName: string, wear: string): Promise<void> {
    const priceData: PriceData[] = [];
    const sources: string[] = [];

    // Try each enabled price source in priority order
    const sortedSources = Array.from(this.priceSources.entries())
      .filter(([_, source]) => source.isEnabled && source.apiKey)
      .sort(([_, a], [__, b]) => a.priority - b.priority);

    for (const [sourceName, source] of sortedSources) {
      try {
        // Check rate limiting
        if (!this.canMakeRequest(sourceName)) {
          continue;
        }

        const price = await this.fetchPriceFromSource(sourceName, skinName, wear);
        if (price) {
          priceData.push(price);
          sources.push(sourceName);
          this.updateRateLimit(sourceName);
        }
      } catch (error) {
        console.error(`❌ Error fetching from ${sourceName}:`, error);
      }
    }

    // Calculate aggregated price
    if (priceData.length > 0) {
      const aggregatedPrice = this.aggregatePrices(priceData);
      await this.updateDatabasePrice(skinId, aggregatedPrice);
      
      // Update cache
      this.priceCache.set(skinId, {
        price: aggregatedPrice,
        timestamp: new Date(),
        sources
      });

      if (process.env.DEBUG_PRICE_SERVICE === 'true') {
        console.log(`💰 ${skinName}: $${aggregatedPrice.toFixed(2)} (from ${sources.join(', ')})`);
      }
    }
  }

  /**
   * Fetch price from a specific source
   */
  private async fetchPriceFromSource(source: string, skinName: string, wear: string): Promise<PriceData | null> {
    switch (source) {
      case 'steam':
        return this.fetchSteamPrice(skinName, wear);
      case 'csfloat':
        return this.fetchCSFloatPrice(skinName, wear);
      case 'skinport':
        return this.fetchSkinPortPrice(skinName, wear);
      case 'bitskins':
        return this.fetchBitSkinsPrice(skinName, wear);
      default:
        return null;
    }
  }

  /**
   * Fetch price from Steam Market API
   */
  private async fetchSteamPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      const marketHashName = `${skinName} (${wear})`;
      const encodedName = encodeURIComponent(marketHashName);
      
      const response = await fetch(
        `https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodedName}`,
        {
          headers: {
            'User-Agent': 'CS2-Derivatives-Platform/1.0',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.success && data.median_price) {
        const priceStr = data.median_price.replace(/[^0-9.,]/g, '').replace(',', '.');
        const price = parseFloat(priceStr);
        
        if (!isNaN(price)) {
          return {
            platform: 'Steam Market',
            price: Math.round(price * 100) / 100,
            currency: 'USD',
            timestamp: new Date(),
            volume: parseInt(data.volume) || 0,
            wear
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Steam API error:', error);
      return null;
    }
  }

  /**
   * Fetch price from CSFloat API
   */
  private async fetchCSFloatPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      const apiKey = this.priceSources.get('csfloat')?.apiKey;
      if (!apiKey || apiKey === 'your_csfloat_api_key_here') return null;

      const encodedName = encodeURIComponent(skinName);
      const wearParam = this.getCSFloatWearParam(wear);
      
      const response = await fetch(
        `https://csfloat.com/api/v1/market/search?name=${encodedName}&wear=${wearParam}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'User-Agent': 'CS2-Derivatives-Platform/1.0',
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const prices = data.items.map((item: any) => parseFloat(item.price));
        const averagePrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
        
        return {
          platform: 'CSFloat',
          price: Math.round(averagePrice * 100) / 100,
          currency: 'USD',
          timestamp: new Date(),
          volume: data.items.length,
          wear
        };
      }
      
      return null;
    } catch (error) {
      console.error('CSFloat API error:', error);
      return null;
    }
  }

  /**
   * Fetch price from SkinPort API
   */
  private async fetchSkinPortPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      const apiKey = this.priceSources.get('skinport')?.apiKey;
      const searchName = `${skinName} (${wear})`;
      const encodedName = encodeURIComponent(searchName);
      
      const url = apiKey && apiKey !== 'your_skinport_api_key_here'
        ? `https://api.skinport.com/v1/items?market_hash_name=${encodedName}&api_key=${apiKey}`
        : `https://api.skinport.com/v1/items?market_hash_name=${encodedName}`;
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'CS2-Derivatives-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) return null;

      const data = await response.json();
      
      if (data && data.length > 0) {
        const item = data[0];
        const price = parseFloat(item.min_price || item.suggested_price || 0);
        
        if (price > 0) {
          return {
            platform: 'SkinPort',
            price: Math.round(price * 100) / 100,
            currency: 'USD',
            timestamp: new Date(),
            volume: parseInt(item.quantity) || 0,
            wear
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('SkinPort API error:', error);
      return null;
    }
  }

  /**
   * Fetch price from BitSkins API
   */
  private async fetchBitSkinsPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      const apiKey = this.priceSources.get('bitskins')?.apiKey;
      if (!apiKey || apiKey === 'your_bitskins_api_key_here') return null;

      // BitSkins API implementation would go here
      // For now, return null as it requires more complex authentication
      return null;
    } catch (error) {
      console.error('BitSkins API error:', error);
      return null;
    }
  }

  /**
   * Aggregate prices from multiple sources
   */
  private aggregatePrices(priceData: PriceData[]): number {
    if (priceData.length === 0) return 0;
    if (priceData.length === 1) return priceData[0].price;

    // Use weighted average based on source priority and volume
    let totalWeight = 0;
    let weightedSum = 0;

    for (const data of priceData) {
      // Higher priority sources get more weight
      const sourcePriority = this.getSourcePriority(data.platform);
      const volumeWeight = Math.min((data.volume || 1) / 10, 5); // Cap volume weight
      const weight = (6 - sourcePriority) * (1 + volumeWeight);
      
      weightedSum += data.price * weight;
      totalWeight += weight;
    }

    return Math.round((weightedSum / totalWeight) * 100) / 100;
  }

  /**
   * Get priority for a source platform
   */
  private getSourcePriority(platform: string): number {
    switch (platform.toLowerCase()) {
      case 'csfloat': return 1;
      case 'skinport': return 2;
      case 'steam market': return 3;
      case 'bitskins': return 4;
      default: return 5;
    }
  }

  /**
   * Update skin price in database
   */
  private async updateDatabasePrice(skinId: string, price: number): Promise<void> {
    try {
      await prisma.skin.update({
        where: { id: skinId },
        data: { 
          price,
          updatedAt: new Date()
        }
      });
    } catch (error) {
      console.error('Database update error:', error);
    }
  }

  /**
   * Check if we can make a request to a source (rate limiting)
   */
  private canMakeRequest(sourceName: string): boolean {
    const source = this.priceSources.get(sourceName);
    if (!source) return false;

    const now = Date.now();
    const timeSinceLastRequest = now - source.lastRequest;
    const minInterval = (60 * 1000) / source.rateLimit; // Convert rate limit to interval

    return timeSinceLastRequest >= minInterval;
  }

  /**
   * Update rate limiting timestamp
   */
  private updateRateLimit(sourceName: string): void {
    const source = this.priceSources.get(sourceName);
    if (source) {
      source.lastRequest = Date.now();
    }
  }

  /**
   * Convert wear to CSFloat API parameter
   */
  private getCSFloatWearParam(wear: string): string {
    switch (wear.toLowerCase()) {
      case 'factory new': return 'fn';
      case 'minimal wear': return 'mw';
      case 'field-tested': return 'ft';
      case 'well-worn': return 'ww';
      case 'battle-scarred': return 'bs';
      default: return 'ft';
    }
  }

  /**
   * Utility delay function
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get current price for a skin (from cache or database)
   */
  public async getCurrentPrice(skinId: string): Promise<number | null> {
    // Check cache first
    const cached = this.priceCache.get(skinId);
    if (cached && Date.now() - cached.timestamp.getTime() < this.updateInterval) {
      return cached.price;
    }

    // Fallback to database
    try {
      const skin = await prisma.skin.findUnique({
        where: { id: skinId },
        select: { price: true }
      });
      return skin?.price || null;
    } catch (error) {
      console.error('Error fetching price from database:', error);
      return null;
    }
  }

  /**
   * Get status of all price sources
   */
  public getSourcesStatus(): any {
    const status: any = {};
    
    // Fix TypeScript iterator issue by using Array.from()
    const sourceEntries = Array.from(this.priceSources.entries());
    
    for (const [name, source] of sourceEntries) {
      status[name] = {
        enabled: source.isEnabled,
        hasApiKey: source.apiKey && source.apiKey !== `your_${name}_api_key_here`,
        lastRequest: new Date(source.lastRequest),
        rateLimit: source.rateLimit,
        priority: source.priority
      };
    }
    
    return status;
  }
} 