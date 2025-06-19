'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { formatSteamImageUrl, getFallbackImageUrl, getSteamIconUrl } from '../../lib/utils';
import { useFavorites } from '../../hooks/useFavorites';
import AdvancedFilters, { FilterState } from '../../components/AdvancedFilters';
import SkinComparison from '../../components/SkinComparison';
import WishlistManager from '../../components/WishlistManager';
import PortfolioTracker from '../../components/PortfolioTracker';
import MarketAnalysis from '../../components/MarketAnalysis';
import TradeAlerts from '../../components/TradeAlerts';
import { 
  HeartIcon, 
  ArrowsRightLeftIcon, 
  EyeIcon, 
  ShareIcon,
  ViewColumnsIcon,
  Squares2X2Icon,
  ListBulletIcon,
  ChartBarIcon,
  BellIcon,
  WalletIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon } from '@heroicons/react/24/solid';

interface Skin {
  id: string;
  name: string;
  type: string;
  rarity: string;
  price: number;
  iconPath: string;
  wear: string;
  image?: string;
  category?: string;
  collection?: string;
  float?: number;
  volume24h?: number;
  priceChange24h?: number;
  popularity?: number;
}

type ViewMode = 'grid' | 'list' | 'compact';

const rarityColors = {
  'Consumer Grade': 'border-gray-600 bg-gray-800',
  'Industrial Grade': 'border-blue-500 bg-blue-900',
  'Mil-Spec': 'border-indigo-500 bg-indigo-900',
  'Restricted': 'border-purple-500 bg-purple-900',
  'Classified': 'border-pink-500 bg-pink-900',
  'Covert': 'border-red-500 bg-red-900',
  'Contraband': 'border-orange-500 bg-orange-900'
};

const rarityTextColors = {
  'Consumer Grade': 'text-gray-300',
  'Industrial Grade': 'text-blue-300',
  'Mil-Spec': 'text-indigo-300',
  'Restricted': 'text-purple-300',
  'Classified': 'text-pink-300',
  'Covert': 'text-red-300',
  'Contraband': 'text-orange-300'
};

