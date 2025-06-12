'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  ClockIcon,
  CurrencyDollarIcon,
  StarIcon,
  BookmarkIcon,
  Cog6ToothIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import TradingChart from '@/components/TradingChart';
import OrderBook from '@/components/OrderBook';
import TradeHistory from '@/components/TradeHistory';
import PositionManager from '@/components/PositionManager';
import ConditionalOrdersList from '@/components/ConditionalOrdersList';
import { formatSteamImageUrl, getFallbackImageUrl } from '../../lib/utils';

interface Skin {
  id: string;
  name: string;
  price: number;
  iconPath: string;
  type: string;
  rarity: string;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  high24h: number;
  low24h: number;
}

interface OrderFormData {
  type: 'market' | 'limit' | 'stop';
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  stopPrice?: number;
  total: number;
}

interface Position {
  id: string;
  skinId: string;
  skinName: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  timestamp: string;
}

const timeframes = ['1m', '5m', '15m', '1h', '4h', '1d', '1w'];

export default function TradePage() {
  const { data: session } = useSession();
  const [selectedSkin, setSelectedSkin] = useState<Skin | null>(null);
  const [skins, setSkins] = useState<Skin[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [orderForm, setOrderForm] = useState<OrderFormData>({
    type: 'limit',
    side: 'buy',
    quantity: 1,
    price: 0,
    total: 0
  });
  const [positions, setPositions] = useState<Position[]>([]);
  const [balance, setBalance] = useState({
    available: 10000,
    margin: 2500,
    total: 12500
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'positions' | 'orders'>('positions');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch skins data
  useEffect(() => {
    const fetchSkins = async () => {
      try {
        const response = await fetch('/api/skins');
        const data = await response.json();
        const skinsArray = data.skins || data || [];
        
        if (Array.isArray(skinsArray)) {
          // Enhance with trading data
          const enhancedSkins = skinsArray.map((skin: any) => ({
            ...skin,
            priceChange24h: (Math.random() - 0.5) * skin.price * 0.1,
            priceChangePercent: (Math.random() - 0.5) * 10,
            volume24h: Math.floor(Math.random() * 1000) + 100,
            high24h: skin.price * (1 + Math.random() * 0.05),
            low24h: skin.price * (1 - Math.random() * 0.05)
          }));
          
          setSkins(enhancedSkins);
          if (enhancedSkins.length > 0 && !selectedSkin) {
            setSelectedSkin(enhancedSkins[0]);
            setOrderForm(prev => ({ ...prev, price: enhancedSkins[0].price }));
          }
        }
      } catch (error) {
        console.error('Error fetching skins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSkins();
  }, []);

  // Generate mock positions
  useEffect(() => {
    if (skins.length > 0) {
      const mockPositions: Position[] = [
        {
          id: '1',
          skinId: skins[0]?.id || '',
          skinName: skins[0]?.name || '',
          side: 'long',
          quantity: 2,
          entryPrice: skins[0]?.price * 0.95 || 1000,
          currentPrice: skins[0]?.price || 1000,
          pnl: (skins[0]?.price || 1000) * 2 * 0.05,
          pnlPercent: 5.2,
          margin: 500,
          timestamp: new Date(Date.now() - 3600000).toISOString()
        }
      ];
      setPositions(mockPositions);
    }
  }, [skins]);

  const filteredSkins = skins.filter(skin =>
    skin.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSkinSelect = (skin: Skin) => {
    setSelectedSkin(skin);
    setOrderForm(prev => ({ 
      ...prev, 
      price: skin.price,
      total: skin.price * prev.quantity
    }));
  };

  const toggleFavorite = (skinId: string) => {
    setFavorites(prev =>
      prev.includes(skinId)
        ? prev.filter(id => id !== skinId)
        : [...prev, skinId]
    );
  };

  const handleOrderFormChange = (field: keyof OrderFormData, value: any) => {
    setOrderForm(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-calculate total when quantity or price changes
      if (field === 'quantity' || field === 'price') {
        updated.total = updated.quantity * updated.price;
      }
      
      // Auto-calculate quantity when total changes
      if (field === 'total' && updated.price > 0) {
        updated.quantity = updated.total / updated.price;
      }
      
      return updated;
    });
  };

  const handlePlaceOrder = async () => {
    if (!selectedSkin || !session) return;
    
    try {
      console.log('Placing order:', {
        skin: selectedSkin.name,
        ...orderForm
      });

      const orderData = {
        skinId: selectedSkin.id,
        side: orderForm.side.toUpperCase(),
        orderType: orderForm.type.toUpperCase(),
        positionType: orderForm.side === 'buy' ? 'LONG' : 'SHORT',
        price: orderForm.type === 'limit' ? orderForm.price : undefined,
        quantity: orderForm.quantity,
        timeInForce: 'GTC'
      };

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const result = await response.json();
      console.log('Order placed successfully:', result);

      // Show success message
      alert(`Order placed successfully! Order ID: ${result.order.id}`);
      
      // Reset form
      setOrderForm(prev => ({
        ...prev,
        quantity: 1,
        total: prev.price
      }));

      // Trigger refresh of order book and trades
      handleOrderPlaced();

    } catch (error) {
      console.error('Error placing order:', error);
      alert(`Failed to place order: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleOrderPlaced = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181A20]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading trading interface...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181A20]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please Sign In</h2>
          <p className="text-gray-400 mb-6">You need to be signed in to access the trading interface.</p>
          <Link
            href="/api/auth/signin"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] text-white">
      {/* Header */}
      <div className="bg-[#181A20] border-b border-[#2A2D3A] px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            {selectedSkin && (
              <>
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-[#23262F] rounded-lg p-1">
                    <Image
                      src={formatSteamImageUrl(selectedSkin.iconPath)}
                      alt={selectedSkin.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = getFallbackImageUrl();
                      }}
                      unoptimized
                    />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">{selectedSkin.name}</h1>
                    <p className="text-sm text-gray-400">{selectedSkin.type}</p>
                  </div>
                  <button
                    onClick={() => toggleFavorite(selectedSkin.id)}
                    className="p-1 text-gray-400 hover:text-yellow-400 transition-colors"
                  >
                    {favorites.includes(selectedSkin.id) ? (
                      <StarSolidIcon className="h-5 w-5 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>

                <div className="flex items-center space-x-6 text-sm">
                  <div>
                    <span className="text-gray-400">Price: </span>
                    <span className="text-2xl font-bold">${selectedSkin.price.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Change: </span>
                    <span className={`font-semibold ${
                      selectedSkin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {selectedSkin.priceChangePercent >= 0 ? '+' : ''}
                      {selectedSkin.priceChangePercent.toFixed(2)}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Volume: </span>
                    <span className="font-semibold">{selectedSkin.volume24h}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h High: </span>
                    <span className="font-semibold">${selectedSkin.high24h.toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">24h Low: </span>
                    <span className="font-semibold">${selectedSkin.low24h.toFixed(2)}</span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-sm text-gray-400">Available Balance</div>
              <div className="text-lg font-bold text-green-400">${balance.available.toLocaleString()}</div>
            </div>
            <button className="p-2 text-gray-400 hover:text-white transition-colors">
              <Cog6ToothIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-80px)]">
        {/* Left Sidebar - Market List - DOUBLED WIDTH */}
        <div className="w-96 bg-[#181A20] border-r border-[#2A2D3A] flex flex-col">
          <div className="p-4 border-b border-[#2A2D3A]">
            <input
              type="text"
              placeholder="Search skins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3">
              {filteredSkins.map((skin) => (
                <button
                  key={skin.id}
                  onClick={() => handleSkinSelect(skin)}
                  className={`w-full p-3 rounded-lg mb-2 text-left transition-colors ${
                    selectedSkin?.id === skin.id
                      ? 'bg-blue-600/20 border border-blue-500'
                      : 'bg-[#23262F] hover:bg-[#2A2D3A] border border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-[#181A20] rounded-lg p-2 flex-shrink-0">
                      <Image
                        src={formatSteamImageUrl(skin.iconPath)}
                        alt={skin.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = getFallbackImageUrl();
                        }}
                        unoptimized
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white truncate text-base mb-1">{skin.name}</div>
                      <div className="text-sm text-gray-400 mb-2">{skin.type}</div>
                      <div className="flex items-center justify-between">
                        <div className="text-xl font-bold text-white">
                          ${skin.price.toLocaleString()}
                        </div>
                        <div className={`text-base font-semibold px-2 py-1 rounded ${
                          skin.priceChangePercent >= 0 
                            ? 'text-green-400 bg-green-900/20' 
                            : 'text-red-400 bg-red-900/20'
                        }`}>
                          {skin.priceChangePercent >= 0 ? '+' : ''}{skin.priceChangePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content Area - Adjusted proportions */}
        <div className="flex-1 flex">
          {/* Center Column - Chart and Order Book - REDUCED BY 25% */}
          <div className="flex-[3] flex flex-col">
            {/* Price Chart - Top Half */}
            <div className="h-1/2 bg-[#181A20] border-b border-[#2A2D3A]">
              <div className="h-full flex flex-col">
                {/* Chart Header */}
                <div className="flex items-center justify-between p-4 border-b border-[#2A2D3A]">
                  <div className="flex items-center space-x-4">
                    <h2 className="text-lg font-semibold">Price Chart</h2>
                    <div className="flex items-center space-x-1 bg-[#23262F] rounded-lg p-1">
                      {timeframes.map((tf) => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf)}
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
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <ChartBarIcon className="h-5 w-5" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-white transition-colors">
                      <InformationCircleIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Chart */}
                <div className="flex-1 p-4">
                  {selectedSkin && (
                    <TradingChart
                      skinId={selectedSkin.id}
                      timeframe={selectedTimeframe}
                      currentPrice={selectedSkin.price}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Order Book - Bottom Half */}
            <div className="h-1/2 bg-[#181A20] border-r border-[#2A2D3A]">
              {selectedSkin && (
                <OrderBook
                  skinId={selectedSkin.id}
                  currentPrice={selectedSkin.price}
                />
              )}
            </div>
          </div>

          {/* Right Column - Trading Form and Positions - EXPANDED BY 25% */}
          <div className="flex-[2] bg-[#181A20] flex flex-col">
            {/* Trading Form - Top Half - DOUBLED WIDTH */}
            <div className="h-1/2 border-b border-[#2A2D3A]">
              <div className="p-6 h-full flex flex-col">
                <h3 className="text-xl font-semibold text-white mb-6">Buy Sell Trade</h3>
                
                {/* Order Type Buttons - Top */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                  <button
                    onClick={() => handleOrderFormChange('type', 'limit')}
                    className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                      orderForm.type === 'limit'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
                    }`}
                  >
                    Limit
                  </button>
                  <button
                    onClick={() => handleOrderFormChange('type', 'market')}
                    className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                      orderForm.type === 'market'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
                    }`}
                  >
                    Market
                  </button>
                  <button
                    onClick={() => handleOrderFormChange('type', 'stop')}
                    className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                      orderForm.type === 'stop'
                        ? 'bg-yellow-600 text-white shadow-lg'
                        : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
                    }`}
                  >
                    Stop-Limit
                  </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto">
                  {/* Price (only for limit and stop orders) */}
                  {(orderForm.type === 'limit' || orderForm.type === 'stop') && (
                    <div>
                      <label className="block text-base text-gray-400 mb-3">Price</label>
                      <input
                        type="number"
                        value={orderForm.price}
                        onChange={(e) => handleOrderFormChange('price', Number(e.target.value))}
                        className="w-full px-4 py-3 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 text-base"
                        placeholder="0.00"
                        step="0.01"
                      />
                    </div>
                  )}

                  {/* Quantity */}
                  <div>
                    <label className="block text-base text-gray-400 mb-3">Quantity</label>
                    <input
                      type="number"
                      value={orderForm.quantity}
                      onChange={(e) => handleOrderFormChange('quantity', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="1"
                      min="1"
                    />
                  </div>

                  {/* Total */}
                  <div>
                    <label className="block text-base text-gray-400 mb-3">Total</label>
                    <input
                      type="number"
                      value={orderForm.total}
                      onChange={(e) => handleOrderFormChange('total', Number(e.target.value))}
                      className="w-full px-4 py-3 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 text-base"
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                {/* Buy/Long and Sell/Short Buttons - Bottom */}
                <div className="grid grid-cols-2 gap-3 pt-4">
                  <button
                    onClick={() => {
                      handleOrderFormChange('side', 'buy');
                      handlePlaceOrder();
                    }}
                    disabled={!selectedSkin || orderForm.quantity <= 0 || ((orderForm.type === 'limit' || orderForm.type === 'stop') && orderForm.price <= 0)}
                    className="py-4 px-4 rounded-lg font-semibold text-base transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy/Long
                  </button>
                  <button
                    onClick={() => {
                      handleOrderFormChange('side', 'sell');
                      handlePlaceOrder();
                    }}
                    disabled={!selectedSkin || orderForm.quantity <= 0 || ((orderForm.type === 'limit' || orderForm.type === 'stop') && orderForm.price <= 0)}
                    className="py-4 px-4 rounded-lg font-semibold text-base transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Sell/Short
                  </button>
                </div>
              </div>
            </div>

            {/* Positions and Orders Tabs - Bottom Half */}
            <div className="h-1/2 flex flex-col">
              {/* Tab Headers */}
              <div className="flex border-b border-[#2A2D3A]">
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'positions'
                      ? 'text-white border-b-2 border-blue-500 bg-[#23262F]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Open Positions
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'text-white border-b-2 border-blue-500 bg-[#23262F]'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Conditional Orders
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeTab === 'positions' ? (
                  <PositionManager
                    positions={positions}
                    onClosePosition={(positionId: string) => {
                      setPositions(prev => prev.filter(p => p.id !== positionId));
                    }}
                    onOrderPlaced={handleOrderPlaced}
                  />
                ) : (
                  <div className="h-full overflow-y-auto p-4">
                    <ConditionalOrdersList
                      skinId={selectedSkin?.id}
                      refreshTrigger={refreshTrigger}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 