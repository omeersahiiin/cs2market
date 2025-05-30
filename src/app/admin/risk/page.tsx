'use client';

import React, { useEffect, useState } from 'react';
import { 
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ClockIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

interface RiskMetrics {
  positionId: string;
  userId: string;
  userEmail: string;
  skinId: string;
  skinName: string;
  positionType: string;
  entryPrice: number;
  currentPrice: number;
  size: number;
  margin: number;
  unrealizedPnL: number;
  marginRatio: number;
  liquidationPrice: number;
  riskLevel: 'SAFE' | 'WARNING' | 'DANGER' | 'LIQUIDATION';
}

interface SystemHealth {
  totalPositions: number;
  totalMargin: number;
  totalUnrealizedPnL: number;
  safePositions: number;
  warningPositions: number;
  dangerPositions: number;
  liquidationPositions: number;
  systemLeverage: number;
  marginUtilization: number;
}

export default function RiskMonitoringPage() {
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchRiskData = async () => {
    try {
      const response = await fetch('/api/admin/risk-monitoring');
      if (response.ok) {
        const data = await response.json();
        setRiskMetrics(data.riskMetrics);
        setSystemHealth(data.systemHealth);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching risk data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(fetchRiskData, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE': return 'text-green-400';
      case 'WARNING': return 'text-yellow-400';
      case 'DANGER': return 'text-orange-400';
      case 'LIQUIDATION': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getRiskBgColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'SAFE': return 'bg-green-900/20 border-green-700';
      case 'WARNING': return 'bg-yellow-900/20 border-yellow-700';
      case 'DANGER': return 'bg-orange-900/20 border-orange-700';
      case 'LIQUIDATION': return 'bg-red-900/20 border-red-700';
      default: return 'bg-gray-900/20 border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1419] text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading risk monitoring data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      {/* Header */}
      <div className="bg-[#181A20] border-b border-[#2A2D3A] px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Risk Monitoring Dashboard</h1>
            <p className="text-gray-400 mt-1">Real-time position risk analysis and system health monitoring</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                }`}
              >
                {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
              </button>
              <button
                onClick={fetchRiskData}
                className="px-3 py-1 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Refresh Now
              </button>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Last Updated</div>
              <div className="text-sm text-white">{lastUpdate.toLocaleTimeString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* System Health Overview */}
        {systemHealth && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Positions</p>
                  <p className="text-2xl font-bold text-white">{systemHealth.totalPositions}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Safe: {systemHealth.safePositions} | At Risk: {systemHealth.totalPositions - systemHealth.safePositions}
                  </div>
                </div>
                <ChartBarIcon className="h-8 w-8 text-blue-400" />
              </div>
            </div>

            <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Total Margin</p>
                  <p className="text-2xl font-bold text-white">${systemHealth.totalMargin.toLocaleString()}</p>
                  <div className="text-xs text-gray-500 mt-1">
                    Utilization: {systemHealth.marginUtilization.toFixed(1)}%
                  </div>
                </div>
                <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
              </div>
            </div>

            <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Unrealized P&L</p>
                  <p className={`text-2xl font-bold ${
                    systemHealth.totalUnrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    ${systemHealth.totalUnrealizedPnL.toLocaleString()}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    System-wide exposure
                  </div>
                </div>
                {systemHealth.totalUnrealizedPnL >= 0 ? (
                  <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
                ) : (
                  <ArrowTrendingDownIcon className="h-8 w-8 text-red-400" />
                )}
              </div>
            </div>

            <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">Risk Status</p>
                  <div className="flex items-center space-x-2 mt-1">
                    {systemHealth.liquidationPositions > 0 ? (
                      <>
                        <ExclamationTriangleIcon className="h-6 w-6 text-red-400" />
                        <span className="text-red-400 font-bold">CRITICAL</span>
                      </>
                    ) : systemHealth.dangerPositions > 0 ? (
                      <>
                        <ExclamationTriangleIcon className="h-6 w-6 text-orange-400" />
                        <span className="text-orange-400 font-bold">HIGH RISK</span>
                      </>
                    ) : systemHealth.warningPositions > 0 ? (
                      <>
                        <ExclamationTriangleIcon className="h-6 w-6 text-yellow-400" />
                        <span className="text-yellow-400 font-bold">MODERATE</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheckIcon className="h-6 w-6 text-green-400" />
                        <span className="text-green-400 font-bold">HEALTHY</span>
                      </>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {systemHealth.liquidationPositions} liquidations pending
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Risk Level Summary */}
        {systemHealth && (
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-4">Risk Level Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">{systemHealth.safePositions}</div>
                <div className="text-sm text-gray-400">Safe Positions</div>
                <div className="text-xs text-gray-500">Margin Ratio &gt; 15%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">{systemHealth.warningPositions}</div>
                <div className="text-sm text-gray-400">Warning Level</div>
                <div className="text-xs text-gray-500">Margin Ratio 12-15%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-400">{systemHealth.dangerPositions}</div>
                <div className="text-sm text-gray-400">Danger Level</div>
                <div className="text-xs text-gray-500">Margin Ratio 10-12%</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-400">{systemHealth.liquidationPositions}</div>
                <div className="text-sm text-gray-400">Liquidation</div>
                <div className="text-xs text-gray-500">Margin Ratio ≤ 10%</div>
              </div>
            </div>
          </div>
        )}

        {/* Position Risk Details */}
        <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
          <h3 className="text-xl font-semibold text-white mb-6">Position Risk Analysis</h3>
          
          {riskMetrics.length === 0 ? (
            <div className="text-center py-8">
              <ShieldCheckIcon className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <p className="text-gray-400">No positions requiring attention</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {riskMetrics
                .sort((a, b) => {
                  const riskOrder = { 'LIQUIDATION': 0, 'DANGER': 1, 'WARNING': 2, 'SAFE': 3 };
                  return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
                })
                .map((metrics) => (
                  <div 
                    key={metrics.positionId} 
                    className={`p-4 rounded-xl border ${getRiskBgColor(metrics.riskLevel)}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getRiskColor(metrics.riskLevel)}`}>
                            {metrics.riskLevel}
                          </span>
                          <span className="font-semibold text-white">{metrics.skinName}</span>
                          <span className={`px-2 py-1 rounded text-xs ${
                            metrics.positionType === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {metrics.positionType}
                          </span>
                        </div>
                        <div className="text-sm text-gray-400 mt-1">
                          User: {metrics.userEmail} | Size: {metrics.size} | Entry: ${metrics.entryPrice.toFixed(2)}
                        </div>
                      </div>
                      
                      <div className="text-right space-y-1">
                        <div className="text-sm">
                          <span className="text-gray-400">Current: </span>
                          <span className="text-white font-mono">${metrics.currentPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Liquidation: </span>
                          <span className="text-red-400 font-mono">${metrics.liquidationPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">Margin Ratio: </span>
                          <span className={`font-mono ${getRiskColor(metrics.riskLevel)}`}>
                            {(metrics.marginRatio * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="text-sm">
                          <span className="text-gray-400">P&L: </span>
                          <span className={`font-mono ${
                            metrics.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            ${metrics.unrealizedPnL.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* System Actions */}
        <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
          <h3 className="text-xl font-semibold text-white mb-4">System Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-red-600 hover:bg-red-700 rounded-xl text-white font-medium transition-colors">
              <ExclamationTriangleIcon className="h-6 w-6 mx-auto mb-2" />
              Force Liquidation Check
            </button>
            <button className="p-4 bg-yellow-600 hover:bg-yellow-700 rounded-xl text-white font-medium transition-colors">
              <ClockIcon className="h-6 w-6 mx-auto mb-2" />
              Send Risk Warnings
            </button>
            <button className="p-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-medium transition-colors">
              <ChartBarIcon className="h-6 w-6 mx-auto mb-2" />
              Generate Risk Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 