export default function SkinsPage() {
  const { isFavorite, toggleFavorite } = useFavorites();
  const [skins, setSkins] = useState<Skin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    category: '',
    rarity: '',
    priceRange: [0, 15000],
    sortBy: 'price',
    sortOrder: 'desc',
    popularity: '',
    trending: false,
    availability: 'all',
    floatRange: [0, 1],
    stickers: false,
    statTrak: false
  });
  
  // UI State
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedSkins, setSelectedSkins] = useState<string[]>([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);
  const [showPortfolio, setShowPortfolio] = useState(false);
  const [showMarketAnalysis, setShowMarketAnalysis] = useState(false);
  const [showTradeAlerts, setShowTradeAlerts] = useState(false);

  useEffect(() => {
    const fetchSkins = async () => {
      try {
        const response = await fetch('/api/skins');
        if (!response.ok) {
          throw new Error('Failed to fetch skins');
        }
        const data = await response.json();
        
        // Handle the new API response format
        const skinsArray = data.skins || data || [];
        
        if (!Array.isArray(skinsArray)) {
          console.error('Expected skins to be an array, got:', typeof skinsArray);
          throw new Error('Invalid skins data format');
        }
        
        // Enhance skins with additional properties for filtering
        const enhancedSkins = skinsArray.map((skin: Skin) => ({
          ...skin,
          category: skin.category || skin.type,
          collection: skin.collection || 'Unknown Collection',
          float: skin.float || Math.random() * 0.8 + 0.1,
          volume24h: skin.volume24h || Math.floor(Math.random() * 2000) + 100,
          priceChange24h: skin.priceChange24h || (Math.random() - 0.5) * 10,
          popularity: skin.popularity || Math.floor(Math.random() * 40) + 60
        }));
        
        setSkins(enhancedSkins);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchSkins();
  }, []);

  // Filter and sort skins based on advanced filters
  const filteredSkins = useMemo(() => {
    let filtered = skins.filter(skin => {
      // Search filter
      if (filters.search && !skin.name.toLowerCase().includes(filters.search.toLowerCase())) {
        return false;
      }

      // Category filter
      if (filters.category && skin.category !== filters.category) {
        return false;
      }

      // Rarity filter
      if (filters.rarity && skin.rarity !== filters.rarity) {
        return false;
      }

      // Price range filter
      if (skin.price < filters.priceRange[0] || skin.price > filters.priceRange[1]) {
        return false;
      }

      // Float range filter
      if (skin.float && (skin.float < filters.floatRange[0] || skin.float > filters.floatRange[1])) {
        return false;
      }

      // Popularity filter
      if (filters.popularity) {
        const pop = skin.popularity || 0;
        switch (filters.popularity) {
          case 'Most Popular':
            if (pop < 85) return false;
            break;
          case 'Rising Stars':
            if (pop < 70 || pop > 85) return false;
            break;
          case 'Hidden Gems':
            if (pop > 70) return false;
            break;
          case 'Trader Favorites':
            if (pop < 80) return false;
            break;
        }
      }

      // Trending filter
      if (filters.trending && (!skin.priceChange24h || skin.priceChange24h <= 0)) {
        return false;
      }

      // Availability filter
      if (filters.availability !== 'all') {
        // Add availability logic based on your requirements
      }

      return true;
    });

    // Sort skins
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (filters.sortBy) {
        case 'price':
          comparison = a.price - b.price;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'rarity':
          const rarityOrder = ['Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Contraband'];
          comparison = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
          break;
        case 'popularity':
          comparison = (a.popularity || 0) - (b.popularity || 0);
          break;
        case 'priceChange':
          comparison = (a.priceChange24h || 0) - (b.priceChange24h || 0);
          break;
        default:
          comparison = a.name.localeCompare(b.name);
      }

      return filters.sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [skins, filters]);

  const handleFiltersChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
  }, []);

  const toggleSkinSelection = (skinId: string) => {
    setSelectedSkins(prev => 
      prev.includes(skinId) 
        ? prev.filter(id => id !== skinId)
        : [...prev, skinId]
    );
  };

    const toggleWishlist = async (skinId: string) => {
    await toggleFavorite(skinId);
  };

  const openComparison = () => {
    if (selectedSkins.length > 0) {
      setShowComparison(true);
    }
  };

  const clearSelection = () => {
    setSelectedSkins([]);
  };

  const getSelectedSkinsData = () => {
    return skins.filter(skin => selectedSkins.includes(skin.id)).map(skin => ({
      ...skin,
      image: formatSteamImageUrl(skin.iconPath)
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181A20]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading skins...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#181A20]">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">⚠️ Error</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20]">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">CS2 Skins Collection</h1>
            <p className="text-gray-400">Discover and trade premium Counter-Strike 2 skins</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#23262F] rounded-lg border border-[#2A2D3A] p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                title="Grid View"
              >
                <Squares2X2Icon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                title="List View"
              >
                <ListBulletIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`p-2 rounded-md transition-colors ${
                  viewMode === 'compact' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-300'
                }`}
                title="Compact View"
              >
                <ViewColumnsIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              {/* Phase 2 & 3 Features */}
              <button
                onClick={() => setShowPortfolio(true)}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                title="Portfolio Tracker"
              >
                <WalletIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Portfolio</span>
              </button>

              <button
                onClick={() => setShowMarketAnalysis(true)}
                className="flex items-center space-x-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                title="Market Analysis"
              >
                <ChartBarIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Analysis</span>
              </button>

              <button
                onClick={() => setShowTradeAlerts(true)}
                className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
                title="Trade Alerts"
              >
                <BellIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Alerts</span>
              </button>

              {/* Existing Features */}
              <button
                onClick={() => setShowWishlist(true)}
                className="flex items-center space-x-2 bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <HeartSolidIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Wishlist</span>
              </button>
            </div>

            {selectedSkins.length > 0 && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={openComparison}
                  className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <ArrowsRightLeftIcon className="h-5 w-5" />
                  <span>Compare ({selectedSkins.length})</span>
                </button>
                <button
                  onClick={clearSelection}
                  className="text-gray-400 hover:text-gray-300 px-2 py-2"
                >
                  Clear
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        <AdvancedFilters
          onFiltersChange={handleFiltersChange}
          totalSkins={skins.length}
          filteredCount={filteredSkins.length}
        />

        {/* Skins Grid/List */}
        {filteredSkins.length > 0 ? (
          <div className={`
            ${viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : ''}
            ${viewMode === 'list' ? 'space-y-4' : ''}
            ${viewMode === 'compact' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4' : ''}
          `}>
            {filteredSkins.map((skin) => (
              <SkinCard
                key={skin.id}
                skin={skin}
                viewMode={viewMode}
                isSelected={selectedSkins.includes(skin.id)}
                isWishlisted={isFavorite(skin.id)}
                onToggleSelection={() => toggleSkinSelection(skin.id)}
                onToggleWishlist={() => toggleWishlist(skin.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-600 text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-white mb-2">No skins found</h3>
            <p className="text-gray-400">Try adjusting your filters to see more results</p>
          </div>
        )}

        {/* Modals */}
        <SkinComparison
          isOpen={showComparison}
          onClose={() => setShowComparison(false)}
          initialSkins={getSelectedSkinsData()}
        />

        <WishlistManager
          isOpen={showWishlist}
          onClose={() => setShowWishlist(false)}
        />

        {/* Phase 2 & 3 Components */}
        <PortfolioTracker
          isOpen={showPortfolio}
          onClose={() => setShowPortfolio(false)}
        />

        <MarketAnalysis
          isOpen={showMarketAnalysis}
          onClose={() => setShowMarketAnalysis(false)}
        />

        <TradeAlerts
          isOpen={showTradeAlerts}
          onClose={() => setShowTradeAlerts(false)}
        />
      </div>
    </div>
  );
}

// Skin Card Component
interface SkinCardProps {
  skin: Skin;
  viewMode: ViewMode;
  isSelected: boolean;
  isWishlisted: boolean;
  onToggleSelection: () => void;
  onToggleWishlist: () => void;
}

function SkinCard({ skin, viewMode, isSelected, isWishlisted, onToggleSelection, onToggleWishlist }: SkinCardProps) {
  const imageUrl = formatSteamImageUrl(skin.iconPath);
  const fallbackUrl = getFallbackImageUrl();

  if (viewMode === 'list') {
    return (
      <div className={`bg-[#23262F] rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg ${
        isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-[#2A2D3A] hover:border-gray-500'
      }`}>
        <div className="p-6">
          <div className="flex items-center space-x-6">
            {/* Selection Checkbox */}
            <input
              type="checkbox"
              checked={isSelected}
              onChange={onToggleSelection}
              className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-[#181A20]"
            />

            {/* Skin Image */}
            <div className="w-20 h-20 bg-[#181A20] rounded-lg p-2 flex-shrink-0">
              <Image
                src={imageUrl}
                alt={skin.name}
                width={80}
                height={80}
                className="w-full h-full object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = fallbackUrl;
                }}
                unoptimized={true} // Disable Next.js optimization for external images
              />
            </div>

            {/* Skin Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white truncate">{skin.name}</h3>
                  <p className="text-sm text-gray-400">{skin.category} • {skin.wear}</p>
                  
                  <div className="flex items-center space-x-4 mt-2">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${
                      rarityColors[skin.rarity as keyof typeof rarityColors] || 'border-gray-600 bg-gray-800'
                    } ${rarityTextColors[skin.rarity as keyof typeof rarityTextColors] || 'text-gray-300'}`}>
                      {skin.rarity}
                    </span>
                    
                    {skin.popularity && (
                      <span className="text-xs text-gray-400">
                        {skin.popularity}% popularity
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-400">${skin.price.toLocaleString()}</div>
                  {skin.priceChange24h && (
                    <div className={`text-lg font-semibold ${skin.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {skin.priceChange24h > 0 ? '+' : ''}{skin.priceChange24h.toFixed(1)}%
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={onToggleWishlist}
                className={`p-2 rounded-lg transition-colors ${
                  isWishlisted 
                    ? 'text-red-400 bg-red-900/20 hover:bg-red-900/30' 
                    : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
                }`}
              >
                {isWishlisted ? <HeartSolidIcon className="h-5 w-5" /> : <HeartIcon className="h-5 w-5" />}
              </button>

              <Link href={`/skins/${skin.id}`}>
                <button className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded-lg transition-colors">
                  <EyeIcon className="h-5 w-5" />
                </button>
              </Link>

              <button className="p-2 text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded-lg transition-colors">
                <ShareIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Grid and Compact views
  return (
    <div className={`bg-[#23262F] rounded-xl shadow-sm border-2 transition-all duration-200 hover:shadow-lg group ${
      isSelected ? 'border-blue-500 bg-blue-900/20' : 'border-[#2A2D3A] hover:border-gray-500'
    } ${viewMode === 'compact' ? 'p-3' : 'p-4'}`}>
      {/* Selection Checkbox */}
      <div className="flex items-center justify-between mb-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelection}
          className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-[#181A20]"
        />
        <button
          onClick={onToggleWishlist}
          className={`p-1 rounded-lg transition-colors ${
            isWishlisted 
              ? 'text-red-400 bg-red-900/20' 
              : 'text-gray-400 hover:text-red-400 hover:bg-red-900/20'
          }`}
        >
          {isWishlisted ? <HeartSolidIcon className="h-4 w-4" /> : <HeartIcon className="h-4 w-4" />}
        </button>
      </div>

      {/* Skin Image */}
      <div className={`bg-[#181A20] rounded-lg p-3 mb-4 ${viewMode === 'compact' ? 'aspect-square' : 'aspect-[4/3]'}`}>
        <Image
          src={imageUrl}
          alt={skin.name}
          width={viewMode === 'compact' ? 120 : 200}
          height={viewMode === 'compact' ? 120 : 150}
          className="w-full h-full object-contain"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = fallbackUrl;
          }}
          unoptimized={true} // Disable Next.js optimization for external images
        />
      </div>

      {/* Skin Info */}
      <div className="space-y-2">
        <h3 className={`font-semibold text-white truncate ${viewMode === 'compact' ? 'text-sm' : 'text-base'}`}>
          {skin.name}
        </h3>
        
        <p className={`text-gray-400 ${viewMode === 'compact' ? 'text-xs' : 'text-sm'}`}>
          {skin.category} • {skin.wear}
        </p>

        <span className={`inline-block px-2 py-1 rounded-full font-medium border ${
          rarityColors[skin.rarity as keyof typeof rarityColors] || 'border-gray-600 bg-gray-800'
        } ${rarityTextColors[skin.rarity as keyof typeof rarityTextColors] || 'text-gray-300'} ${
          viewMode === 'compact' ? 'text-xs' : 'text-xs'
        }`}>
          {skin.rarity}
        </span>

        <div className="flex items-center justify-between">
          <div className={`font-bold text-green-400 ${viewMode === 'compact' ? 'text-lg' : 'text-xl'}`}>
            ${skin.price.toLocaleString()}
          </div>
          {skin.priceChange24h && (
            <div className={`font-semibold ${viewMode === 'compact' ? 'text-sm' : 'text-base'} ${
              skin.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'
            }`}>
              {skin.priceChange24h > 0 ? '+' : ''}{skin.priceChange24h.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Link href={`/skins/${skin.id}`}>
            <button className={`flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg hover:bg-blue-700 transition-colors ${
              viewMode === 'compact' ? 'text-xs' : 'text-sm'
            } font-medium`}>
              Go to Trade
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
} 