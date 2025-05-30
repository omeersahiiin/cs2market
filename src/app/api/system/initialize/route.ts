import { NextRequest, NextResponse } from 'next/server';
import { initializeSystem, isSystemInitialized } from '@/lib/startup';

export const dynamic = 'force-dynamic';

// POST /api/system/initialize - Initialize system services
export async function POST(request: NextRequest) {
  try {
    if (isSystemInitialized()) {
      return NextResponse.json({ 
        message: 'System already initialized',
        initialized: true 
      });
    }

    await initializeSystem();
    
    return NextResponse.json({ 
      message: 'System initialized successfully',
      initialized: true 
    });

  } catch (error) {
    console.error('Error initializing system:', error);
    return NextResponse.json({ 
      error: 'Failed to initialize system',
      initialized: false 
    }, { status: 500 });
  }
}

// GET /api/system/initialize - Get system status
export async function GET(request: NextRequest) {
  try {
    const { getSystemStatus } = await import('@/lib/startup');
    const status = getSystemStatus();
    
    return NextResponse.json(status);

  } catch (error) {
    console.error('Error getting system status:', error);
    return NextResponse.json({ 
      error: 'Failed to get system status' 
    }, { status: 500 });
  }
} 