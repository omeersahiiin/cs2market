'use client';

import React, { useState, useEffect } from 'react';

interface Trade {
  id: string;
  price: number;
  quantity: number;
  side: 'buy' | 'sell';
  timestamp: string;
  total: number;
}

interface TradeHistoryProps {
  skinId: string;
}

export default function TradeHistory({ skinId }: TradeHistoryProps) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  // Generate mock trade history
  useEffect(() => {
    const generateTrades = () => {
      const mockTrades: Trade[] = [];
      const basePrice = 1000; // Base price for mock data
      
      for (let i = 0; i < 50; i++) {
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
      setLoading(false);
    };

    generateTrades();
    
    // Update trades every 10 seconds
    const interval = setInterval(() => {
      // Add a new trade at the beginning
      const newTrade: Trade = {
        id: `trade-${Date.now()}`,
        price: 1000 * (1 + (Math.random() - 0.5) * 0.02),
        quantity: Math.floor(Math.random() * 5) + 1,
        side: Math.random() > 0.5 ? 'buy' : 'sell',
        timestamp: new Date().toISOString(),
        total: 0
      };
      newTrade.total = newTrade.price * newTrade.quantity;
      
      setTrades(prev => [newTrade, ...prev.slice(0, 49)]);
    }, 10000);
    
    return () => clearInterval(interval);
  }, [skinId]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatPrice = (price: number) => (price || 0).toFixed(2);

  if (loading) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-[#2A2D3A]">
          <h3 className="text-lg font-semibold text-white">Recent Trades</h3>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-[#2A2D3A]">
        <h3 className="text-lg font-semibold text-white mb-2">Recent Trades</h3>
        <div className="text-sm text-gray-400">
          Last {trades.length} trades
        </div>
      </div>

      {/* Column Headers */}
      <div className="px-4 py-2 border-b border-[#2A2D3A] bg-[#23262F]">
        <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 font-medium">
          <div className="text-left">Price ($)</div>
          <div className="text-center">Quantity</div>
          <div className="text-center">Total ($)</div>
          <div className="text-right">Time</div>
        </div>
      </div>

      {/* Trades List */}
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
                                      {(trade.total || 0).toFixed(2)}
              </div>
              <div className="text-right text-gray-400 text-xs">
                {formatTime(trade.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-[#2A2D3A] bg-[#23262F]">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-400">Volume (24h)</div>
            <div className="text-white font-semibold">
              {trades.reduce((sum, trade) => sum + trade.quantity, 0)}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Trades (24h)</div>
            <div className="text-white font-semibold">
              {trades.length}
            </div>
          </div>
          <div>
            <div className="text-gray-400">Avg Price</div>
            <div className="text-white font-semibold">
                              ${trades.length > 0 ? ((trades.reduce((sum, trade) => sum + (trade.price || 0), 0) / trades.length) || 0).toFixed(2) : '0.00'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 