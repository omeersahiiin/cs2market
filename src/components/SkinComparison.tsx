'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, ArrowsRightLeftIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline';
import { HeartIcon, ShareIcon } from '@heroicons/react/24/solid';

interface Skin {
  id: string;
  name: string;
  type: string;
  rarity: string;
  wear: string;
  price: number;
  image: string;
  collection?: string;
  float?: number;
  volume24h?: number;
  priceChange24h?: number;
  popularity?: number;
}

interface SkinComparisonProps {
  isOpen: boolean;
  onClose: () => void;
  initialSkins?: Skin[];
}

const rarityColors = {
  'Consumer Grade': 'text-gray-400 bg-gray-800',
  'Industrial Grade': 'text-blue-400 bg-blue-900',
  'Mil-Spec': 'text-indigo-400 bg-indigo-900',
  'Restricted': 'text-purple-400 bg-purple-900',
  'Classified': 'text-pink-400 bg-pink-900',
  'Covert': 'text-red-400 bg-red-900',
  'Contraband': 'text-orange-400 bg-orange-900'
};

export default function SkinComparison({ isOpen, onClose, initialSkins = [] }: SkinComparisonProps) {
  const [comparedSkins, setComparedSkins] = useState<Skin[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Skin[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Initialize with provided skins
  useEffect(() => {
    if (initialSkins.length > 0) {
      setComparedSkins(initialSkins);
    }
  }, [initialSkins]);

  // Mock search function - replace with actual API call
  const searchSkins = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    // Simulate API call
    setTimeout(() => {
      const mockResults: Skin[] = [
        {
          id: '1',
          name: 'AK-47 | Redline',
          type: 'Rifle',
          rarity: 'Classified',
          wear: 'Field-Tested',
          price: 85,
          image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUJ6ZYg2LiSrN6t2wDi-UNpZGGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
          collection: 'Huntsman Collection',
          float: 0.25,
          volume24h: 1250,
          priceChange24h: 2.5,
          popularity: 95
        },
        {
          id: '2',
          name: 'AWP | Asiimov',
          type: 'Sniper',
          rarity: 'Covert',
          wear: 'Field-Tested',
          price: 151,
          image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2D4G65Vy07-Uo9-g2wXj-UVpYmGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
          collection: 'Operation Phoenix Collection',
          float: 0.28,
          volume24h: 890,
          priceChange24h: -1.2,
          popularity: 88
        }
      ].filter(skin => 
        skin.name.toLowerCase().includes(query.toLowerCase()) ||
        skin.type.toLowerCase().includes(query.toLowerCase())
      );
      
      setSearchResults(mockResults);
      setIsSearching(false);
    }, 500);
  };

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      searchSkins(searchQuery);
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  const addSkinToComparison = (skin: Skin) => {
    if (comparedSkins.length < 4 && !comparedSkins.find(s => s.id === skin.id)) {
      setComparedSkins([...comparedSkins, skin]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const removeSkinFromComparison = (skinId: string) => {
    setComparedSkins(comparedSkins.filter(skin => skin.id !== skinId));
  };

  const getComparisonMetrics = () => {
    if (comparedSkins.length < 2) return null;

    const prices = comparedSkins.map(skin => skin.price);
    const volumes = comparedSkins.map(skin => skin.volume24h || 0);
    const popularities = comparedSkins.map(skin => skin.popularity || 0);

    return {
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices),
        difference: Math.max(...prices) - Math.min(...prices)
      },
      volumeRange: {
        min: Math.min(...volumes),
        max: Math.max(...volumes),
        total: volumes.reduce((sum, vol) => sum + vol, 0)
      },
      popularityRange: {
        min: Math.min(...popularities),
        max: Math.max(...popularities),
        average: popularities.reduce((sum, pop) => sum + pop, 0) / popularities.length
      }
    };
  };

  const metrics = getComparisonMetrics();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#181A20] rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-[#2A2D3A]">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ArrowsRightLeftIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Skin Comparison Tool</h2>
                <p className="text-blue-100">Compare up to 4 skins side-by-side</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] bg-[#181A20]">
          {/* Add Skin Section */}
          {comparedSkins.length < 4 && (
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search for skins to compare..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 bg-[#23262F] border border-[#2A2D3A] rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {isSearching && (
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  </div>
                )}
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 bg-[#23262F] border border-[#2A2D3A] rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {searchResults.map((skin) => (
                    <button
                      key={skin.id}
                      onClick={() => addSkinToComparison(skin)}
                      className="w-full p-3 text-left hover:bg-[#2A2D3A] border-b border-[#2A2D3A] last:border-b-0 flex items-center space-x-3"
                    >
                      <img src={skin.image} alt={skin.name} className="w-12 h-12 object-cover rounded" />
                      <div className="flex-1">
                        <div className="font-medium text-white">{skin.name}</div>
                        <div className="text-sm text-gray-400">{skin.type} • ${skin.price}</div>
                      </div>
                      <PlusIcon className="h-5 w-5 text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Comparison Grid */}
          {comparedSkins.length > 0 ? (
            <div className="space-y-6">
              {/* Skins Grid */}
              <div className={`grid gap-6 ${
                comparedSkins.length === 1 ? 'grid-cols-1' :
                comparedSkins.length === 2 ? 'grid-cols-2' :
                comparedSkins.length === 3 ? 'grid-cols-3' :
                'grid-cols-2 lg:grid-cols-4'
              }`}>
                {comparedSkins.map((skin, index) => (
                  <div key={skin.id} className="bg-[#23262F] rounded-xl p-4 relative border border-[#2A2D3A]">
                    <button
                      onClick={() => removeSkinFromComparison(skin.id)}
                      className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>

                    {/* Skin Image */}
                    <div className="aspect-square bg-[#181A20] rounded-lg mb-4 p-2">
                      <img
                        src={skin.image}
                        alt={skin.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Skin Info */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-bold text-white text-sm">{skin.name}</h3>
                        <p className="text-xs text-gray-400">{skin.type} • {skin.wear}</p>
                      </div>

                      {/* Rarity Badge */}
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        rarityColors[skin.rarity as keyof typeof rarityColors] || 'text-gray-400 bg-gray-800'
                      }`}>
                        {skin.rarity}
                      </span>

                      {/* Price */}
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-bold text-green-400">${skin.price}</span>
                        {skin.priceChange24h && (
                          <div className={`flex items-center text-sm font-medium ${
                            skin.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {skin.priceChange24h > 0 ? (
                              <ArrowTrendingUpIcon className="h-4 w-4 mr-1" />
                            ) : (
                              <ArrowTrendingDownIcon className="h-4 w-4 mr-1" />
                            )}
                            {Math.abs(skin.priceChange24h).toFixed(1)}%
                          </div>
                        )}
                      </div>

                      {/* Additional Metrics */}
                      <div className="space-y-2 text-xs text-gray-400">
                        {skin.float && (
                          <div className="flex justify-between">
                            <span>Float:</span>
                            <span className="font-medium text-white">{skin.float.toFixed(3)}</span>
                          </div>
                        )}
                        {skin.volume24h && (
                          <div className="flex justify-between">
                            <span>24h Volume:</span>
                            <span className="font-medium text-white">{skin.volume24h.toLocaleString()}</span>
                          </div>
                        )}
                        {skin.popularity && (
                          <div className="flex justify-between">
                            <span>Popularity:</span>
                            <span className="font-medium text-white">{skin.popularity}%</span>
                          </div>
                        )}
                        {skin.collection && (
                          <div className="flex justify-between">
                            <span>Collection:</span>
                            <span className="font-medium text-right text-white">{skin.collection}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex space-x-2 pt-2">
                        <button className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                          Go to Trade
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-400 transition-colors">
                          <HeartIcon className="h-4 w-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-blue-400 transition-colors">
                          <ShareIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Comparison Metrics */}
              {metrics && comparedSkins.length > 1 && (
                <div className="bg-gradient-to-r from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-[#2A2D3A]">
                  <h3 className="text-lg font-bold text-white mb-4">Comparison Analysis</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Price Analysis */}
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Price Analysis</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="font-medium text-green-400">${metrics.priceRange.min}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Highest:</span>
                          <span className="font-medium text-red-400">${metrics.priceRange.max}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Difference:</span>
                          <span className="font-medium text-white">${metrics.priceRange.difference}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Price Ratio:</span>
                          <span className="font-medium text-white">
                            {(metrics.priceRange.max / metrics.priceRange.min).toFixed(1)}x
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Volume Analysis */}
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Trading Volume</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Total Volume:</span>
                          <span className="font-medium text-white">{metrics.volumeRange.total.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Highest:</span>
                          <span className="font-medium text-white">{metrics.volumeRange.max.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="font-medium text-white">{metrics.volumeRange.min.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average:</span>
                          <span className="font-medium text-white">
                            {Math.round(metrics.volumeRange.total / comparedSkins.length).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Popularity Analysis */}
                    <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
                      <h4 className="font-semibold text-white mb-3">Popularity Metrics</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Average:</span>
                          <span className="font-medium text-white">{metrics.popularityRange.average.toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Highest:</span>
                          <span className="font-medium text-green-400">{metrics.popularityRange.max}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Lowest:</span>
                          <span className="font-medium text-red-400">{metrics.popularityRange.min}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Spread:</span>
                          <span className="font-medium text-white">
                            {(metrics.popularityRange.max - metrics.popularityRange.min).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recommendations */}
                  <div className="mt-6 p-4 bg-[#23262F] rounded-lg border border-[#2A2D3A]">
                    <h4 className="font-semibold text-white mb-2">💡 Recommendations</h4>
                    <div className="text-sm text-gray-400 space-y-1">
                      {metrics.priceRange.difference > 100 && (
                        <p>• Large price difference detected - consider the value proposition carefully</p>
                      )}
                      {metrics.volumeRange.max > metrics.volumeRange.min * 2 && (
                        <p>• Some skins have significantly higher trading volume - better liquidity</p>
                      )}
                      {metrics.popularityRange.average > 80 && (
                        <p>• All compared skins are highly popular - good investment choices</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12">
              <ArrowsRightLeftIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Skins to Compare</h3>
              <p className="text-gray-400">Search and add skins above to start comparing</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 