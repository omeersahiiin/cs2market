'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
}

interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: string;
  total: number;
}

interface OrderBookProps {
  skinId: string;
  currentPrice?: number;
  onOrderPlace?: (result: any) => void;
  onMarketPriceUpdate?: (price: number) => void;
}

export default function OrderBook({ skinId, currentPrice = 0, onOrderPlace, onMarketPriceUpdate }: OrderBookProps) {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState<'orderbook' | 'trades'>('orderbook');
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [spread, setSpread] = useState(0);
  const [spreadPercent, setSpreadPercent] = useState(0);
  
  // Trading form state
  const [orderSide, setOrderSide] = useState<'BUY' | 'SELL'>('BUY');
  const [positionType, setPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [orderType, setOrderType] = useState<'MARKET' | 'LIMIT' | 'STOP'>('LIMIT');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(currentPrice);
  const [loading, setLoading] = useState(false);

  // Generate mock order book data
  useEffect(() => {
    const generateOrderBook = () => {
      if (!currentPrice || currentPrice <= 0) return;
      
      const bidOrders: OrderBookEntry[] = [];
      const askOrders: OrderBookEntry[] = [];
      
      // Generate bids (buy orders) - prices below current price
      for (let i = 0; i < 15; i++) {
        const price = currentPrice - (i + 1) * (currentPrice * 0.001); // 0.1% steps down
        const quantity = Math.floor(Math.random() * 10) + 1;
        const total = price * quantity;
        
        bidOrders.push({ price, quantity, total });
      }
      
      // Generate asks (sell orders) - prices above current price
      for (let i = 0; i < 15; i++) {
        const price = currentPrice + (i + 1) * (currentPrice * 0.001); // 0.1% steps up
        const quantity = Math.floor(Math.random() * 10) + 1;
        const total = price * quantity;
        
        askOrders.push({ price, quantity, total });
      }
      
      // Calculate spread
      const bestBid = bidOrders[0]?.price || 0;
      const bestAsk = askOrders[0]?.price || 0;
      const spreadValue = bestAsk - bestBid;
      const spreadPercentValue = currentPrice > 0 ? (spreadValue / currentPrice) * 100 : 0;
      
      setBids(bidOrders);
      setAsks(askOrders);
      setSpread(spreadValue);
      setSpreadPercent(spreadPercentValue);
      
      // Update market price if callback provided
      if (onMarketPriceUpdate && currentPrice > 0) {
        onMarketPriceUpdate(currentPrice);
      }
    };

    generateOrderBook();
    
    // Update order book every 5 seconds
    const interval = setInterval(generateOrderBook, 5000);
    return () => clearInterval(interval);
  }, [skinId, currentPrice, onMarketPriceUpdate]);

  // Generate mock trades data
  useEffect(() => {
    const generateTrades = () => {
      const mockTrades: Trade[] = [];
      const basePrice = currentPrice || 1000;
      
      for (let i = 0; i < 21; i++) {
        const timestamp = new Date(Date.now() - i * 60000); // 1 minute intervals
        const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
        const price = basePrice * (1 + priceVariation);
        const quantity = Math.floor(Math.random() * 5) + 1;
        const side = Math.random() > 0.5 ? 'buy' : 'sell';
        
        mockTrades.push({
          id: `trade-${i}`,
          price,
          quantity,
          side,
          timestamp: timestamp.toISOString(),
          total: price * quantity
        });
      }
      
      setTrades(mockTrades);
    };

    generateTrades();
    
    // Update trades every 10 seconds
    const interval = setInterval(() => {
      // Add a new trade at the beginning
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: (currentPrice || 1000) * (1 + (Math.random() - 0.5) * 0.02),
        quantity: Math.floor(Math.random() * 5) + 1,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date().toISOString(),
        total: 0
      };
      newTrade.total = newTrade.price * newTrade.quantity;
      
      setTrades(prev => [newTrade, ...prev.slice(0, 20)]);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [skinId, currentPrice]);

  // Update price when currentPrice changes
  useEffect(() => {
    if (currentPrice > 0) {
      setPrice(currentPrice);
    }
  }, [currentPrice]);

  const handlePlaceOrder = async () => {
    if (!session || !onOrderPlace) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          skinId,
          side: orderSide,
          orderType,
          positionType,
          price: orderType === 'MARKET' ? currentPrice : price,
          quantity,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to place order');
      }

      const result = await response.json();
      onOrderPlace(result);
      
      // Reset form
      setQuantity(1);
      setPrice(currentPrice);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => price.toFixed(2);
  const formatQuantity = (quantity: number) => quantity.toString();
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Trading Form - Moved to TOP and INCREASED HEIGHT */}
      {onOrderPlace && session && (
        <div className="p-6 border-b border-[#2A2D3A] bg-[#1A1C23] min-h-[400px]">
          <h4 className="text-xl font-semibold text-white mb-6">Place Order</h4>
          
          {/* Order Type Buttons - Top */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <button
              onClick={() => setOrderType('LIMIT')}
              className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                orderType === 'LIMIT'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
              }`}
            >
              Limit
            </button>
            <button
              onClick={() => setOrderType('MARKET')}
              className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                orderType === 'MARKET'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
              }`}
            >
              Market
            </button>
            <button
              onClick={() => setOrderType('STOP')}
              className={`py-3 px-3 rounded-lg font-medium text-sm transition-colors ${
                orderType === 'STOP'
                  ? 'bg-yellow-600 text-white shadow-lg'
                  : 'bg-[#23262F] text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
              }`}
            >
              Stop-Limit
            </button>
          </div>

          <div className="space-y-5">
            {/* Price (only for limit and stop orders) */}
            {(orderType === 'LIMIT' || orderType === 'STOP') && (
              <div>
                <label className="block text-base text-gray-400 mb-3">Price</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
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
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full px-4 py-3 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 text-base"
                placeholder="1"
                min="1"
              />
            </div>

            {/* Buy/Long and Sell/Short Buttons - Bottom */}
            <div className="grid grid-cols-2 gap-3 pt-4">
              <button
                onClick={() => {
                  setOrderSide('BUY');
                  setPositionType('LONG');
                  handlePlaceOrder();
                }}
                disabled={loading || quantity <= 0 || ((orderType === 'LIMIT' || orderType === 'STOP') && price <= 0)}
                className="py-4 px-4 rounded-lg font-semibold text-base transition-colors bg-green-600 hover:bg-green-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && orderSide === 'BUY' ? 'Placing...' : 'Buy/Long'}
              </button>
              <button
                onClick={() => {
                  setOrderSide('SELL');
                  setPositionType('SHORT');
                  handlePlaceOrder();
                }}
                disabled={loading || quantity <= 0 || ((orderType === 'LIMIT' || orderType === 'STOP') && price <= 0)}
                className="py-4 px-4 rounded-lg font-semibold text-base transition-colors bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading && orderSide === 'SELL' ? 'Placing...' : 'Sell/Short'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with Tabs */}
      <div className="p-4 border-b border-[#2A2D3A]">
        <div className="flex items-center space-x-4 mb-2">
          <button
            onClick={() => setActiveTab('orderbook')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orderbook'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Order Book
          </button>
          <button
            onClick={() => setActiveTab('trades')}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'trades'
                ? 'bg-blue-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Recent Trades
          </button>
        </div>
        
        {activeTab === 'orderbook' && (
          <div className="flex items-center justify-between text-sm">
            <div>
              <span className="text-gray-400">Spread: </span>
              <span className="text-white">${spread.toFixed(2)}</span>
              <span className="text-gray-400 ml-2">({spreadPercent.toFixed(3)}%)</span>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'orderbook' ? (
          <>
            {/* Column Headers */}
            <div className="px-4 py-2 border-b border-[#2A2D3A] bg-[#23262F]">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center text-green-400 font-medium text-sm">
                  BIDS (BUY)
                </div>
                <div className="text-center text-red-400 font-medium text-sm">
                  ASKS (SELL)
                </div>
              </div>
            </div>

            {/* Total Bids and Asks Statistics */}
            <div className="px-4 py-3 border-b border-[#2A2D3A] bg-[#1A1C23]">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total Bids</div>
                  <div className="text-green-400 font-semibold text-sm">
                    {bids.reduce((sum, bid) => sum + bid.quantity, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Total Asks</div>
                  <div className="text-red-400 font-semibold text-sm">
                    {asks.reduce((sum, ask) => sum + ask.quantity, 0)}
                  </div>
                </div>
              </div>
            </div>

            {/* Sub-headers for Price/Quantity/Total */}
            <div className="px-4 py-1 border-b border-[#2A2D3A] bg-[#1A1C23]">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium">
                  <div className="text-left">Price</div>
                  <div className="text-center">Qty</div>
                  <div className="text-right">Total</div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs text-gray-400 font-medium">
                  <div className="text-left">Price</div>
                  <div className="text-center">Qty</div>
                  <div className="text-right">Total</div>
                </div>
              </div>
            </div>

            {/* Order Book Data - Two Columns */}
            <div className="flex-1 overflow-hidden">
              <div className="h-full px-4 py-1">
                <div className="grid grid-cols-2 gap-4 h-full">
                  {/* Left Column - Bids (Buy Orders) */}
                  <div className="overflow-y-auto">
                    {bids.map((bid, index) => (
                      <div
                        key={`bid-${index}`}
                        className="relative grid grid-cols-3 gap-2 py-1 text-sm hover:bg-green-900/10 transition-colors group"
                      >
                        <div className="text-green-400 font-mono text-left">{formatPrice(bid.price)}</div>
                        <div className="text-center text-white font-mono">{formatQuantity(bid.quantity)}</div>
                        <div className="text-right text-gray-300 font-mono">{bid.total.toFixed(2)}</div>
                        
                        {/* Background bar showing relative volume */}
                        <div 
                          className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"
                          style={{ 
                            width: `${Math.min((bid.quantity / 10) * 100, 100)}%`,
                            right: 0
                          }}
                        />
                      </div>
                    ))}
                  </div>

                  {/* Right Column - Asks (Sell Orders) */}
                  <div className="overflow-y-auto">
                    {asks.map((ask, index) => (
                      <div
                        key={`ask-${index}`}
                        className="relative grid grid-cols-3 gap-2 py-1 text-sm hover:bg-red-900/10 transition-colors group"
                      >
                        <div className="text-red-400 font-mono text-left">{formatPrice(ask.price)}</div>
                        <div className="text-center text-white font-mono">{formatQuantity(ask.quantity)}</div>
                        <div className="text-right text-gray-300 font-mono">{ask.total.toFixed(2)}</div>
                        
                        {/* Background bar showing relative volume */}
                        <div 
                          className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"
                          style={{ 
                            width: `${Math.min((ask.quantity / 10) * 100, 100)}%`,
                            right: 0
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Current Price - Bottom */}
            <div className="px-4 py-3 bg-[#23262F] border-t border-[#2A2D3A]">
              <div className="flex items-center justify-between">
                <div className="text-lg font-bold text-white">
                  ${(currentPrice || 0).toLocaleString()}
                </div>
                <div className="text-sm text-gray-400">
                  Last Price
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Recent Trades */}
            
            {/* Trading Statistics - Top Section */}
            <div className="px-4 py-3 border-b border-[#2A2D3A] bg-[#1A1C23]">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xs text-gray-400 mb-1">Volume (24h)</div>
                  <div className="text-white font-semibold text-sm">
                    {trades.reduce((sum, trade) => sum + trade.quantity, 0)}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Trades (24h)</div>
                  <div className="text-white font-semibold text-sm">
                    {trades.length}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-400 mb-1">Avg Price</div>
                  <div className="text-white font-semibold text-sm">
                    ${trades.length > 0 ? (trades.reduce((sum, trade) => sum + trade.price, 0) / trades.length).toFixed(2) : '0.00'}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-4 py-2 border-b border-[#2A2D3A] bg-[#23262F]">
              <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 font-medium">
                <div className="text-left">Price ($)</div>
                <div className="text-center">Quantity</div>
                <div className="text-center">Total ($)</div>
                <div className="text-right">Time</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              <div className="px-4 py-1">
                {trades.map((trade, index) => (
                  <div
                    key={trade.id}
                    className={`grid grid-cols-4 gap-4 py-2 text-sm hover:bg-gray-800/20 transition-colors ${
                      index === 0 ? 'bg-blue-900/10' : ''
                    }`}
                  >
                    <div className={`font-mono font-medium ${
                      trade.side === 'buy' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatPrice(trade.price)}
                    </div>
                    <div className="text-center text-white font-mono">
                      {trade.quantity}
                    </div>
                    <div className="text-center text-gray-300 font-mono">
                      {trade.total.toFixed(2)}
                    </div>
                    <div className="text-right text-gray-400 text-xs">
                      {formatTime(trade.timestamp)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
} 