import { LiquidationEngine } from './liquidationEngine';
import { MarketMaker } from './marketMaker';
import { FundingRateManager } from './fundingRate';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SystemStatus {
  liquidationEngine: {
    running: boolean;
    lastCheck: Date | null;
    positionsMonitored: number;
    liquidationsProcessed: number;
  };
  marketMaker: {
    running: boolean;
    lastUpdate: Date | null;
    ordersPlaced: number;
    spreadsManaged: number;
  };
  fundingRates: {
    running: boolean;
    lastCalculation: Date | null;
    ratesApplied: number;
  };
  priceUpdates: {
    running: boolean;
    lastUpdate: Date | null;
    skinsUpdated: number;
  };
}

export class SystemMonitor {
  private static instance: SystemMonitor;
  private status: SystemStatus;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  
  private constructor() {
    this.status = {
      liquidationEngine: {
        running: false,
        lastCheck: null,
        positionsMonitored: 0,
        liquidationsProcessed: 0
      },
      marketMaker: {
        running: false,
        lastUpdate: null,
        ordersPlaced: 0,
        spreadsManaged: 0
      },
      fundingRates: {
        running: false,
        lastCalculation: null,
        ratesApplied: 0
      },
      priceUpdates: {
        running: false,
        lastUpdate: null,
        skinsUpdated: 0
      }
    };
  }
  
  public static getInstance(): SystemMonitor {
    if (!SystemMonitor.instance) {
      SystemMonitor.instance = new SystemMonitor();
    }
    return SystemMonitor.instance;
  }

  /**
   * Start all system monitoring services
   */
  async startAllServices(): Promise<void> {
    console.log('🚀 Starting CS2 Derivatives Trading System...');
    
    try {
      // Start liquidation monitoring
      await this.startLiquidationMonitoring();
      
      // Start market making
      await this.startMarketMaking();
      
      // Start funding rate management
      await this.startFundingRateManagement();
      
      // Start price update monitoring
      await this.startPriceUpdateMonitoring();
      
      // Start system health monitoring
      await this.startSystemHealthMonitoring();
      
      console.log('✅ All system services started successfully');
      this.logSystemStatus();
      
    } catch (error) {
      console.error('❌ Error starting system services:', error);
      throw error;
    }
  }

  /**
   * Start liquidation monitoring service
   */
  private async startLiquidationMonitoring(): Promise<void> {
    const liquidationEngine = LiquidationEngine.getInstance();
    
    // Start monitoring every 30 seconds
    liquidationEngine.startMonitoring(30000);
    
    this.status.liquidationEngine.running = true;
    this.status.liquidationEngine.lastCheck = new Date();
    
    // Track liquidation metrics
    const interval = setInterval(async () => {
      try {
        const riskMetrics = await liquidationEngine.monitorPositions();
        this.status.liquidationEngine.positionsMonitored = riskMetrics.length;
        this.status.liquidationEngine.lastCheck = new Date();
      } catch (error) {
        console.error('Error in liquidation monitoring metrics:', error);
      }
    }, 60000); // Update metrics every minute
    
    this.intervals.set('liquidation-metrics', interval);
    console.log('🔍 Liquidation monitoring started');
  }

  /**
   * Start market making service
   */
  private async startMarketMaking(): Promise<void> {
    const marketMaker = MarketMaker.getInstance();
    
    // Get all skins for market making
    const skins = await prisma.skin.findMany({
      select: { id: true, name: true }
    });
    
    // Start market making for each skin every 2 minutes
    const interval = setInterval(async () => {
      try {
        let ordersPlaced = 0;
        
        for (const skin of skins) {
          await marketMaker.placeMarketMakingOrders(skin.id, skin.name);
          ordersPlaced++;
        }
        
        this.status.marketMaker.running = true;
        this.status.marketMaker.lastUpdate = new Date();
        this.status.marketMaker.ordersPlaced += ordersPlaced;
        this.status.marketMaker.spreadsManaged = skins.length;
        
      } catch (error) {
        console.error('Error in market making:', error);
      }
    }, 120000); // Every 2 minutes
    
    this.intervals.set('market-making', interval);
    console.log('💰 Market making started');
  }

