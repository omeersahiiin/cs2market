'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BellIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  PlusIcon,
  AdjustmentsHorizontalIcon,
  ClockIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { formatSteamImageUrl, getFallbackImageUrl } from '../lib/utils';

interface Alert {
  id: string;
  type: 'price_target' | 'volume_spike' | 'trend_reversal' | 'arbitrage' | 'news';
  skinId: string;
  skinName: string;
  skinImage: string;
  title: string;
  message: string;
  targetPrice?: number;
  currentPrice: number;
  priceChange?: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  isRead: boolean;
  isActive: boolean;
  conditions?: {
    priceAbove?: number;
    priceBelow?: number;
    volumeIncrease?: number;
    timeframe?: string;
  };
}

interface AlertRule {
  id: string;
  skinId: string;
  skinName: string;
  type: 'price_target' | 'volume_spike' | 'trend_reversal';
  conditions: {
    priceAbove?: number;
    priceBelow?: number;
    volumeIncrease?: number;
    timeframe?: string;
  };
  isActive: boolean;
  createdAt: string;
}

interface TradeAlertsProps {
  isOpen: boolean;
  onClose: () => void;
}

const priorityColors = {
  low: 'text-blue-400 bg-blue-900/20 border-blue-500/30',
  medium: 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30',
  high: 'text-orange-400 bg-orange-900/20 border-orange-500/30',
  critical: 'text-red-400 bg-red-900/20 border-red-500/30'
};

const alertTypeIcons = {
  price_target: ArrowTrendingUpIcon,
  volume_spike: FireIcon,
  trend_reversal: AdjustmentsHorizontalIcon,
  arbitrage: ExclamationTriangleIcon,
  news: BellIcon
};

