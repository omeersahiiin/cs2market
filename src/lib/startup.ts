import { SystemMonitor } from './systemMonitor';

let systemStarted = false;

/**
 * Initialize the CS2 Derivatives Trading System
 * This should be called when the application starts
 */
export async function initializeSystem(): Promise<void> {
  if (systemStarted) {
    console.log('⚠️  System already initialized');
    return;
  }

  try {
    console.log('🚀 Initializing CS2 Derivatives Trading System...');
    
    const systemMonitor = SystemMonitor.getInstance();
    await systemMonitor.startAllServices();
    
    systemStarted = true;
    
    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      systemMonitor.stopAllServices();
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      systemMonitor.stopAllServices();
      process.exit(0);
    });
    
    console.log('✅ CS2 Derivatives Trading System initialized successfully');
    
  } catch (error) {
    console.error('❌ Failed to initialize system:', error);
    throw error;
  }
}

/**
 * Get system status
 */
export function getSystemStatus() {
  const systemMonitor = SystemMonitor.getInstance();
  return {
    initialized: systemStarted,
    healthy: systemMonitor.isSystemHealthy(),
    uptime: systemMonitor.getUptime(),
    status: systemMonitor.getSystemStatus()
  };
}

/**
 * Check if system is initialized
 */
export function isSystemInitialized(): boolean {
  return systemStarted;
} 