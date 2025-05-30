import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Float wear ranges (standard CS2 ranges)
export const WEAR_RANGES = {
  'Factory New': { min: 0.00, max: 0.07 },
  'Minimal Wear': { min: 0.07, max: 0.15 },
  'Field-Tested': { min: 0.15, max: 0.38 },
  'Well-Worn': { min: 0.38, max: 0.45 },
  'Battle-Scarred': { min: 0.45, max: 1.00 }
};

// CS2 skin definition mappings (you'd expand this with real data)
export const SKIN_DEFINITIONS = {
  'AK-47 | Case Hardened': { defIndex: 7, paintIndex: 44 },
  'AWP | Dragon Lore': { defIndex: 9, paintIndex: 344 },
  'M4A4 | Asiimov': { defIndex: 16, paintIndex: 279 },
  // Add more skins as needed
};

// Add skin-specific price data
const SKIN_PRICE_DATA = {
  'AWP | Dragon Lore': {
    basePrice: 14000,
    floatPriceRanges: {
      'Factory New': [
        { floatRange: [0.00, 0.01], priceMultiplier: 1.4 },    // ~19,600
        { floatRange: [0.01, 0.02], priceMultiplier: 1.2 },    // ~16,800
        { floatRange: [0.02, 0.03], priceMultiplier: 1.15 },   // ~16,100
        { floatRange: [0.03, 0.05], priceMultiplier: 1.1 },    // ~15,400
        { floatRange: [0.05, 0.07], priceMultiplier: 1.0 }     // ~14,000
      ],
      'Minimal Wear': [
        { floatRange: [0.07, 0.09], priceMultiplier: 0.85 },   // ~11,900
        { floatRange: [0.09, 0.11], priceMultiplier: 0.8 },    // ~11,200
        { floatRange: [0.11, 0.13], priceMultiplier: 0.75 },   // ~10,500
        { floatRange: [0.13, 0.15], priceMultiplier: 0.7 }     // ~9,800
      ],
      'Field-Tested': [
        { floatRange: [0.15, 0.20], priceMultiplier: 0.6 },    // ~8,400
        { floatRange: [0.20, 0.25], priceMultiplier: 0.55 },   // ~7,700
        { floatRange: [0.25, 0.30], priceMultiplier: 0.5 },    // ~7,000
        { floatRange: [0.30, 0.38], priceMultiplier: 0.45 }    // ~6,300
      ],
      'Well-Worn': [
        { floatRange: [0.38, 0.40], priceMultiplier: 0.4 },    // ~5,600
        { floatRange: [0.40, 0.42], priceMultiplier: 0.35 },   // ~4,900
        { floatRange: [0.42, 0.45], priceMultiplier: 0.3 }     // ~4,200
      ],
      'Battle-Scarred': [
        { floatRange: [0.45, 0.55], priceMultiplier: 0.25 },   // ~3,500
        { floatRange: [0.55, 0.70], priceMultiplier: 0.2 },    // ~2,800
        { floatRange: [0.70, 0.85], priceMultiplier: 0.18 },   // ~2,520
        { floatRange: [0.85, 1.00], priceMultiplier: 0.15 }    // ~2,100
      ]
    }
  },
  'AK-47 | Case Hardened': {
    basePrice: 800,
    floatPriceRanges: {
      'Factory New': [
        { floatRange: [0.00, 0.01], priceMultiplier: 2.0 },
        { floatRange: [0.01, 0.02], priceMultiplier: 1.8 },
        { floatRange: [0.02, 0.03], priceMultiplier: 1.6 },
        { floatRange: [0.03, 0.05], priceMultiplier: 1.4 },
        { floatRange: [0.05, 0.07], priceMultiplier: 1.2 }
      ],
      'Minimal Wear': [
        { floatRange: [0.07, 0.09], priceMultiplier: 1.0 },
        { floatRange: [0.09, 0.11], priceMultiplier: 0.9 },
        { floatRange: [0.11, 0.13], priceMultiplier: 0.85 },
        { floatRange: [0.13, 0.15], priceMultiplier: 0.8 }
      ],
      'Field-Tested': [
        { floatRange: [0.15, 0.20], priceMultiplier: 0.7 },
        { floatRange: [0.20, 0.25], priceMultiplier: 0.65 },
        { floatRange: [0.25, 0.30], priceMultiplier: 0.6 },
        { floatRange: [0.30, 0.38], priceMultiplier: 0.55 }
      ],
      'Well-Worn': [
        { floatRange: [0.38, 0.40], priceMultiplier: 0.5 },
        { floatRange: [0.40, 0.42], priceMultiplier: 0.45 },
        { floatRange: [0.42, 0.45], priceMultiplier: 0.4 }
      ],
      'Battle-Scarred': [
        { floatRange: [0.45, 0.55], priceMultiplier: 0.35 },
        { floatRange: [0.55, 0.70], priceMultiplier: 0.3 },
        { floatRange: [0.70, 0.85], priceMultiplier: 0.25 },
        { floatRange: [0.85, 1.00], priceMultiplier: 0.2 }
      ]
    }
  }
  // Add more skins as needed
};

