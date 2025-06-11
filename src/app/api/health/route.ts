import { NextResponse } from 'next/server';
import { PrismaClientSingleton } from '@/lib/prisma';
import { env } from '@/lib/env';

export const dynamic = 'force-dynamic';

export async function GET() {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    status: 'healthy',
    services: {
      database: { status: 'unknown', message: '', responseTime: 0 },
      environment: { status: 'unknown', message: '', config: {} },
      auth: { status: 'unknown', message: '' },
      api: { status: 'healthy', message: 'API responding' }
    },
    version: '1.0.0'
  };

  // Test Database Connection
  try {
    const startTime = Date.now();
    await PrismaClientSingleton.executeWithRetry(
      async (prisma) => {
        return await prisma.$queryRaw`SELECT 1 as test`;
      },
      'health check database connection'
    );
    const responseTime = Date.now() - startTime;
    
    healthCheck.services.database = {
      status: 'healthy',
      message: 'Database connection successful',
      responseTime
    };
  } catch (error) {
    healthCheck.services.database = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Database connection failed',
      responseTime: 0
    };
    healthCheck.status = 'degraded';
  }

  // Test Environment Configuration
  try {
    env.validate();
    healthCheck.services.environment = {
      status: 'healthy',
      message: 'Environment variables configured',
      config: {
        NODE_ENV: env.NODE_ENV,
        hasDatabase: !!env.DATABASE_URL,
        hasNextAuthSecret: !!env.NEXTAUTH_SECRET,
        hasPriceEmpireKey: !!env.PRICEMPIRE_API_KEY,
        isProduction: env.isProduction
      }
    };
  } catch (error) {
    healthCheck.services.environment = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Environment configuration error',
      config: {}
    };
    healthCheck.status = 'unhealthy';
  }

  // Test Auth Configuration
  try {
    if (env.NEXTAUTH_SECRET && env.NEXTAUTH_URL) {
      healthCheck.services.auth = {
        status: 'healthy',
        message: 'Authentication configuration valid'
      };
    } else {
      healthCheck.services.auth = {
        status: 'degraded',
        message: 'Authentication configuration incomplete'
      };
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }
  } catch (error) {
    healthCheck.services.auth = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'Authentication configuration error'
    };
    healthCheck.status = 'unhealthy';
  }

  // Determine overall status
  const unhealthyServices = Object.values(healthCheck.services).filter(
    service => service.status === 'unhealthy'
  ).length;

  if (unhealthyServices > 0) {
    healthCheck.status = 'unhealthy';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 
                    healthCheck.status === 'degraded' ? 200 : 503;

  return NextResponse.json(healthCheck, { status: statusCode });
} 