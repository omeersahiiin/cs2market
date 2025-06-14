'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  ComposedChart,
  Cell
} from 'recharts';

interface CandlestickData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  timestamp: number;
}

interface TradingChartProps {
  skinId: string;
  timeframe: string;
  currentPrice: number;
}

// Enhanced Tooltip
const ProfessionalTooltip = ({ active, payload, label, chartType, formatTime }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const change = data.close - data.open;
    const changePercent = (change / data.open) * 100;
    
    return (
      <div className="bg-[#1e222d] border border-[#363a45] rounded-lg p-3 shadow-xl">
        <p className="text-[#d1d4dc] text-sm mb-2 font-medium">{formatTime(label)}</p>
        {chartType === 'candlestick' ? (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">O</span>
                              <span className="text-[#d1d4dc] font-mono">{(data.open || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">H</span>
                              <span className="text-[#d1d4dc] font-mono">{(data.high || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">L</span>
                              <span className="text-[#d1d4dc] font-mono">{(data.low || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">C</span>
              <span className={`font-mono ${change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                                  {(data.close || 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">Vol</span>
              <span className="text-[#d1d4dc] font-mono">{data.volume.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center space-x-6 pt-1 border-t border-[#363a45]">
              <span className="text-[#787b86]">Change</span>
              <span className={`font-mono ${change >= 0 ? 'text-[#26a69a]' : 'text-[#ef5350]'}`}>
                {(change || 0) >= 0 ? '+' : ''}{(change || 0).toFixed(2)} ({(changePercent || 0) >= 0 ? '+' : ''}{(changePercent || 0).toFixed(2)}%)
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">Price</span>
                              <span className="text-[#d1d4dc] font-mono">{(data.close || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center space-x-6">
              <span className="text-[#787b86]">Volume</span>
              <span className="text-[#d1d4dc] font-mono">{data.volume.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    );
  }
  return null;
};

// Custom Candlestick Chart with SVG overlay
const CustomCandlestickChart = ({ data, formatTime, chartType }: { 
  data: CandlestickData[], 
  formatTime: (time: string) => string, 
  chartType: string 
}) => {
  const chartRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (chartRef.current) {
        const rect = chartRef.current.getBoundingClientRect();
        setChartDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate price range
  const prices = data.flatMap(d => [d.high, d.low]);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const priceRange = maxPrice - minPrice;
  const padding = priceRange * 0.1;

  // Chart dimensions
  const margin = { top: 20, right: 60, bottom: 40, left: 20 };
  const chartWidth = chartDimensions.width - margin.left - margin.right;
  const chartHeight = chartDimensions.height - margin.top - margin.bottom;

  // Scale functions
  const xScale = (index: number) => margin.left + (index / (data.length - 1)) * chartWidth;
  const yScale = (price: number) => margin.top + ((maxPrice + padding - price) / (priceRange + 2 * padding)) * chartHeight;

  const candleWidth = Math.max(chartWidth / data.length * 0.7, 3);

  return (
    <div ref={chartRef} className="relative w-full h-full">
      {/* Background Chart for Grid and Axes */}
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 20, right: 60, left: 20, bottom: 40 }}>
          <CartesianGrid strokeDasharray="1 1" stroke="#2a2e39" strokeOpacity={0.5} />
          <XAxis 
            dataKey="time" 
            tickFormatter={formatTime}
            stroke="#787b86"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            domain={[minPrice - padding, maxPrice + padding]}
            stroke="#787b86"
            fontSize={11}
            tickFormatter={(value) => `${value.toFixed(2)}`}
            tickLine={false}
            axisLine={false}
            orientation="right"
          />
          <Tooltip 
            content={(props: any) => <ProfessionalTooltip {...props} chartType={chartType} formatTime={formatTime} />}
            cursor={{ stroke: '#363a45', strokeWidth: 1, strokeDasharray: '3 3' }}
          />
          
          {/* Invisible line for tooltip interaction */}
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="transparent" 
            strokeWidth={0}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>

      {/* Candlestick Overlay */}
      {chartDimensions.width > 0 && (
        <svg
          className="absolute top-0 left-0 pointer-events-none"
          width={chartDimensions.width}
          height={chartDimensions.height}
        >
          {data.map((candle, index) => {
            const x = xScale(index);
            const isBullish = candle.close >= candle.open;
            const color = isBullish ? '#26a69a' : '#ef5350';
            
            const highY = yScale(candle.high);
            const lowY = yScale(candle.low);
            const openY = yScale(candle.open);
            const closeY = yScale(candle.close);
            
            const bodyTop = Math.min(openY, closeY);
            const bodyBottom = Math.max(openY, closeY);
            const bodyHeight = Math.max(Math.abs(bodyBottom - bodyTop), 1);

            return (
              <g key={`candle-${index}`}>
                {/* Wick */}
                <line
                  x1={x}
                  y1={highY}
                  x2={x}
                  y2={lowY}
                  stroke={color}
                  strokeWidth={1}
                />
                
                {/* Body */}
                <rect
                  x={x - candleWidth / 2}
                  y={bodyTop}
                  width={candleWidth}
                  height={bodyHeight}
                  fill={isBullish ? color : 'transparent'}
                  stroke={color}
                  strokeWidth={1.5}
                />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

export default function TradingChart({ skinId, timeframe, currentPrice }: TradingChartProps) {
  const [chartData, setChartData] = useState<CandlestickData[]>([]);
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('candlestick');
  const [indicators, setIndicators] = useState<string[]>(['volume']);

  // Generate realistic market data
  useEffect(() => {
    const generateRealisticData = () => {
      const data: CandlestickData[] = [];
      const basePrice = currentPrice;
      let lastClose = basePrice;
      
      const intervals = {
        '1m': 60,
        '5m': 48,
        '15m': 32,
        '1h': 24,
        '4h': 18,
        '1d': 30,
        '1w': 52
      };
      
      const count = intervals[timeframe as keyof typeof intervals] || 24;
      
      for (let i = count; i >= 0; i--) {
        const time = new Date();
        
        // Calculate time based on timeframe
        switch (timeframe) {
          case '1m':
            time.setMinutes(time.getMinutes() - i);
            break;
          case '5m':
            time.setMinutes(time.getMinutes() - i * 5);
            break;
          case '15m':
            time.setMinutes(time.getMinutes() - i * 15);
            break;
          case '1h':
            time.setHours(time.getHours() - i);
            break;
          case '4h':
            time.setHours(time.getHours() - i * 4);
            break;
          case '1d':
            time.setDate(time.getDate() - i);
            break;
          case '1w':
            time.setDate(time.getDate() - i * 7);
            break;
        }
        
        // Generate realistic OHLC data with high volatility
        const volatility = 0.1; // 10% volatility for very visible candles
        const trendStrength = 0.008; // Strong trend
        
        const open = lastClose;
        
        // Generate close price with trend and randomness
        const trend = (Math.random() - 0.5) * trendStrength * basePrice;
        const randomChange = (Math.random() - 0.5) * volatility * basePrice;
        const close = Math.max(0.01, open + trend + randomChange);
        
        // Generate high and low with large ranges
        const bodyRange = Math.abs(close - open);
        const wickMultiplier = 3 + Math.random() * 4; // 3x to 7x body range
        const wickRange = Math.max(bodyRange * wickMultiplier, basePrice * 0.05);
        
        const bodyHigh = Math.max(open, close);
        const bodyLow = Math.min(open, close);
        
        const high = bodyHigh + (Math.random() * wickRange);
        const low = Math.max(0.01, bodyLow - (Math.random() * wickRange));
        
        // Generate volume
        const priceChangePercent = Math.abs((close - open) / open);
        const baseVolume = 500 + Math.random() * 1500;
        const volumeMultiplier = 1 + (priceChangePercent * 30);
        const volume = Math.floor(baseVolume * volumeMultiplier);
        
        data.push({
          time: time.toISOString(),
          open: Number(open.toFixed(2)),
          high: Number(high.toFixed(2)),
          low: Number(low.toFixed(2)),
          close: Number(close.toFixed(2)),
          volume: volume,
          timestamp: time.getTime()
        });
        
        lastClose = close;
      }
      
      return data.sort((a, b) => a.timestamp - b.timestamp);
    };

    setChartData(generateRealisticData());
  }, [skinId, timeframe, currentPrice]);

  const formatTime = (timeStr: string) => {
    const date = new Date(timeStr);
    switch (timeframe) {
      case '1m':
      case '5m':
      case '15m':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      case '1h':
      case '4h':
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      case '1d':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1w':
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      default:
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
  };

  // Calculate moving average
  const calculateMA = (data: CandlestickData[], period: number = 20) => {
    return data.map((item, index) => {
      if (index < period - 1) return { ...item, ma: null };
      
      const sum = data.slice(index - period + 1, index + 1)
        .reduce((acc, curr) => acc + curr.close, 0);
      
      return { ...item, ma: sum / period };
    });
  };

  const dataWithMA = calculateMA(chartData);

  return (
    <div className="h-full flex flex-col bg-[#131722]">
      {/* Chart Controls */}
      <div className="flex items-center justify-between mb-3 px-2">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-[#1e222d] rounded-md p-1">
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                chartType === 'line'
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Line
            </button>
            <button
              onClick={() => setChartType('candlestick')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                chartType === 'candlestick'
                  ? 'bg-[#2962ff] text-white'
                  : 'text-[#787b86] hover:text-[#d1d4dc]'
              }`}
            >
              Candles
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-[#787b86]">Indicators:</span>
          <button
            onClick={() => setIndicators(prev => 
              prev.includes('volume') 
                ? prev.filter(i => i !== 'volume')
                : [...prev, 'volume']
            )}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              indicators.includes('volume')
                ? 'bg-[#2962ff] text-white'
                : 'bg-[#1e222d] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            Volume
          </button>
          <button
            onClick={() => setIndicators(prev => 
              prev.includes('ma') 
                ? prev.filter(i => i !== 'ma')
                : [...prev, 'ma']
            )}
            className={`px-2 py-1 rounded text-xs transition-colors ${
              indicators.includes('ma')
                ? 'bg-[#2962ff] text-white'
                : 'bg-[#1e222d] text-[#787b86] hover:text-[#d1d4dc]'
            }`}
          >
            MA(20)
          </button>
        </div>
      </div>

      {/* Main Chart */}
      <div className="flex-1">
        {chartType === 'line' ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dataWithMA} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="1 1" stroke="#2a2e39" strokeOpacity={0.5} />
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
                stroke="#787b86"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={['dataMin - 1', 'dataMax + 1']}
                stroke="#787b86"
                fontSize={11}
                tickFormatter={(value) => `${(value || 0).toFixed(2)}`}
                tickLine={false}
                axisLine={false}
                orientation="right"
              />
              <Tooltip 
                content={(props: any) => <ProfessionalTooltip {...props} chartType={chartType} formatTime={formatTime} />}
                cursor={{ stroke: '#363a45', strokeWidth: 1, strokeDasharray: '3 3' }}
              />
              <Line 
                type="monotone" 
                dataKey="close" 
                stroke="#2962ff" 
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: '#2962ff', strokeWidth: 0 }}
              />
              {indicators.includes('ma') && (
                <Line 
                  type="monotone" 
                  dataKey="ma" 
                  stroke="#ff9800" 
                  strokeWidth={1}
                  dot={false}
                  strokeDasharray="2 2"
                  connectNulls={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <CustomCandlestickChart data={chartData} formatTime={formatTime} chartType={chartType} />
        )}
      </div>

      {/* Volume Chart */}
      {indicators.includes('volume') && (
        <div className="h-16 mt-1">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
              <XAxis 
                dataKey="time" 
                tickFormatter={formatTime}
                stroke="#787b86"
                fontSize={10}
                hide
              />
              <YAxis 
                stroke="#787b86"
                fontSize={10}
                width={35}
                tickLine={false}
                axisLine={false}
                orientation="right"
              />
              <Tooltip 
                formatter={(value: any) => [value.toLocaleString(), 'Volume']}
                labelFormatter={formatTime}
                contentStyle={{
                  backgroundColor: '#1e222d',
                  border: '1px solid #363a45',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
              <Bar dataKey="volume">
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.close >= entry.open ? '#26a69a' : '#ef5350'}
                    fillOpacity={0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
} 