export interface FloatAnalysis {
  skinId: string;
  skinName: string;
  wearConditions: {
    [wear: string]: {
      floatRange: { min: number; max: number };
      avgFloat: number;
      avgPrice: number;
      sampleSize: number;
      priceRanges: {
        floatMin: number;
        floatMax: number;
        avgPrice: number;
        sampleSize: number;
        priceMultiplier: number; // vs base price
      }[];
    };
  };
  floatImpact: {
    priceVariation: number; // % price difference between best and worst float
    mostValuable: { wear: string; floatRange: string; multiplier: number };
    leastValuable: { wear: string; floatRange: string; multiplier: number };
  };
  recommendations: {
    bestValue: { wear: string; reason: string };
    investment: { wear: string; reason: string };
    trading: { wear: string; reason: string };
  };
}

export class FloatAnalysisService {
  /**
   * Fetch float data from CSFloat-style API
   */
  async fetchFloatDataFromAPI(skinName: string, defIndex?: number, paintIndex?: number): Promise<any> {
    try {
      // Simulate CSFloat API call - in reality you'd call their actual API
      // Example: https://csfloat.com/api/v1/listings?name=AK-47%20Case%20Hardened&def_index=7&paint_index=44
      
      // For now, return simulated data based on the skin
      return this.generateSimulatedFloatData(skinName);
    } catch (error) {
      console.error('Error fetching float data:', error);
      return null;
    }
  }

  /**
   * Generate simulated float data (replace with real API calls)
   */
  private generateSimulatedFloatData(skinName: string): any {
    const basePrice = 100; // You'd get this from your skin data
    
    // Simulate realistic float distribution and pricing
    const data = {
      'Factory New': {
        samples: [
          { float: 0.01, price: basePrice * 1.8 },
          { float: 0.02, price: basePrice * 1.7 },
          { float: 0.03, price: basePrice * 1.6 },
          { float: 0.05, price: basePrice * 1.5 },
          { float: 0.06, price: basePrice * 1.4 },
        ]
      },
      'Minimal Wear': {
        samples: [
          { float: 0.08, price: basePrice * 1.3 },
          { float: 0.10, price: basePrice * 1.25 },
          { float: 0.12, price: basePrice * 1.2 },
          { float: 0.14, price: basePrice * 1.15 },
        ]
      },
      'Field-Tested': {
        samples: [
          { float: 0.16, price: basePrice * 1.0 },
          { float: 0.20, price: basePrice * 0.95 },
          { float: 0.25, price: basePrice * 0.9 },
          { float: 0.30, price: basePrice * 0.85 },
          { float: 0.35, price: basePrice * 0.8 },
        ]
      },
      'Well-Worn': {
        samples: [
          { float: 0.39, price: basePrice * 0.75 },
          { float: 0.41, price: basePrice * 0.7 },
          { float: 0.43, price: basePrice * 0.65 },
        ]
      },
      'Battle-Scarred': {
        samples: [
          { float: 0.47, price: basePrice * 0.6 },
          { float: 0.55, price: basePrice * 0.55 },
          { float: 0.70, price: basePrice * 0.5 },
          { float: 0.85, price: basePrice * 0.45 },
        ]
      }
    };

    return data;
  }

