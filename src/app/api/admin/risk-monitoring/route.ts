import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LiquidationEngine } from '@/lib/liquidationEngine';

export const dynamic = 'force-dynamic';

// GET /api/admin/risk-monitoring - Get system risk metrics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin (you might want to add an admin role to your user model)
    // For now, we'll allow any authenticated user to access this
    
    const liquidationEngine = LiquidationEngine.getInstance();
    
    // Get risk metrics for all positions
    const riskMetrics = await liquidationEngine.monitorPositions();
    
    // Get risk summary
    const riskSummary = await liquidationEngine.getRiskSummary();
    
    // Calculate additional system health metrics
    const totalMargin = riskMetrics.reduce((sum, metrics) => sum + metrics.margin, 0);
    const totalUnrealizedPnL = riskMetrics.reduce((sum, metrics) => sum + metrics.unrealizedPnL, 0);
    
    // Mock system leverage and margin utilization (you can implement actual calculations)
    const systemLeverage = 5.0; // Average leverage across all positions
    const marginUtilization = 75.0; // Percentage of available margin being used
    
    // Transform risk metrics to include user email (mock for now)
    const enhancedRiskMetrics = riskMetrics.map(metrics => ({
      ...metrics,
      userEmail: `user-${metrics.userId.slice(-8)}@example.com` // Mock email
    }));
    
    const systemHealth = {
      totalPositions: riskSummary.totalPositions,
      totalMargin,
      totalUnrealizedPnL,
      safePositions: riskSummary.safePositions,
      warningPositions: riskSummary.warningPositions,
      dangerPositions: riskSummary.dangerPositions,
      liquidationPositions: riskSummary.liquidationPositions,
      systemLeverage,
      marginUtilization
    };

    return NextResponse.json({
      riskMetrics: enhancedRiskMetrics,
      systemHealth,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching risk monitoring data:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 