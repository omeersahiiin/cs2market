import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

// Create a singleton Prisma client with better connection handling
export const prisma = globalThis.prisma || new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&prepared_statements=false'
    }
  },
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
});

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Enhanced PrismaClientSingleton with better error handling and retry logic
export class PrismaClientSingleton {
  private static instance: PrismaClient | null = null;
  private static connectionAttempts = 0;
  private static maxRetries = 3;

  static getInstance(): PrismaClient {
    if (!this.instance) {
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&prepared_statements=false'
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      });
    }
    return this.instance;
  }

  static async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName: string = 'database operation',
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const prisma = this.getInstance();
        
        // Add connection timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Database operation timeout after 10 seconds`)), 10000);
        });
        
        const result = await Promise.race([
          operation(prisma),
          timeoutPromise
        ]);
        
        console.log(`[PrismaClient] ${operationName} succeeded on attempt ${attempt}`);
        return result;
        
      } catch (error: any) {
        lastError = error;
        console.error(`[PrismaClient] ${operationName} failed on attempt ${attempt}:`, error.message);
        
        // Check if it's a prepared statement error
        if (error.message?.includes('prepared statement') && error.message?.includes('already exists')) {
          console.log(`[PrismaClient] Prepared statement error detected, recreating connection...`);
          await this.resetConnection();
        }
        
        // Check if it's a connection error
        if (error.message?.includes('connection') || error.message?.includes('timeout')) {
          console.log(`[PrismaClient] Connection error detected, recreating connection...`);
          await this.resetConnection();
        }
        
        // If this is the last attempt, throw the error
        if (attempt === maxRetries) {
          console.error(`[PrismaClient] ${operationName} failed after ${maxRetries} attempts`);
          throw error;
        }
        
        // Wait before retrying (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`[PrismaClient] Retrying ${operationName} in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError || new Error(`Operation failed after ${maxRetries} attempts`);
  }

  static async resetConnection(): Promise<void> {
    try {
      if (this.instance) {
        console.log('[PrismaClient] Disconnecting existing connection...');
        await this.instance.$disconnect();
        this.instance = null;
      }
      
      // Wait a moment before creating new connection
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('[PrismaClient] Creating new connection...');
      this.instance = new PrismaClient({
        datasources: {
          db: {
            url: process.env.DATABASE_URL + '?pgbouncer=true&connection_limit=1&prepared_statements=false'
          }
        },
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
      });
      
    } catch (error) {
      console.error('[PrismaClient] Error resetting connection:', error);
    }
  }

  static async disconnect(): Promise<void> {
    if (this.instance) {
      await this.instance.$disconnect();
      this.instance = null;
    }
  }
}

export default prisma; 