import { NextRequest, NextResponse } from 'next/server';
import { PriceServiceManager } from '@/lib/priceServiceManager';

const priceServiceManager = PriceServiceManager.getInstance();

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'status':
        const status = priceServiceManager.getSourcesStatus();
        return NextResponse.json({
          success: true,
          sources: status,
          message: 'Price service status retrieved'
        });

      case 'start':
        priceServiceManager.startPriceUpdates();
        return NextResponse.json({
          success: true,
          message: 'Price update service started'
        });

      case 'stop':
        priceServiceManager.stopPriceUpdates();
        return NextResponse.json({
          success: true,
          message: 'Price update service stopped'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action. Use: status, start, or stop'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Price service API error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, skinId } = body;

    switch (action) {
      case 'getPrice':
        if (!skinId) {
          return NextResponse.json({
            success: false,
            message: 'skinId is required'
          }, { status: 400 });
        }

        const price = await priceServiceManager.getCurrentPrice(skinId);
        return NextResponse.json({
          success: true,
          price,
          message: price ? 'Price retrieved' : 'Price not found'
        });

      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Price service POST error:', error);
    return NextResponse.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
} 