  /**
   * Start funding rate management
   */
  private async startFundingRateManagement(): Promise<void> {
    const fundingManager = FundingRateManager.getInstance();
    
    // Apply funding rates every hour
    const interval = setInterval(async () => {
      try {
        const skins = await prisma.skin.findMany({
          select: { id: true }
        });
        
        let ratesApplied = 0;
        
        for (const skin of skins) {
          await fundingManager.applyFundingRate(skin.id);
          ratesApplied++;
        }
        
        this.status.fundingRates.running = true;
        this.status.fundingRates.lastCalculation = new Date();
        this.status.fundingRates.ratesApplied = ratesApplied;
        
      } catch (error) {
        console.error('Error in funding rate management:', error);
      }
    }, 3600000); // Every hour
    
    this.intervals.set('funding-rates', interval);
    console.log('📊 Funding rate management started');
  }

  /**
   * Start price update monitoring
   */
  private async startPriceUpdateMonitoring(): Promise<void> {
    // Monitor price update health
    const interval = setInterval(async () => {
      try {
        const recentUpdates = await prisma.skin.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 5 * 60 * 1000) // Last 5 minutes
            }
          }
        });
        
        this.status.priceUpdates.running = recentUpdates > 0;
        this.status.priceUpdates.lastUpdate = new Date();
        this.status.priceUpdates.skinsUpdated = recentUpdates;
        
      } catch (error) {
        console.error('Error monitoring price updates:', error);
      }
    }, 60000); // Check every minute
    
    this.intervals.set('price-monitoring', interval);
    console.log('📈 Price update monitoring started');
  }

  /**
   * Start system health monitoring
   */
  private async startSystemHealthMonitoring(): Promise<void> {
    const interval = setInterval(() => {
      this.logSystemStatus();
    }, 300000); // Log status every 5 minutes
    
    this.intervals.set('health-monitoring', interval);
    console.log('🏥 System health monitoring started');
  }

  /**
   * Stop all services
   */
  stopAllServices(): void {
    console.log('🛑 Stopping all system services...');
    
    // Clear all intervals
    this.intervals.forEach((interval, name) => {
      clearInterval(interval);
      console.log(`   Stopped ${name}`);
    });
    
    this.intervals.clear();
    
    // Reset status
    Object.keys(this.status).forEach(key => {
      (this.status as any)[key].running = false;
    });
    
    console.log('✅ All services stopped');
  }

  /**
   * Get current system status
   */
  getSystemStatus(): SystemStatus {
    return { ...this.status };
  }

  /**
   * Log system status
   */
  private logSystemStatus(): void {
    console.log('\n📊 === SYSTEM STATUS REPORT ===');
    console.log(`🔍 Liquidation Engine: ${this.status.liquidationEngine.running ? '✅ RUNNING' : '❌ STOPPED'}`);
    console.log(`   Positions Monitored: ${this.status.liquidationEngine.positionsMonitored}`);
    console.log(`   Last Check: ${this.status.liquidationEngine.lastCheck?.toLocaleTimeString() || 'Never'}`);
    
    console.log(`💰 Market Maker: ${this.status.marketMaker.running ? '✅ RUNNING' : '❌ STOPPED'}`);
    console.log(`   Orders Placed: ${this.status.marketMaker.ordersPlaced}`);
    console.log(`   Spreads Managed: ${this.status.marketMaker.spreadsManaged}`);
    
    console.log(`📊 Funding Rates: ${this.status.fundingRates.running ? '✅ RUNNING' : '❌ STOPPED'}`);
    console.log(`   Rates Applied: ${this.status.fundingRates.ratesApplied}`);
    
    console.log(`📈 Price Updates: ${this.status.priceUpdates.running ? '✅ RUNNING' : '❌ STOPPED'}`);
    console.log(`   Skins Updated: ${this.status.priceUpdates.skinsUpdated}`);
    
    console.log('================================\n');
  }

  /**
   * Check if all critical services are running
   */
  isSystemHealthy(): boolean {
    return this.status.liquidationEngine.running && 
           this.status.marketMaker.running && 
           this.status.priceUpdates.running;
  }

  /**
   * Get system uptime
   */
  getUptime(): string {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    
    return `${hours}h ${minutes}m ${seconds}s`;
  }
} 