export default function TradeAlerts({ isOpen, onClose }: TradeAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([]);
  const [viewMode, setViewMode] = useState<'alerts' | 'rules' | 'create'>('alerts');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);

  // Mock alerts data
  useEffect(() => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        type: 'price_target',
        skinId: 'awp-dragon-lore',
        skinName: 'AWP | Dragon Lore',
        skinImage: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2D4G65Vy07-Uo9-g2wXj-UVpYmGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        title: 'Price Target Reached',
        message: 'AWP | Dragon Lore has reached your target price of $12,500',
        targetPrice: 12500,
        currentPrice: 12500,
        priceChange: 350,
        priority: 'high',
        timestamp: '2024-05-29T15:30:00Z',
        isRead: false,
        isActive: true
      },
      {
        id: '2',
        type: 'volume_spike',
        skinId: 'm4a4-howl',
        skinName: 'M4A4 | Howl',
        skinImage: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO1gb-Gw_alIITCmX5d4dO_yoD8j1yg5UdpZjz7cNKVdlI2aV_V_1K6wOjxxcjrJJJJJA',
        title: 'Volume Spike Detected',
        message: 'M4A4 | Howl trading volume increased by 340% in the last hour',
        currentPrice: 4200,
        priceChange: 180,
        priority: 'critical',
        timestamp: '2024-05-29T14:45:00Z',
        isRead: false,
        isActive: true
      },
      {
        id: '3',
        type: 'trend_reversal',
        skinId: 'karambit-fade',
        skinName: 'Karambit | Fade',
        skinImage: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rVyoD8j1yg5UdpZjz7cNKVdlI2aV_V_1K6wOjxxcjrJJJJJA',
        title: 'Trend Reversal Signal',
        message: 'Karambit | Fade showing bullish reversal pattern after 3-day decline',
        currentPrice: 2850,
        priceChange: 75,
        priority: 'medium',
        timestamp: '2024-05-29T13:20:00Z',
        isRead: true,
        isActive: true
      },
      {
        id: '4',
        type: 'arbitrage',
        skinId: 'ak47-wild-lotus',
        skinName: 'AK-47 | Wild Lotus',
        skinImage: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUJ6ZYg2LiSrN6t2wDi-UNpZGGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        title: 'Arbitrage Opportunity',
        message: 'Price difference of $120 detected between platforms',
        currentPrice: 8500,
        priceChange: -120,
        priority: 'high',
        timestamp: '2024-05-29T12:15:00Z',
        isRead: false,
        isActive: true
      },
      {
        id: '5',
        type: 'news',
        skinId: 'bayonet-doppler',
        skinName: 'Bayonet | Doppler',
        skinImage: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rEyoD8j1yg5UdqZjz7JoKVdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        title: 'Market News Impact',
        message: 'New case announcement affecting Doppler knife prices',
        currentPrice: 850,
        priceChange: -25,
        priority: 'low',
        timestamp: '2024-05-29T11:30:00Z',
        isRead: true,
        isActive: true
      }
    ];

    setAlerts(mockAlerts);
  }, []);

  // Mock alert rules
  useEffect(() => {
    const mockRules: AlertRule[] = [
      {
        id: '1',
        skinId: 'awp-dragon-lore',
        skinName: 'AWP | Dragon Lore',
        type: 'price_target',
        conditions: { priceAbove: 13000 },
        isActive: true,
        createdAt: '2024-05-25T10:00:00Z'
      },
      {
        id: '2',
        skinId: 'm4a4-howl',
        skinName: 'M4A4 | Howl',
        type: 'volume_spike',
        conditions: { volumeIncrease: 200, timeframe: '1h' },
        isActive: true,
        createdAt: '2024-05-24T15:30:00Z'
      },
      {
        id: '3',
        skinId: 'karambit-fade',
        skinName: 'Karambit | Fade',
        type: 'price_target',
        conditions: { priceBelow: 2800 },
        isActive: false,
        createdAt: '2024-05-23T09:15:00Z'
      }
    ];

    setAlertRules(mockRules);
  }, []);

  const filteredAlerts = alerts.filter(alert => {
    if (filterPriority !== 'all' && alert.priority !== filterPriority) return false;
    if (filterType !== 'all' && alert.type !== filterType) return false;
    if (showOnlyUnread && alert.isRead) return false;
    return true;
  });

  const unreadCount = alerts.filter(alert => !alert.isRead).length;

  const markAsRead = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId ? { ...alert, isRead: true } : alert
    ));
  };

  const deleteAlert = (alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  };

  const toggleAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteAlertRule = (ruleId: string) => {
    setAlertRules(prev => prev.filter(rule => rule.id !== ruleId));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#181A20] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#2A2D3A]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <BellIcon className="h-8 w-8" />
                {unreadCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-bold">Trade Alerts</h2>
                <p className="text-orange-100">Smart notifications and trading opportunities</p>
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
            {['alerts', 'rules', 'create'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-orange-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                {mode === 'alerts' && unreadCount > 0 && (
                  <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                    {unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Alerts View */}
          {viewMode === 'alerts' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4 p-4 bg-[#23262F] rounded-xl border border-[#2A2D3A]">
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                >
                  <option value="all">All Types</option>
                  <option value="price_target">Price Targets</option>
                  <option value="volume_spike">Volume Spikes</option>
                  <option value="trend_reversal">Trend Reversals</option>
                  <option value="arbitrage">Arbitrage</option>
                  <option value="news">News</option>
                </select>

                <label className="flex items-center space-x-2 text-white">
                  <input
                    type="checkbox"
                    checked={showOnlyUnread}
                    onChange={(e) => setShowOnlyUnread(e.target.checked)}
                    className="rounded border-[#2A2D3A] bg-[#181A20] text-orange-600 focus:ring-orange-500"
                  />
                  <span>Unread only</span>
                </label>

                <div className="ml-auto text-sm text-gray-400">
                  {filteredAlerts.length} alerts
                </div>
              </div>

              {/* Alerts List */}
              <div className="space-y-3">
                <AnimatePresence>
                  {filteredAlerts.map((alert, index) => {
                    const IconComponent = alertTypeIcons[alert.type];
                    
                    return (
                      <motion.div
                        key={alert.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          alert.isRead 
                            ? 'bg-[#23262F] border-[#2A2D3A] opacity-75' 
                            : 'bg-[#23262F] border-orange-500/30 shadow-lg'
                        }`}
                      >
                        <div className="flex items-start space-x-4">
                          {/* Alert Icon */}
                          <div className={`p-3 rounded-lg ${priorityColors[alert.priority]}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>

                          {/* Skin Image */}
                          <div className="w-16 h-16 bg-[#181A20] rounded-lg p-2 flex-shrink-0">
                            <Image
                              src={formatSteamImageUrl(alert.skinImage)}
                              alt={alert.skinName}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getFallbackImageUrl();
                              }}
                              unoptimized
                            />
                          </div>

                          {/* Alert Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-white">{alert.title}</h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[alert.priority]}`}>
                                {alert.priority.toUpperCase()}
                              </span>
                              {!alert.isRead && (
                                <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                              )}
                            </div>
                            
                            <p className="text-gray-400 text-sm mb-2">{alert.message}</p>
                            
                            <div className="flex items-center space-x-4 text-sm">
                              <span className="text-white font-medium">
                                ${alert.currentPrice.toLocaleString()}
                              </span>
                              
                              {alert.priceChange && (
                                <span className={`flex items-center ${
                                  alert.priceChange >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {alert.priceChange >= 0 ? (
                                    <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                                  ) : (
                                    <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                                  )}
                                  ${Math.abs(alert.priceChange)}
                                </span>
                              )}
                              
                              <span className="text-gray-500 flex items-center">
                                <ClockIcon className="h-4 w-4 mr-1" />
                                {new Date(alert.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2">
                            {!alert.isRead && (
                              <button
                                onClick={() => markAsRead(alert.id)}
                                className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors"
                                title="Mark as read"
                              >
                                <CheckCircleIcon className="h-4 w-4" />
                              </button>
                            )}
                            <button
                              onClick={() => deleteAlert(alert.id)}
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete alert"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>

                {filteredAlerts.length === 0 && (
                  <div className="text-center py-12">
                    <BellIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No alerts found</h3>
                    <p className="text-gray-500">
                      {showOnlyUnread ? 'No unread alerts' : 'Create alert rules to get notified of trading opportunities'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Rules View */}
          {viewMode === 'rules' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">Alert Rules</h3>
                <button
                  onClick={() => setViewMode('create')}
                  className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                >
                  <PlusIcon className="h-4 w-4" />
                  <span>Create Rule</span>
                </button>
              </div>

              <div className="space-y-3">
                {alertRules.map((rule, index) => (
                  <motion.div
                    key={rule.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-xl border transition-all ${
                      rule.isActive 
                        ? 'bg-[#23262F] border-green-500/30' 
                        : 'bg-[#23262F] border-[#2A2D3A] opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h4 className="font-semibold text-white">{rule.skinName}</h4>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            rule.isActive ? 'bg-green-900/20 text-green-400' : 'bg-gray-900/20 text-gray-400'
                          }`}>
                            {rule.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        
                        <div className="text-sm text-gray-400 space-y-1">
                          <div>Type: {rule.type.replace('_', ' ').toUpperCase()}</div>
                          <div>
                            Conditions: {' '}
                            {rule.conditions.priceAbove && `Price above $${rule.conditions.priceAbove}`}
                            {rule.conditions.priceBelow && `Price below $${rule.conditions.priceBelow}`}
                            {rule.conditions.volumeIncrease && `Volume increase ${rule.conditions.volumeIncrease}%`}
                            {rule.conditions.timeframe && ` in ${rule.conditions.timeframe}`}
                          </div>
                          <div>Created: {new Date(rule.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => toggleAlertRule(rule.id)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            rule.isActive
                              ? 'bg-yellow-900/20 text-yellow-400 hover:bg-yellow-900/30'
                              : 'bg-green-900/20 text-green-400 hover:bg-green-900/30'
                          }`}
                        >
                          {rule.isActive ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteAlertRule(rule.id)}
                          className="px-3 py-1 bg-red-900/20 text-red-400 rounded-lg hover:bg-red-900/30 transition-colors text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {alertRules.length === 0 && (
                  <div className="text-center py-12">
                    <AdjustmentsHorizontalIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-400 mb-2">No alert rules</h3>
                    <p className="text-gray-500 mb-4">Create your first alert rule to get notified of trading opportunities</p>
                    <button
                      onClick={() => setViewMode('create')}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                    >
                      Create Alert Rule
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Create View */}
          {viewMode === 'create' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                <h3 className="text-lg font-semibold text-white mb-6">Create Alert Rule</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Skin</label>
                    <select className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500">
                      <option>Select a skin...</option>
                      <option>AWP | Dragon Lore</option>
                      <option>AK-47 | Wild Lotus</option>
                      <option>Karambit | Fade</option>
                      <option>M4A4 | Howl</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Alert Type</label>
                    <select className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500">
                      <option value="price_target">Price Target</option>
                      <option value="volume_spike">Volume Spike</option>
                      <option value="trend_reversal">Trend Reversal</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price Above ($)</label>
                      <input
                        type="number"
                        placeholder="e.g., 13000"
                        className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Price Below ($)</label>
                      <input
                        type="number"
                        placeholder="e.g., 2800"
                        className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Volume Increase (%)</label>
                      <input
                        type="number"
                        placeholder="e.g., 200"
                        className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Timeframe</label>
                      <select className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-orange-500">
                        <option value="1h">1 Hour</option>
                        <option value="4h">4 Hours</option>
                        <option value="1d">1 Day</option>
                        <option value="1w">1 Week</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <button className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                      Create Alert Rule
                    </button>
                    <button
                      onClick={() => setViewMode('rules')}
                      className="px-4 py-2 bg-[#2A2D3A] text-gray-300 rounded-lg hover:bg-[#374151] transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
} 