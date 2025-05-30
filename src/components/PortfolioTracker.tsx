'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon, 
  PlusIcon, 
  MinusIcon,
  ChartBarIcon,
  EyeIcon,
  ShareIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';
import { PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface PortfolioItem {
  id: string;
  skinId: string;
  name: string;
  image: string;
  rarity: string;
  wear: string;
  purchasePrice: number;
  currentPrice: number;
  quantity: number;
  purchaseDate: string;
  category: string;
  collection?: string;
}

interface PortfolioStats {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  totalPnLPercentage: number;
  bestPerformer: PortfolioItem | null;
  worstPerformer: PortfolioItem | null;
  categoryBreakdown: { [key: string]: number };
  dailyPnL: number;
  weeklyPnL: number;
  monthlyPnL: number;
}

interface PortfolioTrackerProps {
  isOpen: boolean;
  onClose: () => void;
}

const rarityColors = {
  'Consumer Grade': '#9CA3AF',
  'Industrial Grade': '#3B82F6',
  'Mil-Spec': '#6366F1',
  'Restricted': '#8B5CF6',
  'Classified': '#EC4899',
  'Covert': '#EF4444',
  'Contraband': '#F97316'
};

const COLORS = ['#3B82F6', '#8B5CF6', '#EC4899', '#EF4444', '#F97316', '#10B981', '#F59E0B'];

export default function PortfolioTracker({ isOpen, onClose }: PortfolioTrackerProps) {
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([]);
  const [stats, setStats] = useState<PortfolioStats | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [viewMode, setViewMode] = useState<'overview' | 'holdings' | 'analytics'>('overview');
  const [sortBy, setSortBy] = useState<'value' | 'pnl' | 'pnlPercent' | 'name'>('value');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Mock portfolio data
  useEffect(() => {
    const mockPortfolio: PortfolioItem[] = [
      {
        id: '1',
        skinId: 'awp-dragon-lore',
        name: 'AWP | Dragon Lore',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2D4G65Vy07-Uo9-g2wXj-UVpYmGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        rarity: 'Contraband',
        wear: 'Field-Tested',
        purchasePrice: 11500,
        currentPrice: 12500,
        quantity: 1,
        purchaseDate: '2024-01-15',
        category: 'Sniper',
        collection: 'Cobblestone Collection'
      },
      {
        id: '2',
        skinId: 'ak47-wild-lotus',
        name: 'AK-47 | Wild Lotus',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUJ6ZYg2LiSrN6t2wDi-UNpZGGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        rarity: 'Covert',
        wear: 'Minimal Wear',
        purchasePrice: 8200,
        currentPrice: 8500,
        quantity: 1,
        purchaseDate: '2024-01-20',
        category: 'Rifle',
        collection: 'Dreams & Nightmares Collection'
      },
      {
        id: '3',
        skinId: 'karambit-fade',
        name: 'Karambit | Fade',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rVyoD8j1yg5UdpZjz7cNKVdlI2aV_V_1K6wOjxxcjrJJJJJA',
        rarity: 'Covert',
        wear: 'Factory New',
        purchasePrice: 2650,
        currentPrice: 2850,
        quantity: 1,
        purchaseDate: '2024-01-25',
        category: 'Knife',
        collection: 'Chroma Collection'
      },
      {
        id: '4',
        skinId: 'glock-fade',
        name: 'Glock-18 | Fade',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0Ob3djFN79eJmIWPnuL5fevVwW4IuJIkjLiQ8d2t2wDi-UNpZGGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        rarity: 'Restricted',
        wear: 'Factory New',
        purchasePrice: 420,
        currentPrice: 380,
        quantity: 2,
        purchaseDate: '2024-02-01',
        category: 'Pistol',
        collection: 'Chroma Collection'
      }
    ];

    setPortfolioItems(mockPortfolio);
  }, []);

  // Calculate portfolio statistics
  useEffect(() => {
    if (portfolioItems.length === 0) return;

    const totalValue = portfolioItems.reduce((sum, item) => sum + (item.currentPrice * item.quantity), 0);
    const totalInvested = portfolioItems.reduce((sum, item) => sum + (item.purchasePrice * item.quantity), 0);
    const totalPnL = totalValue - totalInvested;
    const totalPnLPercentage = ((totalPnL / totalInvested) * 100);

    // Find best and worst performers
    const itemsWithPnL = portfolioItems.map(item => ({
      ...item,
      pnl: (item.currentPrice - item.purchasePrice) * item.quantity,
      pnlPercent: ((item.currentPrice - item.purchasePrice) / item.purchasePrice) * 100
    }));

    const bestPerformer = itemsWithPnL.reduce((best, item) => 
      item.pnlPercent > best.pnlPercent ? item : best
    );

    const worstPerformer = itemsWithPnL.reduce((worst, item) => 
      item.pnlPercent < worst.pnlPercent ? item : worst
    );

    // Category breakdown
    const categoryBreakdown: { [key: string]: number } = {};
    portfolioItems.forEach(item => {
      const value = item.currentPrice * item.quantity;
      categoryBreakdown[item.category] = (categoryBreakdown[item.category] || 0) + value;
    });

    setStats({
      totalValue,
      totalInvested,
      totalPnL,
      totalPnLPercentage,
      bestPerformer,
      worstPerformer,
      categoryBreakdown,
      dailyPnL: totalPnL * 0.02, // Mock daily change
      weeklyPnL: totalPnL * 0.15, // Mock weekly change
      monthlyPnL: totalPnL // Mock monthly change
    });
  }, [portfolioItems]);

  const sortedItems = [...portfolioItems].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'value':
        comparison = (a.currentPrice * a.quantity) - (b.currentPrice * b.quantity);
        break;
      case 'pnl':
        comparison = ((a.currentPrice - a.purchasePrice) * a.quantity) - ((b.currentPrice - b.purchasePrice) * b.quantity);
        break;
      case 'pnlPercent':
        const aPnLPercent = ((a.currentPrice - a.purchasePrice) / a.purchasePrice) * 100;
        const bPnLPercent = ((b.currentPrice - b.purchasePrice) / b.purchasePrice) * 100;
        comparison = aPnLPercent - bPnLPercent;
        break;
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
    }

    return sortOrder === 'desc' ? -comparison : comparison;
  });

  // Prepare chart data
  const categoryChartData = stats ? Object.entries(stats.categoryBreakdown).map(([category, value]) => ({
    name: category,
    value: Math.round(value),
    percentage: ((value / stats.totalValue) * 100).toFixed(1)
  })) : [];

  // Mock historical data for line chart
  const historicalData = [
    { date: '2024-01-01', value: 22000 },
    { date: '2024-01-15', value: 22350 },
    { date: '2024-01-30', value: 23100 },
    { date: '2024-02-15', value: 23850 },
    { date: '2024-02-29', value: 24230 },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#181A20] rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-[#2A2D3A]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Portfolio Tracker</h2>
                <p className="text-green-100">Track your CS2 skin investments and performance</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-[#181A20]">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-[#23262F] rounded-lg p-1">
            {['overview', 'holdings', 'analytics'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {viewMode === 'overview' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Portfolio Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total Value</p>
                      <p className="text-2xl font-bold text-white">${stats.totalValue.toLocaleString()}</p>
                    </div>
                    <div className="p-3 bg-green-900/20 rounded-lg">
                      <ArrowTrendingUpIcon className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Total P&L</p>
                      <p className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.totalPnL >= 0 ? '+' : ''}${stats.totalPnL.toLocaleString()}
                      </p>
                      <p className={`text-sm ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.totalPnLPercentage >= 0 ? '+' : ''}{stats.totalPnLPercentage.toFixed(2)}%
                      </p>
                    </div>
                    <div className={`p-3 rounded-lg ${stats.totalPnL >= 0 ? 'bg-green-900/20' : 'bg-red-900/20'}`}>
                      {stats.totalPnL >= 0 ? (
                        <ArrowUpIcon className="h-6 w-6 text-green-400" />
                      ) : (
                        <ArrowDownIcon className="h-6 w-6 text-red-400" />
                      )}
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Best Performer</p>
                      <p className="text-lg font-semibold text-white truncate">{stats.bestPerformer?.name}</p>
                      <p className="text-sm text-green-400">
                        +{(((stats.bestPerformer?.currentPrice || 0) - (stats.bestPerformer?.purchasePrice || 0)) / (stats.bestPerformer?.purchasePrice || 1) * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-400 text-sm">Holdings</p>
                      <p className="text-2xl font-bold text-white">{portfolioItems.length}</p>
                      <p className="text-sm text-gray-400">Unique skins</p>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Portfolio Value Chart */}
                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-semibold text-white mb-4">Portfolio Value</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={historicalData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                      <XAxis dataKey="date" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#23262F', 
                          border: '1px solid #2A2D3A',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#10B981" 
                        strokeWidth={3}
                        dot={{ fill: '#10B981', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                {/* Category Breakdown */}
                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-semibold text-white mb-4">Category Breakdown</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name}: ${percentage}%`}
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#23262F', 
                          border: '1px solid #2A2D3A',
                          borderRadius: '8px',
                          color: '#fff'
                        }} 
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </motion.div>
          )}

          {/* Holdings Tab */}
          {viewMode === 'holdings' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              {/* Sort Controls */}
              <div className="flex items-center space-x-4 mb-6">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-2 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="value">Sort by Value</option>
                  <option value="pnl">Sort by P&L</option>
                  <option value="pnlPercent">Sort by P&L %</option>
                  <option value="name">Sort by Name</option>
                </select>
                <button
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                  className="px-3 py-2 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white hover:bg-[#2A2D3A] transition-colors"
                >
                  {sortOrder === 'desc' ? '↓' : '↑'}
                </button>
              </div>

              {/* Holdings List */}
              <div className="space-y-3">
                {sortedItems.map((item, index) => {
                  const pnl = (item.currentPrice - item.purchasePrice) * item.quantity;
                  const pnlPercent = ((item.currentPrice - item.purchasePrice) / item.purchasePrice) * 100;
                  
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.01 }}
                      className="bg-[#23262F] rounded-xl p-4 border border-[#2A2D3A] hover:border-gray-500 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        {/* Skin Image */}
                        <div className="w-16 h-16 bg-[#181A20] rounded-lg p-2 flex-shrink-0">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-contain"
                          />
                        </div>

                        {/* Skin Info */}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.category} • {item.wear}</p>
                          <div className="flex items-center space-x-2 mt-1">
                            <span 
                              className="inline-block px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${rarityColors[item.rarity as keyof typeof rarityColors]}20`,
                                color: rarityColors[item.rarity as keyof typeof rarityColors]
                              }}
                            >
                              {item.rarity}
                            </span>
                            {item.quantity > 1 && (
                              <span className="text-xs text-gray-400">Qty: {item.quantity}</span>
                            )}
                          </div>
                        </div>

                        {/* Price Info */}
                        <div className="text-right">
                          <div className="text-lg font-bold text-white">
                            ${(item.currentPrice * item.quantity).toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-400">
                            Avg: ${item.purchasePrice.toLocaleString()}
                          </div>
                          <div className={`text-sm font-medium ${pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {pnl >= 0 ? '+' : ''}${pnl.toLocaleString()} ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors">
                            <ShareIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Analytics Tab */}
          {viewMode === 'analytics' && stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-semibold text-white mb-4">Daily P&L</h3>
                  <div className={`text-2xl font-bold ${stats.dailyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.dailyPnL >= 0 ? '+' : ''}${stats.dailyPnL.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {((stats.dailyPnL / stats.totalValue) * 100).toFixed(2)}% of portfolio
                  </div>
                </div>

                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-semibold text-white mb-4">Weekly P&L</h3>
                  <div className={`text-2xl font-bold ${stats.weeklyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.weeklyPnL >= 0 ? '+' : ''}${stats.weeklyPnL.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {((stats.weeklyPnL / stats.totalValue) * 100).toFixed(2)}% of portfolio
                  </div>
                </div>

                <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-semibold text-white mb-4">Monthly P&L</h3>
                  <div className={`text-2xl font-bold ${stats.monthlyPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.monthlyPnL >= 0 ? '+' : ''}${stats.monthlyPnL.toFixed(0)}
                  </div>
                  <div className="text-sm text-gray-400">
                    {((stats.monthlyPnL / stats.totalValue) * 100).toFixed(2)}% of portfolio
                  </div>
                </div>
              </div>

              {/* Detailed Analytics */}
              <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                <h3 className="text-lg font-semibold text-white mb-4">Performance by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                    <XAxis dataKey="name" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#23262F', 
                        border: '1px solid #2A2D3A',
                        borderRadius: '8px',
                        color: '#fff'
                      }} 
                    />
                    <Bar dataKey="value" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 