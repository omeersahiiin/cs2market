'use client';

import { useState, useEffect } from 'react';
import { FunnelIcon, XMarkIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  totalSkins: number;
  filteredCount: number;
}

export interface FilterState {
  search: string;
  category: string;
  rarity: string;
  priceRange: [number, number];
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  popularity: string;
  trending: boolean;
  availability: string;
  floatRange: [number, number];
  stickers: boolean;
  statTrak: boolean;
}

const categories = ['All Categories', 'Rifle', 'Pistol', 'SMG', 'Shotgun', 'Sniper', 'Knife', 'Gloves'];
const rarities = ['All Rarities', 'Consumer Grade', 'Industrial Grade', 'Mil-Spec', 'Restricted', 'Classified', 'Covert', 'Contraband'];
const sortOptions = ['Price', 'Name', 'Rarity', 'Popularity', 'Price Change', 'Date Added'];
const popularityOptions = ['All', 'Most Popular', 'Rising Stars', 'Hidden Gems', 'Trader Favorites'];
const availabilityOptions = ['All', 'In Stock', 'Limited', 'Rare'];

export default function AdvancedFilters({ onFiltersChange, totalSkins, filteredCount }: AdvancedFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
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

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  useEffect(() => {
    onFiltersChange(filters);
    updateActiveFilters();
  }, [filters, onFiltersChange]);

  const updateActiveFilters = () => {
    const active: string[] = [];
    
    if (filters.search) active.push(`Search: "${filters.search}"`);
    if (filters.category) active.push(`Category: ${filters.category}`);
    if (filters.rarity) active.push(`Rarity: ${filters.rarity}`);
    if (filters.priceRange[0] > 0 || filters.priceRange[1] < 15000) {
      active.push(`Price: $${filters.priceRange[0]} - $${filters.priceRange[1]}`);
    }
    if (filters.popularity) active.push(`Popularity: ${filters.popularity}`);
    if (filters.trending) active.push('Trending');
    if (filters.availability !== 'all') active.push(`Availability: ${filters.availability}`);
    if (filters.floatRange[0] > 0 || filters.floatRange[1] < 1) {
      active.push(`Float: ${filters.floatRange[0].toFixed(2)} - ${filters.floatRange[1].toFixed(2)}`);
    }
    if (filters.stickers) active.push('Has Stickers');
    if (filters.statTrak) active.push('StatTrak™');

    setActiveFilters(active);
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const removeFilter = (filterText: string) => {
    if (filterText.startsWith('Search:')) {
      handleFilterChange('search', '');
    } else if (filterText.startsWith('Category:')) {
      handleFilterChange('category', '');
    } else if (filterText.startsWith('Rarity:')) {
      handleFilterChange('rarity', '');
    } else if (filterText.startsWith('Price:')) {
      handleFilterChange('priceRange', [0, 15000]);
    } else if (filterText.startsWith('Popularity:')) {
      handleFilterChange('popularity', '');
    } else if (filterText === 'Trending') {
      handleFilterChange('trending', false);
    } else if (filterText.startsWith('Availability:')) {
      handleFilterChange('availability', 'all');
    } else if (filterText.startsWith('Float:')) {
      handleFilterChange('floatRange', [0, 1]);
    } else if (filterText === 'Has Stickers') {
      handleFilterChange('stickers', false);
    } else if (filterText === 'StatTrak™') {
      handleFilterChange('statTrak', false);
    }
  };

  const clearAllFilters = () => {
    setFilters({
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
  };

  return (
    <div className="bg-[#23262F] rounded-xl border border-[#2A2D3A] mb-8">
      {/* Filter Header */}
      <div className="p-4 border-b border-[#2A2D3A]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FunnelIcon className="h-5 w-5 text-blue-400" />
            <h3 className="text-lg font-semibold text-white">Advanced Filters</h3>
            <span className="text-sm text-gray-400">
              Showing {filteredCount} of {totalSkins} skins
            </span>
          </div>
          
          <div className="flex items-center space-x-4">
            {activeFilters.length > 0 && (
              <button
                onClick={clearAllFilters}
                className="text-sm text-red-400 hover:text-red-300 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span className="text-sm font-medium">
                {isExpanded ? 'Less Filters' : 'More Filters'}
              </span>
              {isExpanded ? (
                <ChevronUpIcon className="h-4 w-4" />
              ) : (
                <ChevronDownIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-900/30 text-blue-300 border border-blue-500/30"
              >
                {filter}
                <button
                  onClick={() => removeFilter(filter)}
                  className="ml-2 text-blue-400 hover:text-blue-300"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search Bar */}
      <div className="p-4 border-b border-[#2A2D3A]">
        <input
          type="text"
          placeholder="Search skins by name, collection, or pattern..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full px-4 py-3 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Basic Filters */}
      <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Category</label>
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {categories.map(category => (
              <option key={category} value={category === 'All Categories' ? '' : category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {/* Rarity */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Rarity</label>
          <select
            value={filters.rarity}
            onChange={(e) => handleFilterChange('rarity', e.target.value)}
            className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {rarities.map(rarity => (
              <option key={rarity} value={rarity === 'All Rarities' ? '' : rarity}>
                {rarity}
              </option>
            ))}
          </select>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Sort By</label>
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {sortOptions.map(option => (
              <option key={option} value={option.toLowerCase().replace(' ', '')}>
                {option}
              </option>
            ))}
          </select>
        </div>

        {/* Order */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Order</label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'asc' | 'desc')}
            className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="desc">High to Low</option>
            <option value="asc">Low to High</option>
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      {isExpanded && (
        <div className="p-4 border-t border-[#2A2D3A] space-y-6">
          {/* Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Price Range: ${filters.priceRange[0]} - ${filters.priceRange[1]}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="15000"
                step="50"
                value={filters.priceRange[0]}
                onChange={(e) => handleFilterChange('priceRange', [parseInt(e.target.value), filters.priceRange[1]])}
                className="flex-1 h-2 bg-[#181A20] rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="0"
                max="15000"
                step="50"
                value={filters.priceRange[1]}
                onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], parseInt(e.target.value)])}
                className="flex-1 h-2 bg-[#181A20] rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Popularity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Popularity</label>
            <select
              value={filters.popularity}
              onChange={(e) => handleFilterChange('popularity', e.target.value)}
              className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {popularityOptions.map(option => (
                <option key={option} value={option === 'All' ? '' : option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Float Range */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Float Range: {filters.floatRange[0].toFixed(2)} - {filters.floatRange[1].toFixed(2)}
            </label>
            <div className="flex items-center space-x-4">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filters.floatRange[0]}
                onChange={(e) => handleFilterChange('floatRange', [parseFloat(e.target.value), filters.floatRange[1]])}
                className="flex-1 h-2 bg-[#181A20] rounded-lg appearance-none cursor-pointer slider"
              />
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={filters.floatRange[1]}
                onChange={(e) => handleFilterChange('floatRange', [filters.floatRange[0], parseFloat(e.target.value)])}
                className="flex-1 h-2 bg-[#181A20] rounded-lg appearance-none cursor-pointer slider"
              />
            </div>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Availability</label>
            <select
              value={filters.availability}
              onChange={(e) => handleFilterChange('availability', e.target.value)}
              className="w-full px-3 py-2 bg-[#181A20] border border-[#2A2D3A] rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {availabilityOptions.map(option => (
                <option key={option} value={option.toLowerCase()}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          {/* Special Features */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Special Features</label>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.trending}
                  onChange={(e) => handleFilterChange('trending', e.target.checked)}
                  className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-[#181A20]"
                />
                <span className="text-sm text-gray-300">Trending</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.statTrak}
                  onChange={(e) => handleFilterChange('statTrak', e.target.checked)}
                  className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-[#181A20]"
                />
                <span className="text-sm text-gray-300">StatTrak™</span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.stickers}
                  onChange={(e) => handleFilterChange('stickers', e.target.checked)}
                  className="rounded border-gray-500 text-blue-600 focus:ring-blue-500 bg-[#181A20]"
                />
                <span className="text-sm text-gray-300">Has Stickers</span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 