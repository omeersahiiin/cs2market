'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { getSteamIconUrl, getFallbackImageUrl } from '../../../lib/utils';
import PriceChart from '../../../components/PriceChart';
import OrderBook from '../../../components/OrderBook';
import FloatAnalysis from '../../../components/FloatAnalysis';

interface Skin {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  wear: string;
  iconPath: string;
}

interface PriceData {
  platform: string;
  price: number;
  currency: string;
  timestamp: Date;
}

interface PriceDetails {
  tradingPrice: {
    averageMarketPrice: number;
    lastUpdated: Date;
  };
  wearAnalysis: {
    currentWear: {
      wear: string;
      price: number;
      platforms: PriceData[];
      lastUpdated: Date;
    };
    allWearPrices: Record<string, number>;
    priceRange: {
      lowest: number;
      highest: number;
      spread: number;
      currentWearRank: number;
    };
  };
}

interface Position {
  id: string;
  skinId: string;
  userId: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  size: number;
  margin: number;
  createdAt: Date;
  closedAt?: Date | null;
  exitPrice?: number | null;
}

interface Order {
  id: string;
  userId: string;
  skinId: string;
  side: 'BUY' | 'SELL';
  orderType: 'MARKET' | 'LIMIT';
  positionType: 'LONG' | 'SHORT';
  price: number;
  quantity: number;
  filledQty: number;
  remainingQty: number;
  status: string;
  createdAt: Date;
  skin: {
    name: string;
  };
}