  /**
   * Update float data for a skin in the database
   */
  async updateFloatData(skinId: string): Promise<void> {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) return;

    const skinDef = SKIN_DEFINITIONS[skin.name as keyof typeof SKIN_DEFINITIONS];
    const floatData = await this.fetchFloatDataFromAPI(
      skin.name, 
      skinDef?.defIndex, 
      skinDef?.paintIndex
    );

    if (!floatData) return;

    // Update skin with definition indices
    if (skinDef) {
      await prisma.$executeRaw`
        UPDATE "Skin" 
        SET "defIndex" = ${skinDef.defIndex}, 
            "paintIndex" = ${skinDef.paintIndex}, 
            "minFloat" = 0.0, 
            "maxFloat" = 1.0,
            "updatedAt" = NOW()
        WHERE "id" = ${skinId}
      `;
    }

    // Process each wear condition
    for (const [wear, data] of Object.entries(floatData)) {
      const samples = (data as any).samples as { float: number; price: number }[];
      const wearRange = WEAR_RANGES[wear as keyof typeof WEAR_RANGES];
      
      if (!samples.length || !wearRange) continue;

      const avgFloat = samples.reduce((sum, s) => sum + s.float, 0) / samples.length;
      const avgPrice = samples.reduce((sum, s) => sum + s.price, 0) / samples.length;

      // Upsert float data using raw query to avoid type issues
      await prisma.$executeRaw`
        INSERT INTO "FloatData" ("id", "skinId", "wear", "floatMin", "floatMax", "avgFloat", "avgPrice", "sampleSize", "lastUpdated")
        VALUES (gen_random_uuid(), ${skinId}, ${wear}, ${wearRange.min}, ${wearRange.max}, ${avgFloat}, ${avgPrice}, ${samples.length}, NOW())
        ON CONFLICT ("skinId", "wear") 
        DO UPDATE SET 
          "avgFloat" = ${avgFloat},
          "avgPrice" = ${avgPrice},
          "sampleSize" = ${samples.length},
          "lastUpdated" = NOW()
      `;

      // Get the float data record
      const floatDataRecord = await prisma.$queryRaw`
        SELECT * FROM "FloatData" WHERE "skinId" = ${skinId} AND "wear" = ${wear}
      ` as any[];

      if (floatDataRecord.length > 0) {
        const floatDataId = floatDataRecord[0].id;
        
        // Clear existing price ranges
        await prisma.$executeRaw`
          DELETE FROM "FloatPriceRange" WHERE "floatDataId" = ${floatDataId}
        `;

        // Create new price ranges based on float distribution
        const ranges = this.createFloatRanges(samples, wearRange);
        
        for (const range of ranges) {
          await prisma.$executeRaw`
            INSERT INTO "FloatPriceRange" ("id", "floatDataId", "floatMin", "floatMax", "avgPrice", "sampleSize", "lastUpdated")
            VALUES (gen_random_uuid(), ${floatDataId}, ${range.floatMin}, ${range.floatMax}, ${range.avgPrice}, ${range.sampleSize}, NOW())
          `;
        }
      }
    }
  }

  /**
   * Create float ranges with pricing data
   */
  private createFloatRanges(samples: { float: number; price: number }[], wearRange: { min: number; max: number }) {
    const ranges = [];
    const rangeSize = (wearRange.max - wearRange.min) / 5; // Create 5 sub-ranges

    for (let i = 0; i < 5; i++) {
      const rangeMin = wearRange.min + (i * rangeSize);
      const rangeMax = wearRange.min + ((i + 1) * rangeSize);
      
      const samplesInRange = samples.filter(s => s.float >= rangeMin && s.float < rangeMax);
      
      if (samplesInRange.length > 0) {
        const avgPrice = samplesInRange.reduce((sum, s) => sum + s.price, 0) / samplesInRange.length;
        
        ranges.push({
          floatMin: rangeMin,
          floatMax: rangeMax,
          avgPrice,
          sampleSize: samplesInRange.length
        });
      }
    }

    return ranges;
  }

  /**
   * Get comprehensive float analysis for a skin
   */
  async getFloatAnalysis(skinId: string): Promise<FloatAnalysis | null> {
    const skin = await prisma.skin.findUnique({
      where: { id: skinId }
    });

    if (!skin) return null;

    // Get float data using raw query
    const floatDataRecords = await prisma.$queryRaw`
      SELECT fd.*, 
             json_agg(
               json_build_object(
                 'floatMin', fpr."floatMin",
                 'floatMax', fpr."floatMax", 
                 'avgPrice', fpr."avgPrice",
                 'sampleSize', fpr."sampleSize"
               )
             ) as "priceRanges"
      FROM "FloatData" fd
      LEFT JOIN "FloatPriceRange" fpr ON fd.id = fpr."floatDataId"
      WHERE fd."skinId" = ${skinId}
      GROUP BY fd.id, fd."skinId", fd.wear, fd."floatMin", fd."floatMax", fd."avgFloat", fd."avgPrice", fd."sampleSize", fd."lastUpdated"
    ` as any[];

    if (!floatDataRecords.length) return null;

    const wearConditions: any = {};
    let minPrice = Infinity;
    let maxPrice = 0;
    let mostValuable = { wear: '', floatRange: '', multiplier: 0 };
    let leastValuable = { wear: '', floatRange: '', multiplier: Infinity };

    // Process each wear condition
    for (const floatData of floatDataRecords) {
      const priceRanges = (floatData.priceRanges || []).filter((range: any) => range.floatMin !== null).map((range: any) => {
        const multiplier = range.avgPrice / skin.price;
        
        if (range.avgPrice > maxPrice) {
          maxPrice = range.avgPrice;
          mostValuable = {
            wear: floatData.wear,
            floatRange: `${range.floatMin.toFixed(3)}-${range.floatMax.toFixed(3)}`,
            multiplier
          };
        }
        
        if (range.avgPrice < minPrice) {
          minPrice = range.avgPrice;
          leastValuable = {
            wear: floatData.wear,
            floatRange: `${range.floatMin.toFixed(3)}-${range.floatMax.toFixed(3)}`,
            multiplier
          };
        }

        return {
          floatMin: range.floatMin,
          floatMax: range.floatMax,
          avgPrice: range.avgPrice,
          sampleSize: range.sampleSize,
          priceMultiplier: multiplier
        };
      });

      wearConditions[floatData.wear] = {
        floatRange: { min: floatData.floatMin, max: floatData.floatMax },
        avgFloat: floatData.avgFloat,
        avgPrice: floatData.avgPrice,
        sampleSize: floatData.sampleSize,
        priceRanges
      };
    }

    const priceVariation = minPrice !== Infinity ? ((maxPrice - minPrice) / minPrice) * 100 : 0;

    return {
      skinId,
      skinName: skin.name,
      wearConditions,
      floatImpact: {
        priceVariation,
        mostValuable,
        leastValuable
      },
      recommendations: this.generateRecommendations(wearConditions, priceVariation)
    };
  }

  /**
   * Generate trading recommendations based on float analysis
   */
  private generateRecommendations(wearConditions: any, priceVariation: number) {
    // Simple recommendation logic - you can make this more sophisticated
    const wears = Object.keys(wearConditions);
    
    return {
      bestValue: {
        wear: 'Field-Tested',
        reason: 'Best balance between price and visual quality'
      },
      investment: {
        wear: 'Factory New',
        reason: 'Highest appreciation potential and rarity'
      },
      trading: {
        wear: 'Minimal Wear',
        reason: 'High liquidity and stable demand'
      }
    };
  }

  /**
   * Get float impact on price for a specific float value
   */
  async getFloatPriceImpact(skinId: string, floatValue: number): Promise<{
    wear: string;
    estimatedPrice: number;
    priceMultiplier: number;
    rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';
    marketPrice: number;
    priceEffect: {
      absoluteChange: number;
      percentageChange: number;
      similarFloats: {
        min: number;
        max: number;
        avgPrice: number;
      }[];
    };
  } | null> {
    const analysis = await this.getFloatAnalysis(skinId);
    if (!analysis) return null;

    // Get skin-specific price data
    const skinPriceData = SKIN_PRICE_DATA[analysis.skinName as keyof typeof SKIN_PRICE_DATA];
    if (!skinPriceData) {
      // Fallback to simulated data if skin not found
      return this.getSimulatedPriceImpact(analysis, floatValue);
    }

    // Determine wear condition
    let wear = '';
    for (const [wearName, range] of Object.entries(WEAR_RANGES)) {
      if (floatValue >= range.min && floatValue < range.max) {
        wear = wearName;
        break;
      }
    }

    if (!wear) return null;

    const basePrice = skinPriceData.basePrice;
    const wearRanges = skinPriceData.floatPriceRanges[wear as keyof typeof skinPriceData.floatPriceRanges];
    
    if (!wearRanges) return null;

    // Find the specific price range for this float
    let currentRange = wearRanges.find(r => 
      floatValue >= r.floatRange[0] && floatValue < r.floatRange[1]
    );

    if (!currentRange) {
      currentRange = wearRanges[wearRanges.length - 1]; // Use last range if not found
    }

    const estimatedPrice = basePrice * currentRange.priceMultiplier;

    // Find similar float ranges
    const similarFloats = wearRanges
      .filter(r => Math.abs(r.floatRange[0] - floatValue) < 0.02 || Math.abs(r.floatRange[1] - floatValue) < 0.02)
      .map(r => ({
        min: r.floatRange[0],
        max: r.floatRange[1],
        avgPrice: basePrice * r.priceMultiplier
      }))
      .sort((a, b) => a.min - b.min);

    // Calculate market average (mid-range price for the wear condition)
    const marketPrice = basePrice * wearRanges[Math.floor(wearRanges.length / 2)].priceMultiplier;

    // Calculate price effect
    const absoluteChange = estimatedPrice - marketPrice;
    const percentageChange = ((estimatedPrice - marketPrice) / marketPrice) * 100;

    // Determine rarity based on position in wear range and price impact
    let rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';
    if (percentageChange > 30) {
      rarity = 'Very Rare';
    } else if (percentageChange > 15) {
      rarity = 'Rare';
    } else if (percentageChange > 5) {
      rarity = 'Uncommon';
    } else {
      rarity = 'Common';
    }

    return {
      wear,
      estimatedPrice,
      priceMultiplier: currentRange.priceMultiplier,
      rarity,
      marketPrice,
      priceEffect: {
        absoluteChange,
        percentageChange,
        similarFloats: similarFloats.length > 0 ? similarFloats : [{
          min: currentRange.floatRange[0],
          max: currentRange.floatRange[1],
          avgPrice: estimatedPrice
        }]
      }
    };
  }

  /**
   * Fallback method for skins without specific price data
   */
  private getSimulatedPriceImpact(analysis: FloatAnalysis, floatValue: number) {
    // ... existing simulation logic ...
    return null;
  }
}

export const floatAnalysisService = new FloatAnalysisService(); 