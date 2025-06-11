import { PrismaClient } from '@prisma/client';
import { env } from '@/lib/env';

declare global {
  var prisma: PrismaClient | undefined;
}

class PrismaClientSingleton {
  private static instance: PrismaClient;
  private static retryCount = 0;
  private static maxRetries = 3;

  static getInstance(): PrismaClient {
    if (!PrismaClientSingleton.instance) {
      PrismaClientSingleton.instance = new PrismaClient({
        log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
        datasources: {
          db: {
            url: env.DATABASE_URL,
          },
        },
      });
    }

    return PrismaClientSingleton.instance;
  }

  static async executeWithRetry<T>(
    operation: (prisma: PrismaClient) => Promise<T>,
    operationName: string = 'database operation'
  ): Promise<T> {
    const prisma = PrismaClientSingleton.getInstance();
    
    for (let attempt = 1; attempt <= PrismaClientSingleton.maxRetries; attempt++) {
      try {
        const result = await operation(prisma);
        
        // Reset retry count on success
        PrismaClientSingleton.retryCount = 0;
        return result;
      } catch (error: any) {
        console.error(`${operationName} attempt ${attempt} failed:`, error.message);
        
        // Check if it's a prepared statement error
        if (error.message?.includes('prepared statement') && error.message?.includes('does not exist')) {
          console.log(`Prepared statement error detected, attempting to reconnect...`);
          
          try {
            // Disconnect and reconnect
            await prisma.$disconnect();
            
            // Create new instance
            PrismaClientSingleton.instance = new PrismaClient({
              log: env.isDevelopment ? ['query', 'error', 'warn'] : ['error'],
              datasources: {
                db: {
                  url: env.DATABASE_URL,
                },
              },
            });
            
            console.log('Prisma client reconnected successfully');
            
            // Wait a bit before retry
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
            
            if (attempt < PrismaClientSingleton.maxRetries) {
              continue; // Retry with new connection
            }
          } catch (reconnectError) {
            console.error('Failed to reconnect Prisma client:', reconnectError);
          }
        }
        
        // If this is the last attempt, throw the error
        if (attempt === PrismaClientSingleton.maxRetries) {
          throw error;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
    
    throw new Error(`${operationName} failed after ${PrismaClientSingleton.maxRetries} attempts`);
  }

  static async disconnect(): Promise<void> {
    if (PrismaClientSingleton.instance) {
      await PrismaClientSingleton.instance.$disconnect();
    }
  }
}

// Use global variable in development to prevent multiple instances
const prisma = globalThis.prisma ?? PrismaClientSingleton.getInstance();

if (env.isDevelopment) {
  globalThis.prisma = prisma;
}

export { prisma, PrismaClientSingleton }; 