export default function SkinDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { data: session } = useSession();
  const [skin, setSkin] = useState<Skin | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);
  const [positions, setPositions] = useState<Position[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [positionLoading, setPositionLoading] = useState(false);
  const [closingOrderIds, setClosingOrderIds] = useState<Set<string>>(new Set());
  const [positionSize, setPositionSize] = useState(1);
  const [entryPrice, setEntryPrice] = useState<number | ''>('');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [priceDetails, setPriceDetails] = useState<PriceDetails | null>(null);
  const [marketPrice, setMarketPrice] = useState<number>(0);
  const [closeOrderType, setCloseOrderType] = useState<'MARKET' | 'LIMIT'>('MARKET');
  const [closeLimitPrice, setCloseLimitPrice] = useState<string>('');
  const [selectedWearForChart, setSelectedWearForChart] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'positions' | 'orders'>('positions');

  const fetchSkinDetails = useCallback(async () => {
    try {
      const response = await fetch(`/api/skins/${params.id}`);
      if (!response.ok) {
        throw new Error('Failed to fetch skin details');
      }
      const data = await response.json();
      setSkin(data);
      
      // Set initial wear for chart only if not already set
      if (!selectedWearForChart) {
        setSelectedWearForChart(''); // Start with average trading price
      }
      
      // Fetch detailed price information
      const priceResponse = await fetch(`/api/skins/${params.id}/price-details`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setPriceDetails(priceData.priceDetails);
      }
          } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
      setLoading(false);
    }
  }, [params.id, selectedWearForChart]);

  const fetchPriceDetails = useCallback(async () => {
    try {
      const priceResponse = await fetch(`/api/skins/${params.id}/price-details`);
      if (priceResponse.ok) {
        const priceData = await priceResponse.json();
        setPriceDetails(priceData.priceDetails);
      }
    } catch (err) {
      console.error('Error fetching price details:', err);
    }
  }, [params.id]);

  const fetchPositions = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/positions/${params.id}`);
      if (response.status === 404) {
        setPositions([]);
        return;
      }
      if (!response.ok) {
        throw new Error('Failed to fetch positions');
      }
      const data = await response.json();
      setPositions(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching positions:', err);
      setPositions([]);
    }
  }, [params.id, session?.user?.id]);

  const fetchUserOrders = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      const response = await fetch(`/api/orders?skinId=${params.id}&status=PENDING,PARTIAL`);
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      const data = await response.json();
      setUserOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setUserOrders([]);
    }
  }, [params.id, session?.user?.id]);

  useEffect(() => {
    fetchSkinDetails();
    fetchPositions();
    fetchUserOrders();
  }, [fetchSkinDetails, fetchPositions, fetchUserOrders]);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const setupSSE = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/skins/price-updates');

      eventSource.onmessage = (event) => {
        const priceUpdates = JSON.parse(event.data);
        
        fetchPriceDetails();
        
        if (priceUpdates[params.id]) {
          setSkin(prev => prev ? { ...prev, price: priceUpdates[params.id] } : null);
        }
      };

      eventSource.onerror = () => {
        eventSource?.close();
        
        const delay = Math.min(1000 * Math.pow(2, reconnectAttempt), 30000);
        reconnectTimeout = setTimeout(() => {
          setReconnectAttempt(prev => prev + 1);
          setupSSE();
        }, delay);
      };

      eventSource.onopen = () => {
        setReconnectAttempt(0);
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
  }, [params.id, reconnectAttempt, fetchPriceDetails]);

  const openPosition = async (type: 'LONG' | 'SHORT') => {
    if (!session?.user?.id || !skin) return;
    
    if (positionSize <= 0) {
      setError('Position size must be greater than 0');
      return;
    }

    let finalEntryPrice = skin.price;
    if (orderType === 'LIMIT') {
      if (!entryPrice || entryPrice <= 0) {
        setError('Entry price must be greater than 0');
        return;
      }
      finalEntryPrice = Number(entryPrice);
    }
    
    setPositionLoading(true);
    setError(null);
    
    try {
      console.log('Placing order from skins page:', {
        skinId: skin.id,
        side: type === 'LONG' ? 'BUY' : 'SELL',
        orderType,
        positionType: type,
        price: finalEntryPrice,
        quantity: positionSize,
      });

      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skinId: skin.id,
          side: type === 'LONG' ? 'BUY' : 'SELL',
          orderType,
          positionType: type,
          price: orderType === 'MARKET' ? undefined : finalEntryPrice,
          quantity: positionSize,
          timeInForce: 'GTC'
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to place order');
      }

      const result = await response.json();
      console.log('Order placed successfully from skins page:', result);
      
      // Show success message
      alert(`Order placed successfully! Order ID: ${result.order.id}`);
      
      // Refresh data
      await fetchPositions();
      await fetchUserOrders();
      router.refresh();
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1000);
      
    } catch (err) {
      console.error('Error placing order from skins page:', err);
      setError(err instanceof Error ? err.message : 'Failed to place order');
      alert(`Failed to place order: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setPositionLoading(false);
    }
  };

  const handleClosePosition = async (positionId: string, orderType: 'MARKET' | 'LIMIT' = 'MARKET', price?: number) => {
    const position = positions.find(p => p.id === positionId);
    if (!position || positionLoading) return;
    setPositionLoading(true);
    setError(null);
    try {
      const requestBody = {
        orderType,
        ...(orderType === 'LIMIT' && price && { price })
      };
      
      const res = await fetch(`/api/positions/${position.skinId}/close-order`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to close position');
      }
      
      const result = await res.json();
      
      if (result.closingOrder && result.matchResult.fills.length === 0) {
        setClosingOrderIds(prev => new Set(Array.from(prev).concat(result.closingOrder.id)));
        
        setTimeout(() => {
          setClosingOrderIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(result.closingOrder.id);
            return newSet;
          });
        }, 30000);
      } else if (result.matchResult.fills.length > 0) {
        if (result.closingOrder) {
          setClosingOrderIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(result.closingOrder.id);
            return newSet;
          });
        }
      }
      
      await fetchPositions();
      await fetchUserOrders();
      await fetchSkinDetails();
      
      alert(result.message);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close position');
    } finally {
      setPositionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    );
  }

  if (!skin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-500">Skin not found.</div>
      </div>
    );
  }

  // Use average market price for trading (unified liquidity)
  const currentPrice = priceDetails?.tradingPrice?.averageMarketPrice || marketPrice || skin.price;
  
  // Calculate total P&L for all positions
  const totalPnL = positions.reduce((total, position) => {
    const priceForPnL = position.exitPrice || currentPrice;
    const positionPnL = (priceForPnL - position.entryPrice) * position.size * (position.type === 'LONG' ? 1 : -1);
    return total + positionPnL;
  }, 0);

  return (
    <div className="min-h-screen bg-[#181A20] py-4 px-10">
      <div className="max-w-[2200px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Left Column - Skin Details & Trading Info */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#23262F] rounded-2xl shadow-lg overflow-hidden">
              <div className="relative h-96 bg-[#1A1C23]">
                <Image
                  src={getSteamIconUrl(skin.iconPath)}
                  alt={skin.name}
                  fill
                  className="object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = getFallbackImageUrl();
                  }}
                  priority
                />
              </div>
              <div className="p-8">
                <h1 className="text-4xl font-bold mb-6 text-white">{skin.name}</h1>
                <div className="space-y-5">
                  <div>
                    <p className="text-gray-400 text-lg">Type</p>
                    <p className="font-semibold text-white text-xl">{skin.type}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-lg">Rarity</p>
                    <p className="font-semibold text-white text-xl">{skin.rarity}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-lg">Reference Wear</p>
                    <p className="font-semibold text-white text-xl">{skin.wear}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-lg">Trading Price</p>
                    <p className="font-semibold text-blue-400 text-3xl">
                      ${currentPrice.toFixed(2)}
                    </p>
                    <p className="text-base text-gray-500">Average across all wears</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Price Information */}
            {priceDetails ? (
              <div className="bg-[#23262F] p-8 rounded-2xl shadow-lg">
                <h3 className="font-semibold mb-6 text-white text-2xl">Trading Information</h3>
                
                {/* Unified Trading Price */}
                <div className="mb-6 p-6 bg-[#1A1C23] rounded-lg border border-green-500">
                  <h4 className="font-medium mb-4 text-green-400 text-lg">Unified Market Price</h4>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-green-400">
                      ${priceDetails.tradingPrice.averageMarketPrice.toFixed(2)}
                    </p>
                    <p className="text-base text-gray-400 mt-3">Average across all wear conditions</p>
                    <p className="text-sm text-gray-500 mt-2">
                      Last updated: {new Date(priceDetails.tradingPrice.lastUpdated).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="bg-blue-900/20 border border-blue-500 rounded-lg p-5">
                  <p className="text-blue-400 text-base">
                    <strong>💡 Liquidity Focus:</strong> All trades use the unified average price to maximize order book liquidity. 
                    Individual wear prices are for analysis only.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#23262F] p-8 rounded-2xl shadow-lg">
                <h3 className="font-semibold mb-6 text-white text-2xl">Trading Information</h3>
                <div className="flex items-center justify-center p-10">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 mx-auto mb-3"></div>
                    <p className="text-gray-400 text-lg">Loading...</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Middle Column - Price Chart & Analysis */}
          <div className="lg:col-span-2 space-y-4">
            {/* Dynamic Price Chart */}
            <div className="bg-[#23262F] rounded-2xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-white">Price Chart</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-400">View wear:</span>
                  <select
                    value={selectedWearForChart}
                    onChange={(e) => {
                      setSelectedWearForChart(e.target.value);
                    }}
                    className="bg-[#1A1C23] text-white border border-gray-600 rounded px-3 py-1 text-sm"
                  >
                    <option value="">Average (Trading Price)</option>
                    {priceDetails?.wearAnalysis?.allWearPrices ? 
                      Object.keys(priceDetails.wearAnalysis.allWearPrices).map(wear => (
                        <option key={wear} value={wear}>{wear}</option>
                      )) : (
                        // Fallback static options for testing
                        <>
                          <option value="Factory New">Factory New</option>
                          <option value="Minimal Wear">Minimal Wear</option>
                          <option value="Field-Tested">Field-Tested</option>
                          <option value="Well-Worn">Well-Worn</option>
                          <option value="Battle-Scarred">Battle-Scarred</option>
                        </>
                      )
                    }
                  </select>
                </div>
              </div>
              <PriceChart 
                skinId={skin.id} 
                currentPrice={selectedWearForChart ? 
                  priceDetails?.wearAnalysis?.allWearPrices[selectedWearForChart] || currentPrice : 
                  currentPrice
                }
                selectedWear={selectedWearForChart}
              />
            </div>

            {/* Wear Analysis Section - REDUCED HEIGHT */}
            {priceDetails ? (
              <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
                <h3 className="font-semibold mb-2 text-white">Wear Price Analysis</h3>
                
                {/* All Wear Prices - COMPACT */}
                <div className="mb-3">
                  <h4 className="font-medium mb-2 text-white text-sm">Individual Wear Conditions:</h4>
                  <div className="space-y-1">
                    {Object.entries(priceDetails.wearAnalysis.allWearPrices)
                      .sort(([,a], [,b]) => (b as number) - (a as number))
                      .map(([wear, price]) => (
                      <div 
                        key={wear} 
                        className={`flex justify-between items-center p-2 rounded cursor-pointer transition-colors ${
                          selectedWearForChart === wear ? 'bg-blue-900/30 border border-blue-500' : 
                          wear === skin.wear ? 'bg-gray-700/30 border border-gray-500' : 'bg-[#1A1C23] hover:bg-gray-700/20'
                        }`}
                        onClick={() => {
                          setSelectedWearForChart(wear);
                        }}
                      >
                        <span className={`font-medium text-sm ${
                          selectedWearForChart === wear ? 'text-blue-400' : 
                          wear === skin.wear ? 'text-gray-300' : 'text-white'
                        }`}>
                          {wear} 
                          {wear === skin.wear && ' (Reference)'}
                          {selectedWearForChart === wear && ' (Chart)'}
                        </span>
                        <span className="text-green-400 font-semibold text-sm">${(price as number).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Price Range Info - COMPACT */}
                <div className="p-2 bg-[#1A1C23] rounded-lg">
                  <h4 className="font-medium mb-2 text-white text-sm">Price Range Analysis:</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-xs text-gray-400">Lowest</p>
                      <p className="text-sm font-semibold text-red-400">${priceDetails.wearAnalysis.priceRange.lowest.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Spread</p>
                      <p className="text-sm font-semibold text-yellow-400">{priceDetails.wearAnalysis.priceRange.spread.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400">Highest</p>
                      <p className="text-sm font-semibold text-green-400">${priceDetails.wearAnalysis.priceRange.highest.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
                <h3 className="font-semibold mb-2 text-white">Wear Price Analysis</h3>
                <div className="flex items-center justify-center p-6">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-400 text-sm">Loading wear analysis...</p>
                  </div>
                </div>
              </div>
            )}

            {/* Float Analysis - REDUCED HEIGHT */}
            <div className="h-auto">
              <FloatAnalysis 
                skinId={skin.id}
                skinName={skin.name}
              />
            </div>
          </div>

          {/* Right Column - Order Book */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Book */}
            <OrderBook 
              skinId={skin.id} 
              currentPrice={currentPrice}
              onOrderPlace={(result) => {
                fetchPositions();
                fetchUserOrders();
                fetchSkinDetails();
              }}
              onMarketPriceUpdate={(price) => {
                setMarketPrice(price);
              }}
            />
          </div>
        </div>

        {/* Trading Overview Section - EXPANDED UPWARD */}
        {session && (positions.length > 0 || userOrders.length > 0) && (
          <div className="mt-4 bg-[#23262F] p-8 rounded-2xl shadow-lg min-h-[700px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-semibold text-white">
                Trading Overview
              </h3>
              
              {/* Tab Switcher */}
              <div className="flex bg-[#1A1C23] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('positions')}
                  className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'positions'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Positions ({positions.length})
                </button>
                <button
                  onClick={() => setActiveTab('orders')}
                  className={`px-6 py-3 rounded-md text-base font-medium transition-colors ${
                    activeTab === 'orders'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Orders ({userOrders.length})
                </button>
              </div>
            </div>

            {/* Positions Tab */}
            {activeTab === 'positions' && positions.length > 0 && (
              <div className="min-h-[500px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-base">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">Symbol</th>
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">Size</th>
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">Entry Price</th>
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">Mark Price</th>
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">PNL (ROE%)</th>
                        <th className="text-left py-4 px-3 text-gray-400 font-medium">Margin</th>
                        <th className="text-right py-4 px-3 text-gray-400 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {positions.map((position) => {
                        const priceForPnL = position.exitPrice || currentPrice;
                        const positionPnL = (priceForPnL - position.entryPrice) * position.size * (position.type === 'LONG' ? 1 : -1);
                        const roe = ((positionPnL / position.margin) * 100);
                        
                        // Find any closing orders for this position
                        const closingOrders = userOrders.filter(order => {
                          const isClosingOrder = (position.type === 'LONG' && order.side === 'SELL') ||
                                               (position.type === 'SHORT' && order.side === 'BUY');
                          return isClosingOrder;
                        });
                        
                        const hasClosingOrder = closingOrders.length > 0;
                        const totalClosingQty = closingOrders.reduce((sum, order) => sum + order.remainingQty, 0);
                        const totalFilledQty = closingOrders.reduce((sum, order) => sum + (order.quantity - order.remainingQty), 0);
                        
                        return (
                          <tr key={position.id} className="border-b border-gray-700/50 hover:bg-[#1A1C23]">
                            <td className="py-4 px-3">
                              <div className="flex items-center space-x-2">
                                <span className={`px-3 py-1 rounded text-sm font-medium ${
                                  position.type === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                                }`}>
                                  {position.type}
                                </span>
                                <span className="text-white font-medium text-base">{skin.name.split(' | ')[0]}</span>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <div className="text-white font-medium text-base">
                                {position.size}
                                {hasClosingOrder && (
                                  <div className="text-sm text-yellow-400 mt-1">
                                    {totalClosingQty} closing
                                    {totalFilledQty > 0 && (
                                      <span className="text-green-400 ml-1">
                                        ({totalFilledQty} filled)
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className="text-white font-medium text-base">${position.entryPrice.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-3">
                              <span className="text-white font-medium text-base">${priceForPnL.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-3">
                              <div className={`font-medium text-base ${positionPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ${positionPnL.toFixed(2)}
                                <div className="text-sm">
                                  ({roe >= 0 ? '+' : ''}{roe.toFixed(2)}%)
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-3">
                              <span className="text-white font-medium text-base">${position.margin.toFixed(2)}</span>
                            </td>
                            <td className="py-4 px-3 text-right">
                              <div className="flex justify-end space-x-3">
                                {hasClosingOrder ? (
                                  <>
                                    <button
                                      className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 font-medium"
                                      onClick={() => {
                                        closingOrders.forEach(async (order) => {
                                          try {
                                            await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
                                          } catch (err) {
                                            console.error('Failed to cancel order:', err);
                                          }
                                        });
                                        setTimeout(() => {
                                          fetchUserOrders();
                                          fetchPositions();
                                        }, 500);
                                      }}
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 font-medium"
                                      onClick={() => handleClosePosition(position.id, 'MARKET')}
                                      disabled={positionLoading}
                                    >
                                      Market Close
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      className="px-4 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50 font-medium"
                                      onClick={() => handleClosePosition(position.id, 'MARKET')}
                                      disabled={positionLoading}
                                    >
                                      Market Close
                                    </button>
                                    <button
                                      className="px-4 py-2 bg-orange-500 text-white rounded text-sm hover:bg-orange-600 disabled:opacity-50 font-medium"
                                      onClick={() => {
                                        const price = prompt(`Enter limit price (current: $${currentPrice.toFixed(2)}):`);
                                        if (price && parseFloat(price) > 0) {
                                          handleClosePosition(position.id, 'LIMIT', parseFloat(price));
                                        }
                                      }}
                                      disabled={positionLoading}
                                    >
                                      Limit Close
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                {/* Summary Row */}
                <div className="mt-6 p-4 bg-[#1A1C23] rounded-lg border border-gray-600">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-lg">Total Unrealized PNL:</span>
                    <span className={`font-bold text-xl ${totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      ${totalPnL.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && userOrders.length > 0 && (
              <div className="overflow-x-auto min-h-[500px]">
                <table className="w-full text-base">
                  <thead>
                    <tr className="border-b border-gray-600">
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Time</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Symbol</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Type</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Side</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Amount</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Price</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Filled</th>
                      <th className="text-left py-4 px-3 text-gray-400 font-medium">Status</th>
                      <th className="text-right py-4 px-3 text-gray-400 font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userOrders.map((order) => {
                      const fillPercentage = ((order.quantity - order.remainingQty) / order.quantity) * 100;
                      const isClosingOrder = positions.some(pos => 
                        (pos.type === 'LONG' && order.side === 'SELL') ||
                        (pos.type === 'SHORT' && order.side === 'BUY')
                      );
                      
                      return (
                        <tr key={order.id} className="border-b border-gray-700/50 hover:bg-[#1A1C23]">
                          <td className="py-4 px-3">
                            <span className="text-gray-400 text-xs">
                              {new Date(order.createdAt).toLocaleTimeString()}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                order.positionType === 'LONG' ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'
                              }`}>
                                {order.positionType}
                              </span>
                              <span className="text-white font-medium">{skin.name.split(' | ')[0]}</span>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <span className="text-white font-medium">{order.orderType}</span>
                            {isClosingOrder && (
                              <div className="text-xs text-yellow-400">Close</div>
                            )}
                          </td>
                          <td className="py-4 px-3">
                            <span className={`font-medium ${
                              order.side === 'BUY' ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {order.side}
                            </span>
                          </td>
                          <td className="py-4 px-3">
                            <span className="text-white font-medium">{order.quantity}</span>
                          </td>
                          <td className="py-4 px-3">
                            <span className="text-white font-medium">${order.price.toFixed(2)}</span>
                          </td>
                          <td className="py-4 px-3">
                            <div className="text-white font-medium">
                              {(order.quantity - order.remainingQty).toFixed(1)}/{order.quantity}
                              <div className="text-xs text-gray-400">
                                {fillPercentage.toFixed(1)}%
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              order.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' :
                              order.status === 'PARTIAL' ? 'bg-blue-900/30 text-blue-400' :
                              order.status === 'FILLED' ? 'bg-green-900/30 text-green-400' :
                              'bg-gray-900/30 text-gray-400'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                          <td className="py-4 px-3 text-right">
                            <button
                              className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700"
                              onClick={async () => {
                                try {
                                  const response = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' });
                                  if (response.ok) {
                                    fetchUserOrders();
                                    alert('Order cancelled successfully');
                                  }
                                } catch (err) {
                                  alert('Failed to cancel order');
                                }
                              }}
                            >
                              Cancel
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Empty State Messages */}
            {activeTab === 'positions' && positions.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No open positions</p>
              </div>
            )}

            {activeTab === 'orders' && userOrders.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-400">No open orders</p>
              </div>
            )}
          </div>
        )}

        {/* No Positions/Orders Message */}
        {session && positions.length === 0 && userOrders.length === 0 && (
          <div className="mt-6 bg-[#23262F] p-6 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold text-white mb-4">No Open Positions or Orders</h3>
            <p className="text-gray-400">You don't have any open positions or orders for this skin. Use the order book to place trades.</p>
          </div>
        )}
      </div>
    </div>
  );
} 