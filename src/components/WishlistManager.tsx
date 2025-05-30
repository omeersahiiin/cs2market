'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, HeartIcon, BellIcon, ShareIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartSolidIcon, BellIcon as BellSolidIcon } from '@heroicons/react/24/solid';

interface WishlistItem {
  id: string;
  name: string;
  type: string;
  rarity: string;
  wear: string;
  currentPrice: number;
  targetPrice?: number;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
  dateAdded: string;
  image: string;
  priceAlert: boolean;
  collection?: string;
  priceChange24h?: number;
}

interface WishlistManagerProps {
  isOpen: boolean;
  onClose: () => void;
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

const priorityColors = {
  high: 'bg-red-900/30 text-red-300 border-red-500/30',
  medium: 'bg-yellow-900/30 text-yellow-300 border-yellow-500/30',
  low: 'bg-green-900/30 text-green-300 border-green-500/30'
};

export default function WishlistManager({ isOpen, onClose }: WishlistManagerProps) {
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<WishlistItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [alertsOnly, setAlertsOnly] = useState(false);
  const [sortBy, setSortBy] = useState('dateAdded');

  // Mock data - replace with actual API calls
  useEffect(() => {
    const mockWishlist: WishlistItem[] = [
      {
        id: '1',
        name: 'AK-47 | Fire Serpent',
        type: 'Rifle',
        rarity: 'Covert',
        wear: 'Field-Tested',
        currentPrice: 2850,
        targetPrice: 2500,
        priority: 'high',
        notes: 'Waiting for market dip',
        dateAdded: '2024-01-15',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyUJ6ZYg2LiSrN6t2wDi-UNpZGGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        priceAlert: true,
        collection: 'Bravo Collection',
        priceChange24h: -2.5
      },
      {
        id: '2',
        name: 'Karambit | Doppler',
        type: 'Knife',
        rarity: 'Covert',
        wear: 'Factory New',
        currentPrice: 1850,
        targetPrice: 1700,
        priority: 'medium',
        notes: 'Phase 2 preferred',
        dateAdded: '2024-01-20',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf3qr3czxb49KzgL-KmsjwPKvBmm5D19V5i_rEyoD8j1yg5UdqZjz7JoKVdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        priceAlert: true,
        collection: 'Chroma Collection',
        priceChange24h: 1.2
      },
      {
        id: '3',
        name: 'AWP | Medusa',
        type: 'Sniper',
        rarity: 'Covert',
        wear: 'Well-Worn',
        currentPrice: 4200,
        priority: 'low',
        notes: 'Dream skin',
        dateAdded: '2024-01-25',
        image: 'https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2D4G65Vy07-Uo9-g2wXj-UVpYmGhJoKRdlQ5aFnT-gC9xOjxxcjrJJJJJA',
        priceAlert: false,
        collection: 'Gods and Monsters Collection',
        priceChange24h: 0.8
      }
    ];
    
    setWishlistItems(mockWishlist);
  }, []);

  // Filter and sort items
  useEffect(() => {
    let filtered = wishlistItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.type.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || item.type.toLowerCase() === categoryFilter;
      const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter;
      const matchesAlerts = !alertsOnly || item.priceAlert;

      return matchesSearch && matchesCategory && matchesPriority && matchesAlerts;
    });

    // Sort items
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price':
          return b.currentPrice - a.currentPrice;
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dateAdded':
        default:
          return new Date(b.dateAdded).getTime() - new Date(a.dateAdded).getTime();
      }
    });

    setFilteredItems(filtered);
  }, [wishlistItems, searchQuery, categoryFilter, priorityFilter, alertsOnly, sortBy]);

  const updateItemPriority = (itemId: string, priority: 'high' | 'medium' | 'low') => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, priority } : item
    ));
  };

  const togglePriceAlert = (itemId: string) => {
    setWishlistItems(prev => prev.map(item => 
      item.id === itemId ? { ...item, priceAlert: !item.priceAlert } : item
    ));
  };

  const removeFromWishlist = (itemId: string) => {
    setWishlistItems(prev => prev.filter(item => item.id !== itemId));
  };

  const exportWishlist = () => {
    const dataStr = JSON.stringify(wishlistItems, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = 'cs2-wishlist.json';
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const getStats = () => {
    const totalValue = wishlistItems.reduce((sum, item) => sum + item.currentPrice, 0);
    const alertCount = wishlistItems.filter(item => item.priceAlert).length;
    const priorityBreakdown = {
      high: wishlistItems.filter(item => item.priority === 'high').length,
      medium: wishlistItems.filter(item => item.priority === 'medium').length,
      low: wishlistItems.filter(item => item.priority === 'low').length
    };

    return { totalValue, alertCount, priorityBreakdown };
  };

  const stats = getStats();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#181A20] rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-[#2A2D3A]">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <HeartSolidIcon className="h-8 w-8" />
              <div>
                <h2 className="text-2xl font-bold">Wishlist Manager</h2>
                <p className="text-pink-100">Track and manage your desired CS2 skins</p>
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
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
              <div className="text-2xl font-bold text-green-400">${stats.totalValue.toLocaleString()}</div>
              <div className="text-sm text-gray-400">Total Value</div>
            </div>
            <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
              <div className="text-2xl font-bold text-blue-400">{wishlistItems.length}</div>
              <div className="text-sm text-gray-400">Total Items</div>
            </div>
            <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
              <div className="text-2xl font-bold text-yellow-400">{stats.alertCount}</div>
              <div className="text-sm text-gray-400">Price Alerts</div>
            </div>
            <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
              <div className="flex space-x-2">
                <span className="text-red-400 font-semibold">{stats.priorityBreakdown.high}</span>
                <span className="text-yellow-400 font-semibold">{stats.priorityBreakdown.medium}</span>
                <span className="text-green-400 font-semibold">{stats.priorityBreakdown.low}</span>
              </div>
              <div className="text-sm text-gray-400">H / M / L Priority</div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-[#23262F] rounded-lg p-4 mb-6 border border-[#2A2D3A]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              {/* Search */}
              <div className="lg:col-span-2">
                <input
                  type="text"
                  placeholder="Search wishlist..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              {/* Category Filter */}
              <div>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All Categories</option>
                  <option value="rifle">Rifles</option>
                  <option value="pistol">Pistols</option>
                  <option value="knife">Knives</option>
                  <option value="sniper">Snipers</option>
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="all">All Priorities</option>
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                >
                  <option value="dateAdded">Date Added</option>
                  <option value="name">Name</option>
                  <option value="price">Price</option>
                  <option value="priority">Priority</option>
                </select>
              </div>

              {/* Controls */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setAlertsOnly(!alertsOnly)}
                  className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    alertsOnly 
                      ? 'bg-yellow-600 text-white' 
                      : 'bg-[#181A20] text-gray-400 border border-[#2A2D3A] hover:text-white'
                  }`}
                >
                  Alerts Only
                </button>
                <button
                  onClick={exportWishlist}
                  className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="Export Wishlist"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Wishlist Items */}
          {filteredItems.length > 0 ? (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <div key={item.id} className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A] hover:border-gray-500 transition-colors">
                  <div className="flex items-center space-x-4">
                    {/* Item Image */}
                    <div className="w-20 h-20 bg-[#181A20] rounded-lg p-2 flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Item Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white truncate">{item.name}</h3>
                          <p className="text-sm text-gray-400">{item.type} • {item.wear}</p>
                          
                          <div className="flex items-center space-x-3 mt-2">
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                              rarityColors[item.rarity as keyof typeof rarityColors] || 'text-gray-400 bg-gray-800'
                            }`}>
                              {item.rarity}
                            </span>
                            
                            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${
                              priorityColors[item.priority]
                            }`}>
                              {item.priority.toUpperCase()} PRIORITY
                            </span>

                            {item.priceAlert && item.targetPrice && item.currentPrice <= item.targetPrice && (
                              <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-900/30 text-green-300 border border-green-500/30">
                                TARGET REACHED!
                              </span>
                            )}
                          </div>

                          {item.notes && (
                            <p className="text-xs text-gray-500 mt-1">{item.notes}</p>
                          )}
                        </div>

                        <div className="text-right ml-4">
                          <div className="text-xl font-bold text-green-400">${item.currentPrice.toLocaleString()}</div>
                          {item.targetPrice && (
                            <div className="text-sm text-gray-400">
                              Target: ${item.targetPrice.toLocaleString()}
                            </div>
                          )}
                          {item.priceChange24h && (
                            <div className={`text-sm font-medium ${
                              item.priceChange24h > 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {item.priceChange24h > 0 ? '+' : ''}{item.priceChange24h.toFixed(1)}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col space-y-2">
                      {/* Priority Selector */}
                      <select
                        value={item.priority}
                        onChange={(e) => updateItemPriority(item.id, e.target.value as 'high' | 'medium' | 'low')}
                        className="px-2 py-1 bg-[#181A20] border border-[#2A2D3A] rounded text-xs text-white focus:ring-2 focus:ring-pink-500"
                      >
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>

                      {/* Action Buttons */}
                      <div className="flex space-x-1">
                        <button
                          onClick={() => togglePriceAlert(item.id)}
                          className={`p-1 rounded transition-colors ${
                            item.priceAlert 
                              ? 'text-yellow-400 bg-yellow-900/20' 
                              : 'text-gray-400 hover:text-yellow-400 hover:bg-yellow-900/20'
                          }`}
                          title="Toggle Price Alert"
                        >
                          {item.priceAlert ? <BellSolidIcon className="h-4 w-4" /> : <BellIcon className="h-4 w-4" />}
                        </button>

                        <button
                          className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-900/20 rounded transition-colors"
                          title="Share"
                        >
                          <ShareIcon className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => removeFromWishlist(item.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded transition-colors"
                          title="Remove from Wishlist"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <HeartIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No items in wishlist</h3>
              <p className="text-gray-400">
                {wishlistItems.length === 0 
                  ? "Start adding skins to your wishlist to track them here"
                  : "No items match your current filters"
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 