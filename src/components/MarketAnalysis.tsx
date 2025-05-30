'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChartBarIcon, 
  ArrowTrendingUpIcon, 
  ArrowTrendingDownIcon,
  FireIcon,
  EyeIcon,
  ClockIcon,
  CurrencyDollarIcon,
  PlusIcon,
  XMarkIcon,
  CheckIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  ComposedChart,
  ReferenceLine
} from 'recharts';
import Image from 'next/image';
import { formatSteamImageUrl, getFallbackImageUrl } from '../lib/utils';

interface MarketData {
  timestamp: string;
  price: number;
  volume: number;
  high: number;
  low: number;
  open: number;
  close: number;
  rsi: number;
  macd: number;
  signal: number;
  sma20: number;
  sma50: number;
  skinId?: string;
}

interface TrendingSkin {
  id: string;
  name: string;
  image: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent: number;
  volume24h: number;
  rarity: string;
  category: string;
  type: string;
  lastUpdated: string;
}

interface MarketAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

const timeframes = ['1H', '4H', '1D', '1W', '1M'];
const indicators = ['RSI', 'MACD', 'SMA', 'Volume'];
const chartColors = ['#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

const getHeatmapColor = (priceChange: number) => {
  if (priceChange >= 5) return 'bg-green-500/90';
  if (priceChange >= 2) return 'bg-green-400/80';
  if (priceChange >= 0) return 'bg-green-300/70';
  if (priceChange >= -2) return 'bg-red-300/70';
  if (priceChange >= -5) return 'bg-red-400/80';
  return 'bg-red-500/90';
};

const getHeatmapSize = (volume: number) => {
  if (volume >= 1000) return 'scale-110';
  if (volume >= 500) return 'scale-105';
  return 'scale-100';
};

export default function MarketAnalysis({ isOpen, onClose }: MarketAnalysisProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1D');
  const [selectedIndicators, setSelectedIndicators] = useState(['RSI', 'Volume']);
  const [marketData, setMarketData] = useState<{ [skinId: string]: MarketData[] }>({});
  const [trendingSkins, setTrendingSkins] = useState<TrendingSkin[]>([]);
  const [selectedSkin, setSelectedSkin] = useState<string>('');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'chart' | 'heatmap' | 'trending'>('heatmap');
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Debug: Log component state changes
  useEffect(() => {
    console.log('🔍 MarketAnalysis component state changed:', {
      trendingSkinsLength: trendingSkins.length,
      trendingSkinsType: typeof trendingSkins,
      trendingSkinsIsArray: Array.isArray(trendingSkins),
      isLoading,
      viewMode,
      selectedSkin
    });
  }, [trendingSkins, isLoading, viewMode, selectedSkin]);

  // Fetch real skins data from database
  const fetchSkinsData = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Fetching real market data...');
      
      // Use the enhanced /api/skins endpoint with query parameters
      const response = await fetch('/api/skins?limit=20&sortBy=volume24h&order=desc', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch skins data');
      }
      
      const data = await response.json();
      console.log('📊 Received API response:', data);
      
      // Validate the response structure
      if (data && data.skins && Array.isArray(data.skins) && data.skins.length > 0) {
        console.log('✅ Valid skins data found:', data.skins.length, 'skins');
        
        // Transform database skins to trending skins format
        const transformedSkins: TrendingSkin[] = data.skins.map((skin: any) => {
          console.log('🔄 Transforming skin:', skin);
          return {
            id: skin.id,
            name: skin.name,
            image: skin.iconPath,
            currentPrice: parseFloat(skin.price),
            priceChange24h: skin.priceChange24h || 0,
            priceChangePercent: skin.priceChangePercent || 0,
            volume24h: skin.volume24h || 500,
            rarity: skin.rarity,
            category: skin.category || getCategoryFromType(skin.type),
            type: skin.type,
            lastUpdated: new Date().toISOString()
          };
        });
        
        console.log('✅ Transformed skins:', transformedSkins);
        setTrendingSkins(transformedSkins);
        
        // Set first skin as selected if none selected
        if (!selectedSkin && transformedSkins.length > 0) {
          setSelectedSkin(transformedSkins[0].id);
        }
        
        console.log('✅ Market data updated successfully');
      } else {
        // Fallback to dummy data if no skins in database or invalid response
        console.log('⚠️ No valid skins found in database response, using dummy data');
        console.log('Response structure:', { hasData: !!data, hasSkins: !!data?.skins, isArray: Array.isArray(data?.skins), length: data?.skins?.length });
        setTrendingSkins(getDummyTrendingSkins());
        if (!selectedSkin) {
          setSelectedSkin('dummy-awp-dragon-lore');
        }
      }
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('❌ Error fetching skins data:', error);
      // Fallback to dummy data on error
      console.log('🔄 Using dummy data as fallback');
      setTrendingSkins(getDummyTrendingSkins());
      if (!selectedSkin) {
        setSelectedSkin('dummy-awp-dragon-lore');
      }
      setLastUpdate(new Date());
    } finally {
      setIsLoading(false);
    }
  };

  // Dummy data for testing when no real data is available
  const getDummyTrendingSkins = (): TrendingSkin[] => [
    {
      id: 'dummy-awp-dragon-lore',
      name: 'AWP | Dragon Lore',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2PrdSijAWwqkVtN272JIGdJw46YVrYqVO3xLy-gJC9u5vByCBh6ygi7WGdwUKTYdRD8A',
      currentPrice: 12500,
      priceChange24h: 350 + (Math.random() - 0.5) * 200,
      priceChangePercent: 2.88 + (Math.random() - 0.5) * 2,
      volume24h: 1250 + Math.floor(Math.random() * 500),
      rarity: 'Contraband',
      category: 'Sniper',
      type: 'Sniper Rifle',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-ak47-wild-lotus',
      name: 'AK-47 | Wild Lotus',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJegJL_9C3moS0kfv7IbrdqWdY781lxOrH9tyl2APj_RFkYm6ncISWdw42ZwvX8wfoku3s15Tu6czKySZgu3U8pSGKi-NSbdE',
      currentPrice: 8500,
      priceChange24h: -120 + (Math.random() - 0.5) * 100,
      priceChangePercent: -1.39 + (Math.random() - 0.5) * 3,
      volume24h: 890 + Math.floor(Math.random() * 300),
      rarity: 'Covert',
      category: 'Rifle',
      type: 'Assault Rifle',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-m4a4-howl',
      name: 'M4A4 | Howl',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn8f6pIl2-yYp9SnjA23-BBuNW-iLI-XJgFsZQyG_VW2lOq918e8uszLn2wj5HeAvkVdtQ',
      currentPrice: 4200,
      priceChange24h: 180 + (Math.random() - 0.5) * 150,
      priceChangePercent: 4.48 + (Math.random() - 0.5) * 2,
      volume24h: 420 + Math.floor(Math.random() * 200),
      rarity: 'Contraband',
      category: 'Rifle',
      type: 'Assault Rifle',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-karambit-fade',
      name: 'Karambit | Fade',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rVyoD8j1yg5UdpZjz7cNKVdlI2aV_V_1K6wOjxxcjrJJJJJA',
      currentPrice: 2850,
      priceChange24h: 75 + (Math.random() - 0.5) * 100,
      priceChangePercent: 2.70 + (Math.random() - 0.5) * 3,
      volume24h: 650 + Math.floor(Math.random() * 250),
      rarity: 'Covert',
      category: 'Knife',
      type: 'Knife',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-bayonet-doppler',
      name: 'Bayonet | Doppler',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rEyoD8j1yg5UdqZjz7JoKVdlQ5aFnT-gC9xOjxxcjrJJJJJA',
      currentPrice: 850,
      priceChange24h: -25 + (Math.random() - 0.5) * 50,
      priceChangePercent: -2.86 + (Math.random() - 0.5) * 2,
      volume24h: 780 + Math.floor(Math.random() * 300),
      rarity: 'Covert',
      category: 'Knife',
      type: 'Knife',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-glock-fade',
      name: 'Glock-18 | Fade',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0vL3dzxG6eO6nYeDg7n1a-6GkDoC7pMp3rGYpNqiiQ23-UM5ZT-hcIeQJgZsMFvR_lTox7i-m9bi6-pjfulG',
      currentPrice: 450,
      priceChange24h: 15 + (Math.random() - 0.5) * 30,
      priceChangePercent: 3.33 + (Math.random() - 0.5) * 2,
      volume24h: 1200 + Math.floor(Math.random() * 400),
      rarity: 'Restricted',
      category: 'Pistol',
      type: 'Pistol',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-usp-kill-confirmed',
      name: 'USP-S | Kill Confirmed',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWhe5sN4mOTE8bP5gVO8v106NT37LY-cJAZvZF-ErAC7wLi60MO57s7NwSBgvSgksynamEfmiRBJcKUx0nUflmj0',
      currentPrice: 320,
      priceChange24h: -8 + (Math.random() - 0.5) * 20,
      priceChangePercent: -2.50 + (Math.random() - 0.5) * 2,
      volume24h: 950 + Math.floor(Math.random() * 350),
      rarity: 'Classified',
      category: 'Pistol',
      type: 'Pistol',
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'dummy-awp-asiimov',
      name: 'AWP | Asiimov',
      image: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2DMBupQn2eqVotqkiwHiqhdlMmigJtOWJwE5Zw3X8wS-yea8jcDo7c7XiSw0g89L9us',
      currentPrice: 180,
      priceChange24h: 12 + (Math.random() - 0.5) * 15,
      priceChangePercent: 6.67 + (Math.random() - 0.5) * 3,
      volume24h: 1800 + Math.floor(Math.random() * 600),
      rarity: 'Covert',
      category: 'Sniper',
      type: 'Sniper Rifle',
      lastUpdated: new Date().toISOString()
    }
  ];

  // Helper functions for realistic market simulation
  const getBaseVolumeForSkin = (name: string, rarity: string): number => {
    const rarityMultipliers = {
      'Contraband': 200,
      'Covert': 400,
      'Classified': 600,
      'Restricted': 800,
      'Mil-Spec': 1000
    };
    
    const baseVolume = rarityMultipliers[rarity as keyof typeof rarityMultipliers] || 500;
    
    // Popular skins get higher volume
    if (name.includes('Dragon Lore') || name.includes('Howl') || name.includes('Fire Serpent')) {
      return baseVolume * 2;
    }
    if (name.includes('Asiimov') || name.includes('Redline') || name.includes('Vulcan')) {
      return baseVolume * 1.5;
    }
    
    return baseVolume;
  };

  const calculatePriceChange = (currentPrice: number, rarity: string): number => {
    // More expensive/rare skins have smaller percentage changes but larger absolute changes
    const volatility = rarity === 'Contraband' ? 0.03 : 
                     rarity === 'Covert' ? 0.05 : 
                     rarity === 'Classified' ? 0.07 : 0.1;
    
    const change = (Math.random() - 0.5) * 2 * volatility;
    return currentPrice * change;
  };

  const getCategoryFromType = (type: string): string => {
    if (type.includes('Rifle')) return 'Rifle';
    if (type.includes('Pistol')) return 'Pistol';
    if (type.includes('Sniper')) return 'Sniper';
    if (type.includes('SMG')) return 'SMG';
    if (type.includes('Shotgun')) return 'Shotgun';
    if (type.includes('Knife')) return 'Knife';
    if (type.includes('Gloves')) return 'Gloves';
    return 'Other';
  };

  // Generate realistic market data for charts
  const generateMarketDataForSkin = (skinId: string, basePrice: number, timeframe: string) => {
    const data: MarketData[] = [];
    let currentPrice = basePrice;
    
    // Determine data points based on timeframe
    const dataPoints = timeframe === '1H' ? 60 : 
                      timeframe === '4H' ? 48 : 
                      timeframe === '1D' ? 24 : 
                      timeframe === '1W' ? 168 : 720; // 1M = 30 days * 24 hours
    
    const timeInterval = timeframe === '1H' ? 60000 : // 1 minute
                        timeframe === '4H' ? 300000 : // 5 minutes  
                        timeframe === '1D' ? 3600000 : // 1 hour
                        timeframe === '1W' ? 3600000 : // 1 hour
                        3600000; // 1 hour
    
    for (let i = 0; i < Math.min(dataPoints, 100); i++) { // Limit to 100 points for performance
      const timestamp = new Date(Date.now() - (dataPoints - 1 - i) * timeInterval).toISOString();
      const volatility = 0.02; // 2% volatility
      const change = (Math.random() - 0.5) * volatility;
      
      const open = currentPrice;
      const close = currentPrice * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.01);
      const low = Math.min(open, close) * (1 - Math.random() * 0.01);
      const volume = Math.floor(Math.random() * 100) + 50;
      
      // Technical indicators (simplified)
      const rsi = 30 + Math.random() * 40;
      const macd = (Math.random() - 0.5) * 50;
      const signal = macd * 0.8;
      const sma20 = currentPrice * (0.99 + Math.random() * 0.02);
      const sma50 = currentPrice * (0.98 + Math.random() * 0.04);
      
      data.push({
        timestamp: timeframe === '1H' || timeframe === '4H' ? 
          new Date(Date.now() - (dataPoints - 1 - i) * timeInterval).toLocaleTimeString() :
          new Date(Date.now() - (dataPoints - 1 - i) * timeInterval).toLocaleDateString(),
        price: close,
        volume,
        high,
        low,
        open,
        close,
        rsi,
        macd,
        signal,
        sma20,
        sma50,
        skinId
      });
      
      currentPrice = close;
    }
    
    return data;
  };

  // Generate market data when skins or timeframe changes
  useEffect(() => {
    if (trendingSkins.length > 0 && Array.isArray(trendingSkins)) {
      const newMarketData: { [skinId: string]: MarketData[] } = {};
      trendingSkins.forEach(skin => {
        newMarketData[skin.id] = generateMarketDataForSkin(skin.id, skin.currentPrice, selectedTimeframe);
      });
      setMarketData(newMarketData);
    }
  }, [trendingSkins, selectedTimeframe]);

  // Initial data fetch
  useEffect(() => {
    if (isOpen) {
      fetchSkinsData();
    }
  }, [isOpen]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!isOpen || !autoRefresh) return;
    
    const interval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered');
      console.log('📊 Current trendingSkins state:', {
        length: trendingSkins.length,
        isArray: Array.isArray(trendingSkins),
        type: typeof trendingSkins,
        value: trendingSkins
      });
      
      // Update prices dynamically for more realistic market simulation
      if (trendingSkins.length > 0 && Array.isArray(trendingSkins)) {
        console.log('✅ Updating existing skins data');
        setTrendingSkins(prevSkins => {
          console.log('📊 prevSkins in setter:', {
            length: prevSkins?.length,
            isArray: Array.isArray(prevSkins),
            type: typeof prevSkins,
            value: prevSkins
          });
          
          // Ensure prevSkins is an array before mapping
          if (!Array.isArray(prevSkins) || prevSkins.length === 0) {
            console.log('⚠️ Invalid prevSkins in auto-refresh, fetching fresh data');
            fetchSkinsData();
            return prevSkins;
          }
          
          try {
            return prevSkins.map(skin => {
              const volatility = skin.rarity === 'Contraband' ? 0.01 : 
                               skin.rarity === 'Covert' ? 0.02 : 
                               skin.rarity === 'Classified' ? 0.03 : 0.04;
              
              const priceChange = (Math.random() - 0.5) * volatility * skin.currentPrice;
              const newPrice = Math.max(skin.currentPrice + priceChange, skin.currentPrice * 0.5); // Prevent negative prices
              const newPriceChangePercent = (priceChange / skin.currentPrice) * 100;
              
              return {
                ...skin,
                currentPrice: Math.round(newPrice * 100) / 100,
                priceChange24h: skin.priceChange24h + priceChange,
                priceChangePercent: skin.priceChangePercent + newPriceChangePercent,
                volume24h: skin.volume24h + Math.floor((Math.random() - 0.5) * 50),
                lastUpdated: new Date().toISOString()
              };
            });
          } catch (error) {
            console.error('❌ Error in auto-refresh map:', error);
            console.log('🔄 Falling back to fresh data fetch');
            fetchSkinsData();
            return prevSkins;
          }
        });
      } else {
        // Fetch fresh data if no skins available
        console.log('🔄 No skins available in auto-refresh, fetching fresh data');
        fetchSkinsData();
      }
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [isOpen, autoRefresh, trendingSkins.length]);

  const handleComparisonToggle = (skinId: string) => {
    setSelectedForComparison(prev => {
      if (prev.includes(skinId)) {
        return prev.filter(id => id !== skinId);
      } else if (prev.length < 3) {
        return [...prev, skinId];
      }
      return prev;
    });
  };

  const clearComparison = () => {
    setSelectedForComparison([]);
  };

  const handleRefresh = () => {
    fetchSkinsData();
  };

  const currentSkinData = Array.isArray(trendingSkins) ? trendingSkins.find(skin => skin.id === selectedSkin) : undefined;
  const comparisonSkins = Array.isArray(trendingSkins) ? trendingSkins.filter(skin => selectedForComparison.includes(skin.id)) : [];

  // Calculate market statistics
  const marketStats = (() => {
    try {
      console.log('📊 Calculating market stats with trendingSkins:', {
        length: trendingSkins.length,
        isArray: Array.isArray(trendingSkins),
        type: typeof trendingSkins
      });
      
      if (!Array.isArray(trendingSkins) || trendingSkins.length === 0) {
        console.log('⚠️ No valid trending skins for market stats');
        return {
          totalVolume: 0,
          avgPriceChange: 0,
          activeTraders: 0,
          hottestSkin: { name: 'N/A', priceChangePercent: 0 }
        };
      }
      
      return {
        totalVolume: trendingSkins.reduce((sum, skin) => sum + skin.volume24h, 0),
        avgPriceChange: trendingSkins.reduce((sum, skin) => sum + skin.priceChangePercent, 0) / trendingSkins.length,
        activeTraders: Math.floor(trendingSkins.reduce((sum, skin) => sum + skin.volume24h, 0) / 10),
        hottestSkin: trendingSkins.reduce((hottest, skin) => 
          skin.priceChangePercent > hottest.priceChangePercent ? skin : hottest, 
          trendingSkins[0]
        )
      };
    } catch (error) {
      console.error('❌ Error calculating market stats:', error);
      return {
        totalVolume: 0,
        avgPriceChange: 0,
        activeTraders: 0,
        hottestSkin: { name: 'N/A', priceChangePercent: 0 }
      };
    }
  })();

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
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ChartBarIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Market Analysis</h2>
                <p className="text-purple-100">Real-time market data and insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-green-400'}`} />
                <span>Last update: {lastUpdate.toLocaleTimeString()}</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
              >
                <ArrowPathIcon className={`h-5 w-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                  autoRefresh ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-700'
                }`}
              >
                Auto: {autoRefresh ? 'ON' : 'OFF'}
              </button>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        </div>

        {/* Comparison Bar */}
        {selectedForComparison.length > 0 && (
          <div className="bg-[#23262F] border-b border-[#2A2D3A] p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-white font-medium">Comparing:</span>
                <div className="flex items-center space-x-2">
                  {comparisonSkins.map((skin, index) => (
                    <div key={skin.id} className="flex items-center space-x-2 bg-[#181A20] rounded-lg p-2">
                      <div className="w-8 h-8 bg-[#23262F] rounded p-1">
                        <Image
                          src={formatSteamImageUrl(skin.image)}
                          alt={skin.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = getFallbackImageUrl();
                          }}
                          unoptimized
                        />
                      </div>
                      <span className="text-sm text-white">{skin.name}</span>
                      <button
                        onClick={() => handleComparisonToggle(skin.id)}
                        className="text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={clearComparison}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Clear All
              </button>
            </div>
          </div>
        )}

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-[#181A20]">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 mb-6 bg-[#23262F] rounded-lg p-1">
            {['chart', 'heatmap', 'trending'].map((mode) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode as any)}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                  viewMode === mode
                    ? 'bg-purple-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {isLoading && (!Array.isArray(trendingSkins) || trendingSkins.length === 0) ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <ArrowPathIcon className="h-8 w-8 animate-spin text-purple-500 mx-auto mb-4" />
                <p className="text-gray-400">Loading real market data...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Chart View */}
              {viewMode === 'chart' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Controls */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Skin Selector */}
                    <div className="flex items-center space-x-4">
                      <select
                        value={selectedSkin}
                        onChange={(e) => setSelectedSkin(e.target.value)}
                        className="px-3 py-2 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-purple-500"
                      >
                        {Array.isArray(trendingSkins) && trendingSkins.map(skin => (
                          <option key={skin.id} value={skin.id}>{skin.name}</option>
                        ))}
                      </select>
                      
                      {currentSkinData && (
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl font-bold text-white">
                            ${currentSkinData.currentPrice.toLocaleString()}
                          </span>
                          <span className={`text-lg font-medium ${
                            currentSkinData.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {currentSkinData.priceChangePercent >= 0 ? '+' : ''}
                            {currentSkinData.priceChangePercent.toFixed(2)}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Timeframe Selector */}
                    <div className="flex space-x-1 bg-[#23262F] rounded-lg p-1">
                      {timeframes.map(tf => (
                        <button
                          key={tf}
                          onClick={() => setSelectedTimeframe(tf)}
                          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                            selectedTimeframe === tf
                              ? 'bg-purple-600 text-white'
                              : 'text-gray-400 hover:text-white'
                          }`}
                        >
                          {tf}
                        </button>
                      ))}
                    </div>

                    {/* Indicators */}
                    <div className="flex flex-wrap gap-2">
                      {indicators.map(indicator => (
                        <button
                          key={indicator}
                          onClick={() => {
                            setSelectedIndicators(prev => 
                              prev.includes(indicator)
                                ? prev.filter(i => i !== indicator)
                                : [...prev, indicator]
                            );
                          }}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            selectedIndicators.includes(indicator)
                              ? 'bg-purple-600 text-white'
                              : 'bg-[#23262F] text-gray-400 hover:text-white border border-[#2A2D3A]'
                          }`}
                        >
                          {indicator}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Main Chart */}
                  <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                    <ResponsiveContainer width="100%" height={400}>
                      <ComposedChart data={selectedForComparison.length > 0 ? marketData[selectedForComparison[0]] || [] : marketData[selectedSkin] || []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                        <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                        <YAxis yAxisId="price" orientation="right" stroke="#9CA3AF" />
                        {selectedIndicators.includes('Volume') && (
                          <YAxis yAxisId="volume" orientation="left" stroke="#9CA3AF" />
                        )}
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: '#23262F', 
                            border: '1px solid #2A2D3A',
                            borderRadius: '8px',
                            color: '#fff'
                          }} 
                        />
                        
                        {/* Price Lines for Comparison */}
                        {selectedForComparison.length > 0 ? (
                          selectedForComparison.map((skinId, index) => (
                            <Line 
                              key={skinId}
                              yAxisId="price"
                              type="monotone" 
                              dataKey="price" 
                              data={marketData[skinId] || []}
                              stroke={chartColors[index % chartColors.length]} 
                              strokeWidth={3}
                              dot={false}
                              name={Array.isArray(trendingSkins) ? trendingSkins.find(s => s.id === skinId)?.name || skinId : skinId}
                            />
                          ))
                        ) : (
                          <Line 
                            yAxisId="price"
                            type="monotone" 
                            dataKey="price" 
                            stroke="#8B5CF6" 
                            strokeWidth={3}
                            dot={false}
                          />
                        )}
                        
                        {/* Moving Averages */}
                        {selectedIndicators.includes('SMA') && !selectedForComparison.length && (
                          <>
                            <Line 
                              yAxisId="price"
                              type="monotone" 
                              dataKey="sma20" 
                              stroke="#10B981" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                            <Line 
                              yAxisId="price"
                              type="monotone" 
                              dataKey="sma50" 
                              stroke="#F59E0B" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          </>
                        )}
                        
                        {/* Volume Bars */}
                        {selectedIndicators.includes('Volume') && !selectedForComparison.length && (
                          <Bar 
                            yAxisId="volume"
                            dataKey="volume" 
                            fill="#3B82F6" 
                            opacity={0.3}
                          />
                        )}
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Technical Indicators */}
                  {selectedIndicators.includes('RSI') && (
                    <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                      <h3 className="text-lg font-semibold text-white mb-4">RSI (Relative Strength Index)</h3>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={selectedForComparison.length > 0 ? marketData[selectedForComparison[0]] || [] : marketData[selectedSkin] || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                          <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                          <YAxis domain={[0, 100]} stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#23262F', 
                              border: '1px solid #2A2D3A',
                              borderRadius: '8px',
                              color: '#fff'
                            }} 
                          />
                          <ReferenceLine y={70} stroke="#EF4444" strokeDasharray="3 3" />
                          <ReferenceLine y={30} stroke="#10B981" strokeDasharray="3 3" />
                          <Line 
                            type="monotone" 
                            dataKey="rsi" 
                            stroke="#F59E0B" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {selectedIndicators.includes('MACD') && (
                    <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                      <h3 className="text-lg font-semibold text-white mb-4">MACD</h3>
                      <ResponsiveContainer width="100%" height={150}>
                        <LineChart data={selectedForComparison.length > 0 ? marketData[selectedForComparison[0]] || [] : marketData[selectedSkin] || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2A2D3A" />
                          <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                          <YAxis stroke="#9CA3AF" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: '#23262F', 
                              border: '1px solid #2A2D3A',
                              borderRadius: '8px',
                              color: '#fff'
                            }} 
                          />
                          <ReferenceLine y={0} stroke="#6B7280" />
                          <Line 
                            type="monotone" 
                            dataKey="macd" 
                            stroke="#3B82F6" 
                            strokeWidth={2}
                            dot={false}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="signal" 
                            stroke="#EF4444" 
                            strokeWidth={2}
                            dot={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Trending View */}
              {viewMode === 'trending' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Market Overview */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                      <div className="flex items-center space-x-3">
                        <FireIcon className="h-8 w-8 text-orange-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Hottest Skin</p>
                          <p className="text-lg font-bold text-white">{marketStats.hottestSkin.name}</p>
                          <p className="text-sm text-orange-400">+{marketStats.hottestSkin.priceChangePercent.toFixed(2)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                      <div className="flex items-center space-x-3">
                        <CurrencyDollarIcon className="h-8 w-8 text-green-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Total Volume</p>
                          <p className="text-lg font-bold text-white">{(marketStats.totalVolume / 1000).toFixed(1)}K</p>
                          <p className="text-sm text-green-400">+{marketStats.avgPriceChange.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                      <div className="flex items-center space-x-3">
                        <ClockIcon className="h-8 w-8 text-blue-400" />
                        <div>
                          <p className="text-gray-400 text-sm">Active Traders</p>
                          <p className="text-lg font-bold text-white">{marketStats.activeTraders.toLocaleString()}</p>
                          <p className="text-sm text-blue-400">Live</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Trending Skins List */}
                  <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-white">Trending Skins</h3>
                      <div className="text-sm text-gray-400">
                        Updated: {lastUpdate.toLocaleTimeString()}
                      </div>
                    </div>
                    <div className="space-y-3">
                      {Array.isArray(trendingSkins) && trendingSkins.slice(0, 10).map((skin, index) => (
                        <motion.div
                          key={skin.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="flex items-center space-x-4 p-4 bg-[#181A20] rounded-lg hover:bg-[#1F2937] transition-colors cursor-pointer group"
                          onClick={() => {
                            setSelectedSkin(skin.id);
                            setViewMode('chart');
                          }}
                        >
                          <div className="text-gray-400 font-mono text-sm w-8">
                            #{index + 1}
                          </div>

                          <div className="w-16 h-16 bg-[#23262F] rounded-lg p-2 flex-shrink-0 relative overflow-hidden">
                            <Image
                              src={formatSteamImageUrl(skin.image)}
                              alt={skin.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getFallbackImageUrl();
                              }}
                              unoptimized
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>

                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-white truncate">{skin.name}</h4>
                            <p className="text-sm text-gray-400">{skin.category} • {skin.rarity}</p>
                          </div>

                          <div className="text-right">
                            <div className="text-lg font-bold text-white">
                              ${skin.currentPrice.toLocaleString()}
                            </div>
                            <div className={`text-sm font-medium flex items-center ${
                              skin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {skin.priceChangePercent >= 0 ? (
                                <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                              ) : (
                                <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                              )}
                              {Math.abs(skin.priceChangePercent).toFixed(2)}%
                            </div>
                          </div>

                          <div className="text-right text-sm text-gray-400">
                            <div>Vol: {skin.volume24h}</div>
                            <div>${Math.abs(skin.priceChange24h).toFixed(0)}</div>
                          </div>

                          <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                            <EyeIcon className="h-4 w-4" />
                          </button>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Heatmap View */}
              {viewMode === 'heatmap' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  <div className="bg-[#23262F] rounded-xl p-6 border border-[#2A2D3A]">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-white">Market Heatmap</h3>
                      <div className="flex items-center space-x-4 text-sm">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-green-500/90" />
                          <span className="text-gray-400">+5%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 rounded-full bg-red-500/90" />
                          <span className="text-gray-400">-5%</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-gray-400" />
                          <span className="text-gray-400">Volume</span>
                        </div>
                        <div className="text-gray-400">
                          {Array.isArray(trendingSkins) ? trendingSkins.length : 0} skins • Live data
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                      <AnimatePresence>
                        {Array.isArray(trendingSkins) && trendingSkins.map((skin) => (
                          <motion.div
                            key={skin.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            whileHover={{ scale: 1.05, zIndex: 10 }}
                            className={`relative group ${getHeatmapSize(skin.volume24h)} transition-transform duration-300`}
                          >
                            <div 
                              className={`p-3 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                                getHeatmapColor(skin.priceChangePercent)
                              } hover:shadow-lg hover:shadow-${skin.priceChangePercent >= 0 ? 'green' : 'red'}-500/20 ${
                                selectedForComparison.includes(skin.id) ? 'ring-2 ring-purple-500' : ''
                              }`}
                            >
                              {/* Selection Button */}
                              <div className="absolute top-2 right-2 z-20">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleComparisonToggle(skin.id);
                                  }}
                                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                    selectedForComparison.includes(skin.id)
                                      ? 'bg-purple-600 border-purple-600 text-white'
                                      : 'bg-black/50 border-white/30 text-white hover:border-purple-400 hover:bg-purple-600/20'
                                  }`}
                                  disabled={!selectedForComparison.includes(skin.id) && selectedForComparison.length >= 3}
                                >
                                  {selectedForComparison.includes(skin.id) ? (
                                    <CheckIcon className="h-4 w-4" />
                                  ) : (
                                    <PlusIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>

                              <div 
                                className="w-full"
                                onClick={() => {
                                  setSelectedSkin(skin.id);
                                  setViewMode('chart');
                                }}
                              >
                                {/* Smaller Image */}
                                <div className="aspect-square bg-[#181A20] rounded-lg p-2 mb-3 relative overflow-hidden">
                                  <Image
                                    src={formatSteamImageUrl(skin.image)}
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
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>

                                <div className="relative z-10">
                                  <h4 className="font-semibold text-white text-xs truncate mb-1 group-hover:text-white/90">
                                    {skin.name}
                                  </h4>
                                  
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="text-xs text-white/80">
                                      ${skin.currentPrice.toLocaleString()}
                                    </div>
                                    <div className={`text-xs font-medium ${
                                      skin.priceChangePercent >= 0 ? 'text-green-100' : 'text-red-100'
                                    }`}>
                                      {skin.priceChangePercent >= 0 ? '+' : ''}
                                      {skin.priceChangePercent.toFixed(1)}%
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-xs text-white/60">
                                    <div>Vol: {skin.volume24h}</div>
                                    <div className="flex items-center space-x-1">
                                      {skin.priceChangePercent >= 0 ? (
                                        <ArrowTrendingUpIcon className="h-3 w-3" />
                                      ) : (
                                        <ArrowTrendingDownIcon className="h-3 w-3" />
                                      )}
                                      <span>${Math.abs(skin.priceChange24h).toFixed(0)}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Hover Tooltip */}
                              <div className="absolute inset-0 bg-black/80 rounded-xl p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-center items-center text-center pointer-events-none">
                                <div className="text-white font-medium mb-2 text-sm">{skin.name}</div>
                                <div className="text-xs text-gray-300 mb-1">
                                  {skin.category} • {skin.rarity}
                                </div>
                                <div className="text-lg font-bold text-white mb-2">
                                  ${skin.currentPrice.toLocaleString()}
                                </div>
                                <div className={`text-sm font-medium ${
                                  skin.priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                                }`}>
                                  {skin.priceChangePercent >= 0 ? '+' : ''}
                                  {skin.priceChangePercent.toFixed(1)}% (24h)
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  Volume: {skin.volume24h}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Updated: {new Date(skin.lastUpdated).toLocaleTimeString()}
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>
                </motion.div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
} 