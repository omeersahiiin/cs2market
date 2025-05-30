'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  ChartBarIcon,
  CurrencyDollarIcon,
  ScaleIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { getSteamIconUrl, getFallbackImageUrl } from '../../lib/utils';

interface Position {
  id: string;
  type: string;
  entryPrice: number;
  exitPrice?: number;
  size: number;
  margin: number;
  closedAt: string | null;
  createdAt: string;
  skin: {
    id: string;
    name: string;
    price: number;
    iconPath: string;
  };
}

interface BalanceHistory {
  date: string;
  balance: number;
  pnl: number;
  trades: number;
}

interface PerformanceMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  totalPnL: number;
  averageWin: number;
  averageLoss: number;
  profitFactor: number;
  sharpeRatio: number;
  maxDrawdown: number;
  expectancy: number;
}

const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899'];

export default function PortfolioPage() {
  const [openPositions, setOpenPositions] = useState<Position[]>([]);
  const [closedPositions, setClosedPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [closingId, setClosingId] = useState<string | null>(null);
  const [balance, setBalance] = useState<number>(0);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [balanceHistory, setBalanceHistory] = useState<BalanceHistory[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);

  // Generate mock balance history
  const generateBalanceHistory = (timeframe: string) => {
    const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : timeframe === '90d' ? 90 : 365;
    const history: BalanceHistory[] = [];
    let currentBalance = 10000;
    
    for (let i = days; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Simulate daily P&L with some volatility
      const dailyPnL = (Math.random() - 0.5) * 200;
      currentBalance += dailyPnL;
      
      history.push({
        date: date.toISOString().split('T')[0],
        balance: currentBalance,
        pnl: dailyPnL,
        trades: Math.floor(Math.random() * 5)
      });
    }
    
    return history;
  };

  // Calculate performance metrics
  const calculatePerformanceMetrics = (positions: Position[]): PerformanceMetrics => {
    const closedTrades = positions.filter(p => p.closedAt);
    const totalTrades = closedTrades.length;
    
    if (totalTrades === 0) {
      return {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        winRate: 0,
        totalPnL: 0,
        averageWin: 0,
        averageLoss: 0,
        profitFactor: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        expectancy: 0
      };
    }

    const pnls = closedTrades.map(pos => {
      const exitPrice = pos.exitPrice || pos.skin.price;
      return pos.type === 'LONG'
        ? (exitPrice - pos.entryPrice) * pos.size
        : (pos.entryPrice - exitPrice) * pos.size;
    });

    const winningTrades = pnls.filter(pnl => pnl > 0);
    const losingTrades = pnls.filter(pnl => pnl < 0);
    const totalPnL = pnls.reduce((sum, pnl) => sum + pnl, 0);
    
    const averageWin = winningTrades.length > 0 ? winningTrades.reduce((sum, pnl) => sum + pnl, 0) / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? Math.abs(losingTrades.reduce((sum, pnl) => sum + pnl, 0) / losingTrades.length) : 0;
    
    return {
      totalTrades,
      winningTrades: winningTrades.length,
      losingTrades: losingTrades.length,
      winRate: (winningTrades.length / totalTrades) * 100,
      totalPnL,
      averageWin,
      averageLoss,
      profitFactor: averageLoss > 0 ? averageWin / averageLoss : 0,
      sharpeRatio: Math.random() * 2, // Mock Sharpe ratio
      maxDrawdown: Math.random() * 1000, // Mock max drawdown
      expectancy: totalPnL / totalTrades
    };
  };

  const fetchPositions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/positions?all=true');
      if (!res.ok) throw new Error('Failed to fetch positions');
      const data = await res.json();
      const open = data.filter((p: Position) => !p.closedAt);
      const closed = data.filter((p: Position) => p.closedAt);
      
      setOpenPositions(open);
      setClosedPositions(closed);
      setPerformanceMetrics(calculatePerformanceMetrics(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async () => {
    const res = await fetch('/api/user/balance');
    if (res.ok) {
      const data = await res.json();
      setBalance(data.balance);
    }
  };

  useEffect(() => {
    fetchPositions();
    fetchBalance();
  }, []);

  useEffect(() => {
    setBalanceHistory(generateBalanceHistory(selectedTimeframe));
  }, [selectedTimeframe]);

  // Set up real-time price updates
  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let reconnectAttempt = 0;

    const setupSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/skins/price-updates');

      eventSource.onmessage = (event) => {
        const priceUpdates = JSON.parse(event.data);
        
        setOpenPositions(prev => prev.map(pos => {
          if (priceUpdates[pos.skin.id]) {
            return {
              ...pos,
              skin: { ...pos.skin, price: priceUpdates[pos.skin.id] }
            };
          }
          return pos;
        }));

        setClosedPositions(prev => prev.map(pos => {
          if (priceUpdates[pos.skin.id]) {
            return {
              ...pos,
              skin: { ...pos.skin, price: priceUpdates[pos.skin.id] }
            };
          }
          return pos;
        }));
      };

      eventSource.onerror = () => {
        eventSource?.close();
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
        reconnectTimeout = setTimeout(() => {
          reconnectAttempt++;
          setupSSE();
        }, delay);
      };

      eventSource.onopen = () => {
        reconnectAttempt = 0;
      };
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
    };
  }, []);

  const handleClose = async (skinId: string) => {
    setClosingId(skinId);
    try {
      const res = await fetch(`/api/positions/${skinId}/close`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to close position');
      await fetchPositions();
      await fetchBalance();
    } catch (err) {
      alert('Error closing position');
    } finally {
      setClosingId(null);
    }
  };

  // Calculate unrealized P&L
  const unrealizedPnL = openPositions.reduce((acc, pos) => {
    const pnl = pos.type === 'LONG'
      ? (pos.skin.price - pos.entryPrice) * pos.size
      : (pos.entryPrice - pos.skin.price) * pos.size;
    return acc + pnl;
  }, 0);

  // Calculate realized P&L
  const realizedPnL = closedPositions.reduce((acc, pos) => {
    const exitPrice = pos.exitPrice || pos.skin.price;
    const pnl = pos.type === 'LONG'
      ? (exitPrice - pos.entryPrice) * pos.size
      : (pos.entryPrice - exitPrice) * pos.size;
    return acc + pnl;
  }, 0);

  // Asset allocation data
  const assetAllocation = openPositions.reduce((acc, pos) => {
    const value = pos.entryPrice * pos.size;
    const existing = acc.find(item => item.name === pos.skin.name);
    if (existing) {
      existing.value += value;
    } else {
      acc.push({ name: pos.skin.name, value });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  // Position type distribution
  const positionTypes = [
    { name: 'Long', value: openPositions.filter(p => p.type === 'LONG').length },
    { name: 'Short', value: openPositions.filter(p => p.type === 'SHORT').length }
  ];

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      {/* Header */}
      <div className="bg-[#181A20] border-b border-[#2A2D3A] px-6 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Portfolio Analytics</h1>
            <p className="text-gray-400 mt-1">Comprehensive trading performance dashboard</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Total Portfolio Value</div>
              <div className="text-2xl font-bold text-white">${(balance + unrealizedPnL).toLocaleString()}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Account Balance</p>
                <p className="text-2xl font-bold text-white">${balance.toLocaleString()}</p>
              </div>
              <CurrencyDollarIcon className="h-8 w-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Unrealized P&L</p>
                <p className={`text-2xl font-bold ${unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${unrealizedPnL.toLocaleString()}
                </p>
              </div>
              {unrealizedPnL >= 0 ? (
                <ArrowTrendingUpIcon className="h-8 w-8 text-green-400" />
              ) : (
                <ArrowTrendingDownIcon className="h-8 w-8 text-red-400" />
              )}
            </div>
          </div>

          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Realized P&L</p>
                <p className={`text-2xl font-bold ${realizedPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${realizedPnL.toLocaleString()}
                </p>
              </div>
              <ChartBarIcon className="h-8 w-8 text-purple-400" />
            </div>
          </div>

          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Open Positions</p>
                <p className="text-2xl font-bold text-white">{openPositions.length}</p>
              </div>
              <ScaleIcon className="h-8 w-8 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Account Balance History */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-white">Account Balance History</h3>
              <div className="flex space-x-2">
                {['7d', '30d', '90d', '1y'].map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setSelectedTimeframe(tf as any)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      selectedTimeframe === tf
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#23262F', 
                    border: '1px solid #2A2D3A',
                    borderRadius: '8px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3B82F6" 
                  fill="url(#balanceGradient)" 
                />
                <defs>
                  <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Daily P&L Chart */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Daily P&L</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={balanceHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#23262F', 
                    border: '1px solid #2A2D3A',
                    borderRadius: '8px'
                  }}
                />
                <Bar 
                  dataKey="pnl" 
                >
                  {balanceHistory.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Performance Metrics and Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Performance Metrics */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Performance Metrics</h3>
            {performanceMetrics && (
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Total Trades</span>
                  <span className="text-white font-semibold">{performanceMetrics.totalTrades}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Win Rate</span>
                  <span className="text-green-400 font-semibold">{performanceMetrics.winRate.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Profit Factor</span>
                  <span className="text-blue-400 font-semibold">{performanceMetrics.profitFactor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Win</span>
                  <span className="text-green-400 font-semibold">${performanceMetrics.averageWin.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Avg Loss</span>
                  <span className="text-red-400 font-semibold">${performanceMetrics.averageLoss.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Expectancy</span>
                  <span className={`font-semibold ${performanceMetrics.expectancy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ${performanceMetrics.expectancy.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Sharpe Ratio</span>
                  <span className="text-purple-400 font-semibold">{performanceMetrics.sharpeRatio.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Asset Allocation */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Asset Allocation</h3>
            {assetAllocation.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={assetAllocation}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {assetAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#23262F', 
                      border: '1px solid #2A2D3A',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No open positions
              </div>
            )}
          </div>

          {/* Position Types */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Position Types</h3>
            {positionTypes.some(p => p.value > 0) ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={positionTypes.filter(p => p.value > 0)}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#23262F', 
                      border: '1px solid #2A2D3A',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-400">
                No open positions
              </div>
            )}
          </div>
        </div>

        {/* Positions Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Open Positions */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Open Positions</h3>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : openPositions.length === 0 ? (
              <div className="text-center py-8">
                <ScaleIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No open positions</p>
                <Link 
                  href="/trade" 
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Start Trading
                </Link>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {openPositions.map((position) => {
                  const pnl = position.type === 'LONG'
                    ? (position.skin.price - position.entryPrice) * position.size
                    : (position.entryPrice - position.skin.price) * position.size;
                  const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;
                  
                  return (
                    <div key={position.id} className="flex items-center bg-[#23262F] rounded-xl p-4 hover:bg-[#2A2D3A] transition-colors">
                      <Image
                        src={getSteamIconUrl(position.skin.iconPath)}
                        alt={position.skin.name}
                        width={48}
                        height={48}
                        className="rounded-lg border border-gray-700 bg-[#181A20] object-contain mr-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackImageUrl();
                        }}
                      />
                      <div className="flex-1">
                        <Link href={`/skins/${position.skin.id}`} className="font-semibold text-blue-400 hover:underline">
                          {position.skin.name}
                        </Link>
                        <div className="text-sm text-gray-400 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.type === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {position.type}
                          </span>
                          <span className="ml-2">Entry: ${position.entryPrice.toFixed(2)}</span>
                          <span className="ml-2">Size: {position.size}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-400">Current: ${position.skin.price.toFixed(2)}</div>
                        <div className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${pnl.toFixed(2)} ({pnlPercent.toFixed(1)}%)
                        </div>
                        <button
                          className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 disabled:opacity-50 transition-colors"
                          onClick={() => handleClose(position.skin.id)}
                          disabled={closingId === position.skin.id}
                        >
                          {closingId === position.skin.id ? 'Closing...' : 'Close'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Trade History */}
          <div className="bg-[#181A20] p-6 rounded-xl border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Recent Trades</h3>
            {loading ? (
              <p className="text-gray-400">Loading...</p>
            ) : closedPositions.length === 0 ? (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No trade history</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {closedPositions.slice(0, 10).map((position) => {
                  const exitPrice = position.exitPrice || position.skin.price;
                  const pnl = position.type === 'LONG'
                    ? (exitPrice - position.entryPrice) * position.size
                    : (position.entryPrice - exitPrice) * position.size;
                  const pnlPercent = (pnl / (position.entryPrice * position.size)) * 100;
                  
                  return (
                    <div key={position.id} className="flex items-center bg-[#23262F] rounded-xl p-4">
                      <Image
                        src={getSteamIconUrl(position.skin.iconPath)}
                        alt={position.skin.name}
                        width={48}
                        height={48}
                        className="rounded-lg border border-gray-700 bg-[#181A20] object-contain mr-4"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = getFallbackImageUrl();
                        }}
                      />
                      <div className="flex-1">
                        <Link href={`/skins/${position.skin.id}`} className="font-semibold text-blue-400 hover:underline">
                          {position.skin.name}
                        </Link>
                        <div className="text-sm text-gray-400 mt-1">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            position.type === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                          }`}>
                            {position.type}
                          </span>
                          <span className="ml-2">Entry: ${position.entryPrice.toFixed(2)}</span>
                          <span className="ml-2">Exit: ${exitPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {new Date(position.closedAt!).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          ${pnl.toFixed(2)}
                        </div>
                        <div className={`text-sm ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          {pnlPercent.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 