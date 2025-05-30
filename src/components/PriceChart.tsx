'use client';

import React, { useEffect, useState } from 'react';

interface PricePoint {
  timestamp: number;
  price: number;
}

interface PriceChartProps {
  skinId: string;
  currentPrice: number;
  selectedWear?: string;
  className?: string;
}

export default function PriceChart({ skinId, currentPrice, selectedWear, className = '' }: PriceChartProps) {
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate mock price history for demonstration
    // In a real app, this would fetch from an API
    const generateMockHistory = () => {
      const history: PricePoint[] = [];
      const now = Date.now();
      const basePrice = currentPrice;
      
      // Generate 24 hours of price data (every 15 minutes)
      for (let i = 96; i >= 0; i--) {
        const timestamp = now - (i * 15 * 60 * 1000); // 15 minutes intervals
        // Add some realistic price variation (±5%)
        // Different wear conditions might have different volatility
        const volatility = selectedWear ? 0.08 : 0.05; // Individual wears might be more volatile
        const variation = (Math.random() - 0.5) * volatility;
        const price = basePrice * (1 + variation);
        history.push({ timestamp, price });
      }
      
      return history;
    };

    setPriceHistory(generateMockHistory());
    setIsLoading(false);
  }, [currentPrice, skinId, selectedWear]);

  // Update price history with real-time updates
  useEffect(() => {
    let eventSource: EventSource | null = null;

    const setupSSE = () => {
      eventSource = new EventSource('/api/skins/price-updates');

      eventSource.onmessage = (event) => {
        const priceUpdates = JSON.parse(event.data);
        
        if (priceUpdates[skinId]) {
          const newPrice = priceUpdates[skinId];
          setPriceHistory(prev => {
            const newHistory = [...prev, { timestamp: Date.now(), price: newPrice }];
            // Keep only last 96 points (24 hours)
            return newHistory.slice(-96);
          });
        }
      };
    };

    setupSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [skinId]);

  if (isLoading) {
    return (
      <div className={`bg-[#23262F] p-4 rounded-lg ${className}`}>
        <h3 className="text-white font-semibold mb-4">
          Price Chart (24h) {selectedWear ? `- ${selectedWear}` : '- Average Trading Price'}
        </h3>
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (priceHistory.length === 0) {
    return (
      <div className={`bg-[#23262F] p-4 rounded-lg ${className}`}>
        <h3 className="text-white font-semibold mb-4">
          Price Chart (24h) {selectedWear ? `- ${selectedWear}` : '- Average Trading Price'}
        </h3>
        <div className="h-64 flex items-center justify-center">
          <p className="text-gray-400">No price data available</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const chartWidth = 600;
  const chartHeight = 200;
  const padding = 40;

  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

  const minTime = priceHistory[0]?.timestamp || 0;
  const maxTime = priceHistory[priceHistory.length - 1]?.timestamp || 0;
  const timeRange = maxTime - minTime || 1;

  // Generate SVG path
  const pathData = priceHistory.map((point, index) => {
    const x = padding + ((point.timestamp - minTime) / timeRange) * (chartWidth - 2 * padding);
    const y = padding + ((maxPrice - point.price) / priceRange) * (chartHeight - 2 * padding);
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  // Calculate price change
  const firstPrice = priceHistory[0]?.price || currentPrice;
  const lastPrice = priceHistory[priceHistory.length - 1]?.price || currentPrice;
  const priceChange = lastPrice - firstPrice;
  const priceChangePercent = ((priceChange / firstPrice) * 100);

  return (
    <div className={`bg-[#23262F] p-4 rounded-lg ${className}`}>
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-white font-semibold">
            Price Chart (24h) {selectedWear ? `- ${selectedWear}` : '- Average Trading Price'}
          </h3>
          {selectedWear ? (
            <p className="text-xs text-gray-400 mt-1">Individual wear condition analysis</p>
          ) : (
            <p className="text-xs text-gray-400 mt-1">Unified trading price across all wears</p>
          )}
        </div>
        <div className="text-right">
          <div className="text-white font-bold">${currentPrice.toFixed(2)}</div>
          <div className={`text-sm ${priceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {priceChange >= 0 ? '+' : ''}${priceChange.toFixed(2)} ({priceChangePercent >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="relative">
        <svg width="100%" height={chartHeight} viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="overflow-visible">
          {/* Grid lines */}
          <defs>
            <pattern id="grid" width="50" height="40" patternUnits="userSpaceOnUse">
              <path d="M 50 0 L 0 0 0 40" fill="none" stroke="#374151" strokeWidth="0.5" opacity="0.3"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          {/* Price line */}
          <path
            d={pathData}
            fill="none"
            stroke={priceChange >= 0 ? "#10B981" : "#EF4444"}
            strokeWidth="2"
            className="drop-shadow-sm"
          />
          
          {/* Area under curve */}
          <path
            d={`${pathData} L ${padding + (chartWidth - 2 * padding)} ${chartHeight - padding} L ${padding} ${chartHeight - padding} Z`}
            fill={priceChange >= 0 ? "#10B981" : "#EF4444"}
            fillOpacity="0.1"
          />
          
          {/* Price labels */}
          <text x={padding} y={padding - 5} fill="#9CA3AF" fontSize="12" textAnchor="start">
            ${maxPrice.toFixed(2)}
          </text>
          <text x={padding} y={chartHeight - padding + 15} fill="#9CA3AF" fontSize="12" textAnchor="start">
            ${minPrice.toFixed(2)}
          </text>
          
          {/* Time labels */}
          <text x={padding} y={chartHeight - 5} fill="#9CA3AF" fontSize="10" textAnchor="start">
            24h ago
          </text>
          <text x={chartWidth - padding} y={chartHeight - 5} fill="#9CA3AF" fontSize="10" textAnchor="end">
            Now
          </text>
        </svg>
      </div>
      
      <div className="mt-4 text-xs text-gray-400">
        Last updated: {new Date().toLocaleTimeString()}
      </div>
    </div>
  );
} 