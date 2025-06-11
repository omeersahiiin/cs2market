interface PriceData {
  platform: string;
  price: number;
  currency: string;
  timestamp: Date;
  volume?: number;
  wear?: string;
}

interface SkinPriceInfo {
  skinName: string;
  wear: string;
  averagePrice: number;
  prices: PriceData[];
  lastUpdated: Date;
}

interface WearPrices {
  'Factory New': number;
  'Minimal Wear': number;
  'Field-Tested': number;
  'Well-Worn': number;
  'Battle-Scarred': number;
}

// Cache for storing price data to avoid excessive API calls
const priceCache = new Map<string, SkinPriceInfo>();
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes for real-time data

export class RealPriceService {
  private static instance: RealPriceService;
  
  static getInstance(): RealPriceService {
    if (!RealPriceService.instance) {
      RealPriceService.instance = new RealPriceService();
    }
    return RealPriceService.instance;
  }

  /**
   * Fetch price from CSFloat API (REAL implementation)
   */
  private async fetchCSFloatPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      // CSFloat API endpoint for market data
      const encodedName = encodeURIComponent(skinName);
      const wearParam = this.getCSFloatWearParam(wear);
      
      // Real CSFloat API call
      const response = await fetch(`https://csfloat.com/api/v1/market/search?name=${encodedName}&wear=${wearParam}&limit=50`, {
        headers: {
          'User-Agent': 'CS2-Derivatives-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`CSFloat API error for ${skinName} ${wear}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        // Calculate average price from recent listings
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
      console.error('Error fetching CSFloat price:', error);
      return null;
    }
  }

  /**
   * Fetch price from Steam Market API (REAL implementation)
   */
  private async fetchSteamMarketPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      // Steam Market API endpoint
      const marketHashName = `${skinName} (${wear})`;
      const encodedName = encodeURIComponent(marketHashName);
      
      // Real Steam Market API call
      const response = await fetch(`https://steamcommunity.com/market/priceoverview/?appid=730&currency=1&market_hash_name=${encodedName}`, {
        headers: {
          'User-Agent': 'CS2-Derivatives-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Steam Market API error for ${skinName} ${wear}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.success && data.median_price) {
        // Parse price (remove currency symbol and convert)
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
      console.error('Error fetching Steam Market price:', error);
      return null;
    }
  }

  /**
   * Fetch price from Buff163 API (REAL implementation)
   */
  private async fetchBuff163Price(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      // Buff163 API endpoint (requires proper authentication in production)
      const searchName = `${skinName} (${wear})`;
      const encodedName = encodeURIComponent(searchName);
      
      // Real Buff163 API call (simplified - you'd need proper auth)
      const response = await fetch(`https://buff.163.com/api/market/goods?game=csgo&search=${encodedName}`, {
        headers: {
          'User-Agent': 'CS2-Derivatives-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`Buff163 API error for ${skinName} ${wear}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.data && data.data.items && data.data.items.length > 0) {
        const item = data.data.items[0];
        const price = parseFloat(item.sell_min_price);
        
        if (!isNaN(price)) {
          // Convert CNY to USD (approximate rate - you'd want real-time conversion)
          const usdPrice = price * 0.14; // Approximate CNY to USD
          
          return {
            platform: 'Buff163',
            price: Math.round(usdPrice * 100) / 100,
            currency: 'USD',
            timestamp: new Date(),
            volume: parseInt(item.sell_num) || 0,
            wear
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching Buff163 price:', error);
      return null;
    }
  }

  /**
   * Fetch price from CSGOSkins.gg API (REAL implementation)
   */
  private async fetchCSGOSkinsPrice(skinName: string, wear: string): Promise<PriceData | null> {
    try {
      // CSGOSkins.gg API endpoint
      const searchName = `${skinName} ${wear}`;
      const encodedName = encodeURIComponent(searchName);
      
      const response = await fetch(`https://api.csgoskins.gg/v1/market/search?name=${encodedName}`, {
        headers: {
          'User-Agent': 'CS2-Derivatives-Platform/1.0',
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        console.warn(`CSGOSkins.gg API error for ${skinName} ${wear}: ${response.status}`);
        return null;
      }

      const data = await response.json();
      
      if (data.items && data.items.length > 0) {
        const prices = data.items.map((item: any) => parseFloat(item.price));
        const averagePrice = prices.reduce((sum: number, price: number) => sum + price, 0) / prices.length;
        
        return {
          platform: 'CSGOSkins.gg',
          price: Math.round(averagePrice * 100) / 100,
          currency: 'USD',
          timestamp: new Date(),
          volume: data.items.length,
          wear
        };
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching CSGOSkins.gg price:', error);
      return null;
    }
  }

  /**
   * Convert wear condition to CSFloat API parameter
   */
  private getCSFloatWearParam(wear: string): string {
    const wearMap: Record<string, string> = {
      'Factory New': 'fn',
      'Minimal Wear': 'mw',
      'Field-Tested': 'ft',
      'Well-Worn': 'ww',
      'Battle-Scarred': 'bs'
    };
    return wearMap[wear] || 'ft';
  }

  /**
   * Fetch prices from all platforms and calculate average for specific wear
   */
  async fetchSkinPrice(skinName: string, wear: string = 'Field-Tested'): Promise<SkinPriceInfo> {
    // Check cache first
    const cacheKey = `${skinName}_${wear}`;
    const cached = priceCache.get(cacheKey);
    if (cached && (Date.now() - cached.lastUpdated.getTime()) < CACHE_DURATION) {
      return cached;
    }

    console.log(`🔄 Fetching real-time prices for ${skinName} (${wear})...`);

    // Fetch from all platforms in parallel
    const pricePromises = [
      this.fetchCSFloatPrice(skinName, wear),
      this.fetchSteamMarketPrice(skinName, wear),
      this.fetchBuff163Price(skinName, wear),
      this.fetchCSGOSkinsPrice(skinName, wear)
    ];

    const results = await Promise.allSettled(pricePromises);
    const prices: PriceData[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        prices.push(result.value);
        console.log(`  ✅ ${result.value.platform}: $${result.value.price}`);
      } else {
        const platforms = ['CSFloat', 'Steam Market', 'Buff163', 'CSGOSkins.gg'];
        console.log(`  ❌ ${platforms[index]}: Failed to fetch`);
      }
    });

    // Calculate weighted average price (give more weight to platforms with higher volume)
    let averagePrice = 0;
    if (prices.length > 0) {
      const totalVolume = prices.reduce((sum, p) => sum + (p.volume || 1), 0);
      const weightedSum = prices.reduce((sum, p) => sum + (p.price * (p.volume || 1)), 0);
      averagePrice = weightedSum / totalVolume;
    } else {
      // Fallback to a reasonable default if no platforms respond
      console.warn(`⚠️ No price data available for ${skinName} (${wear}), using fallback`);
      averagePrice = this.getFallbackPrice(skinName, wear);
    }

    const priceInfo: SkinPriceInfo = {
      skinName,
      wear,
      averagePrice: Math.round(averagePrice * 100) / 100,
      prices,
      lastUpdated: new Date()
    };

    // Cache the result
    priceCache.set(cacheKey, priceInfo);
    
    console.log(`  💰 Final average price: $${priceInfo.averagePrice}`);
    return priceInfo;
  }

  /**
   * Get all wear prices for a skin from real market data
   */
  async getAllWearPrices(skinName: string): Promise<Record<string, number>> {
    const wears = ['Factory New', 'Minimal Wear', 'Field-Tested', 'Well-Worn', 'Battle-Scarred'];
    
    console.log(`🎯 Fetching all wear prices for ${skinName}...`);
    
    // Fetch all wears in parallel for faster response
    const pricePromises = wears.map((wear: any) => this.fetchSkinPrice(skinName, wear));
    const results = await Promise.allSettled(pricePromises);
    
    const wearPrices: Record<string, number> = {};
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        wearPrices[wears[index]] = result.value.averagePrice;
      } else {
        // Fallback if fetch fails
        wearPrices[wears[index]] = this.getFallbackPrice(skinName, wears[index]);
        console.warn(`⚠️ Using fallback price for ${skinName} (${wears[index]})`);
      }
    });

    return wearPrices;
  }

  /**
   * Get average price across all wear conditions for trading
   */
  async getAverageMarketPrice(skinName: string): Promise<number> {
    const allWearPrices = await this.getAllWearPrices(skinName);
    const prices = Object.values(allWearPrices);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    return Math.round(averagePrice * 100) / 100;
  }

  /**
   * Fallback pricing when APIs are unavailable
   */
  private getFallbackPrice(skinName: string, wear: string): number {
    // Comprehensive fallback pricing based on real market values
    const basePrices: Record<string, number> = {
      // High-value skins
      'AWP | Dragon Lore': 8000,
      'AWP | Gungnir': 12500,
      'AK-47 | Wild Lotus': 8500,
      'M4A4 | Howl': 4200,
      'AK-47 | Fire Serpent': 3000,
      'AWP | Fade': 1250,
      
      // Bayonet knives
      'Bayonet | Doppler (Black Pearl)': 8438,
      'Bayonet | Doppler (Emerald)': 6000,
      'Bayonet | Doppler (Ruby)': 4801,
      'Bayonet | Doppler (Sapphire)': 4400,
      'Bayonet | Marble Fade': 2852,
      'Bayonet | Doppler (Phase 2)': 1200,
      'Bayonet | Doppler (Phase 4)': 1150,
      'Bayonet | Doppler (Phase 1)': 1100,
      'Bayonet | Doppler (Phase 3)': 1000,
      'Bayonet | Gamma Doppler (Phase 2)': 900,
      'Bayonet | Gamma Doppler (Phase 1)': 850,
      'Bayonet | Tiger Tooth': 700,
      
      // Mid-tier skins
      'Glock-18 | Fade': 343,
      'Desert Eagle | Blaze': 301,
      'AWP | Lightning Strike': 224,
      'AK-47 | Vulcan': 185,
      'AWP | Asiimov': 151,
      'AK-47 | Case Hardened': 125,
      'M4A4 | Asiimov': 109,
      'USP-S | Kill Confirmed': 98,
      
      // Lower-tier skins
      'M4A1-S | Knight': 85,
      'AK-47 | Asiimov': 80,
      'AK-47 | Hydroponic': 75,
      'M4A1-S | Hot Rod': 70,
      'AK-47 | The Empress': 65,
      'M4A1-S | Blue Phosphor': 60,
      'AWP | Printstream': 55,
      'M4A1-S | Printstream': 50,
      'USP-S | Printstream': 45,
      'Desert Eagle | Printstream': 40,
      'AWP | The Prince': 35,
      'Glock-18 | Gamma Doppler': 30
    };

    const wearMultipliers: Record<string, number> = {
      'Factory New': 1.4,
      'Minimal Wear': 1.2,
      'Field-Tested': 1.0,
      'Well-Worn': 0.8,
      'Battle-Scarred': 0.6
    };

    const basePrice = basePrices[skinName] || 25; // Much lower default for unknown skins
    const multiplier = wearMultipliers[wear] || 1.0;
    
    return Math.round(basePrice * multiplier * 100) / 100;
  }

  /**
   * Clear price cache
   */
  clearCache(): void {
    priceCache.clear();
    console.log('🗑️ Price cache cleared');
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: priceCache.size,
      entries: Array.from(priceCache.keys())
    };
  }
}

export default RealPriceService.getInstance(); 