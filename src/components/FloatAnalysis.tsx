'use client';

import React, { useState, useEffect } from 'react';
import { FloatAnalysis as FloatAnalysisType, WEAR_RANGES } from '@/lib/floatAnalysis';

interface FloatAnalysisProps {
  skinId: string;
  skinName: string;
}

interface PriceImpact {
  wear: string;
  estimatedPrice: number;
  priceMultiplier: number;
  rarity: 'Common' | 'Uncommon' | 'Rare' | 'Very Rare';
  marketPrice: number; // Base market price for the skin
  priceEffect: {
    absoluteChange: number;
    percentageChange: number;
    similarFloats: {
      min: number;
      max: number;
      avgPrice: number;
    }[];
  };
}

// Add wear range visualization component
const WearRangeVisualizer = ({ floatValue }: { floatValue: number | null }) => {
  const wearRanges = Object.entries(WEAR_RANGES);
  
  return (
    <div className="mb-4">
      <div className="flex w-full h-6 rounded-lg overflow-hidden">
        {wearRanges.map(([wear, range], index) => {
          const width = ((range.max - range.min) / 1) * 100;
          const isActive = floatValue !== null && floatValue >= range.min && floatValue < range.max;
          
          return (
            <div
              key={wear}
              className={`h-full relative ${
                isActive ? 'border-2 border-white' : ''
              }`}
              style={{ 
                width: `${width}%`,
                backgroundColor: wear === 'Factory New' ? '#4ade80' :
                               wear === 'Minimal Wear' ? '#60a5fa' :
                               wear === 'Field-Tested' ? '#facc15' :
                               wear === 'Well-Worn' ? '#fb923c' :
                               '#ef4444'
              }}
            >
              {floatValue !== null && isActive && (
                <div 
                  className="absolute w-1 h-full bg-white"
                  style={{ 
                    left: `${((floatValue - range.min) / (range.max - range.min)) * 100}%`
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs mt-1 text-gray-400">
        {wearRanges.map(([wear, range]) => (
          <div key={wear} className="text-center" style={{ width: `${((range.max - range.min) / 1) * 100}%` }}>
            <p className="truncate">{range.min.toFixed(2)}</p>
          </div>
        ))}
        <p>1.00</p>
      </div>
    </div>
  );
};

// @ts-nocheck
export default function FloatAnalysis({ skinId, skinName }: FloatAnalysisProps) {
  const [analysis, setAnalysis] = useState<FloatAnalysisType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [floatInput, setFloatInput] = useState<string>('');
  const [priceImpact, setPriceImpact] = useState<PriceImpact | null>(null);
  const [calculatingImpact, setCalculatingImpact] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'overview' | 'calculator' | 'tips' | null>('overview');

  useEffect(() => {
    const fetchAnalysis = async () => {
      if (!skinId || !skinName) {
        setError('Missing skin information');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        console.log(`[FloatAnalysis] Fetching analysis for ${skinName} (${skinId})`);
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 second timeout
        });

        const fetchPromise = fetch(`/api/skins/${skinId}/float-analysis`);
        const response = await Promise.race([fetchPromise, timeoutPromise]);
        
        if (!response.ok) {
          if (response.status === 404) {
            console.warn(`[FloatAnalysis] Analysis not available for ${skinName}`);
            setError('Float analysis not available for this skin');
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }
          return;
        }

        const data = await response.json();
        console.log(`[FloatAnalysis] Analysis loaded for ${skinName}:`, data);
        setAnalysis(data.floatAnalysis);
      } catch (err) {
        console.error(`[FloatAnalysis] Error fetching analysis for ${skinName}:`, err);
        const errorMessage = err instanceof Error ? err.message : 'Failed to load float analysis';
        
        if (errorMessage.includes('timed out')) {
          setError('Request timed out. Please try again.');
        } else {
          setError('Float analysis temporarily unavailable');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [skinId, skinName]);

  const calculatePriceImpact = async () => {
    const floatValue = parseFloat(floatInput);
    if (isNaN(floatValue) || floatValue < 0 || floatValue > 1) {
      alert('Please enter a valid float value between 0 and 1');
      return;
    }

    setCalculatingImpact(true);
    try {
      console.log(`[FloatAnalysis] Calculating price impact for float ${floatValue}`);
      
      // Add timeout for price impact calculation
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Calculation timed out')), 8000); // 8 second timeout
      });

      const fetchPromise = fetch(`/api/skins/${skinId}/float-impact?float=${floatValue}`);
      const response = await Promise.race([fetchPromise, timeoutPromise]);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`[FloatAnalysis] Price impact calculated:`, data);
      setPriceImpact(data.priceImpact);
    } catch (err) {
      console.error('[FloatAnalysis] Error calculating price impact:', err);
      const errorMessage = err instanceof Error ? err.message : 'Calculation failed';
      
      if (errorMessage.includes('timed out')) {
        alert('Calculation timed out. Please try again.');
      } else {
        alert('Failed to calculate price impact. Please try again.');
      }
    } finally {
      setCalculatingImpact(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Very Rare': return 'text-purple-400';
      case 'Rare': return 'text-red-400';
      case 'Uncommon': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  const getWearColor = (wear: string) => {
    switch (wear) {
      case 'Factory New': return 'text-green-400';
      case 'Minimal Wear': return 'text-blue-400';
      case 'Field-Tested': return 'text-yellow-400';
      case 'Well-Worn': return 'text-orange-400';
      case 'Battle-Scarred': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const toggleSection = (section: 'overview' | 'calculator' | 'tips') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Helper function to get simple trading insights
  const getSimpleInsights = (analysis: FloatAnalysisType | null) => {
    if (!analysis) return null;
    const wears = Object.entries(analysis.wearConditions);
    const prices = wears.map(([_, data]) => data.avgPrice);
    const maxPrice = Math.max(...prices);
    const minPrice = Math.min(...prices);
    const priceSpread = ((maxPrice - minPrice) / minPrice * 100);

    return {
      bestValue: wears.find(([_, data]) => data.avgPrice === Math.min(...prices.filter(p => p > minPrice)))?.[0] || 'Field-Tested',
      mostExpensive: wears.find(([_, data]) => data.avgPrice === maxPrice)?.[0] || 'Factory New',
      cheapest: wears.find(([_, data]) => data.avgPrice === minPrice)?.[0] || 'Battle-Scarred',
      priceSpread: priceSpread.toFixed(0)
    };
  };

  const formatPriceChange = (change: number) => {
    const formatted = Math.abs(change).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    });
    return change >= 0 ? `+${formatted}` : `-${formatted}`;
  };

  if (loading) {
    return (
      <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
        <h3 className="font-semibold mb-2 text-white">Float Analysis</h3>
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-blue-500 mx-auto mb-2"></div>
            <p className="text-gray-400 text-sm">Loading float analysis...</p>
            <p className="text-gray-500 text-xs mt-1">This may take a few seconds</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
        <h3 className="font-semibold mb-2 text-white">Float Analysis</h3>
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <div className="text-red-400 mb-2">⚠️</div>
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setLoading(true);
                // Trigger re-fetch by updating a dependency
                const fetchAnalysis = async () => {
                  try {
                    setLoading(true);
                    setError(null);
                    
                    const timeoutPromise = new Promise<never>((_, reject) => {
                      setTimeout(() => reject(new Error('Request timed out')), 10000);
                    });

                    const fetchPromise = fetch(`/api/skins/${skinId}/float-analysis`);
                    const response = await Promise.race([fetchPromise, timeoutPromise]);
                    
                    if (!response.ok) {
                      if (response.status === 404) {
                        setError('Float analysis not available for this skin');
                      } else {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                      }
                      return;
                    }

                             const data = await response.json();
         setAnalysis(data);
                  } catch (err) {
                    console.error('[FloatAnalysis] Retry failed:', err);
                    const errorMessage = err instanceof Error ? err.message : 'Failed to load float analysis';
                    setError(errorMessage.includes('timed out') ? 'Request timed out. Please try again.' : 'Float analysis temporarily unavailable');
                  } finally {
                    setLoading(false);
                  }
                };
                fetchAnalysis();
              }}
              className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Return early if no analysis data
  if (!analysis) {
    return (
      <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
        <h3 className="font-semibold mb-2 text-white">Float Analysis</h3>
        <div className="flex items-center justify-center p-6">
          <div className="text-center">
            <p className="text-gray-400 text-sm">No analysis data available</p>
          </div>
        </div>
      </div>
    );
  }

  const insights = getSimpleInsights(analysis);

  return (
    <div className="bg-[#23262F] p-4 rounded-2xl shadow-lg">
      <h3 className="text-lg font-semibold text-white mb-4">Float Analysis</h3>
      
      {/* Quick Overview - Always Visible */}
      <div className="mb-3">
        <div 
          className="bg-[#1A1C23] p-3 rounded-lg cursor-pointer hover:bg-gray-700/20 transition-colors"
          onClick={() => toggleSection('overview')}
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-white text-sm">Price by Condition</h4>
            <div className="flex items-center space-x-3">
              <span className="text-yellow-400 font-semibold text-sm">
                {insights?.priceSpread || '0'}% spread
              </span>
              <span className="text-gray-400 text-xs">
                {expandedSection === 'overview' ? '▼' : '▶'}
              </span>
            </div>
          </div>
          
          {expandedSection === 'overview' && (
            <div className="mt-3">
              {/* Simple Price Comparison */}
              <div className="space-y-2">
                {Object.entries(analysis.wearConditions)
                  .sort(([,a], [,b]) => b.avgPrice - a.avgPrice)
                  .map(([wear, data]) => {
                    const isHighest = wear === insights?.mostExpensive;
                    const isLowest = wear === insights?.cheapest;
                    return (
                      <div key={wear} className={`flex justify-between items-center p-2 rounded text-xs ${
                        isHighest ? 'bg-green-900/20 border border-green-600' :
                        isLowest ? 'bg-red-900/20 border border-red-600' :
                        'bg-[#23262F]'
                      }`}>
                        <div className="flex items-center space-x-2">
                          <span className={`${getWearColor(wear)} font-medium`}>{wear}</span>
                          {isHighest && <span className="text-green-400 text-xs">💎 Premium</span>}
                          {isLowest && <span className="text-red-400 text-xs">💰 Budget</span>}
                        </div>
                        <div className="text-right">
                          <span className="text-white font-semibold">${data.avgPrice.toFixed(2)}</span>
                          <div className="text-gray-500">
                            {insights?.cheapest ? ((data.avgPrice / analysis.wearConditions[insights.cheapest].avgPrice - 1) * 100).toFixed(0) : '0'}% vs cheapest
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Float Calculator - Enhanced */}
      <div className="mb-3">
        <div 
          className="bg-[#1A1C23] p-3 rounded-lg cursor-pointer hover:bg-gray-700/20 transition-colors"
          onClick={() => toggleSection('calculator')}
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-white text-sm">Check Float Value</h4>
            <span className="text-gray-400 text-xs">
              {expandedSection === 'calculator' ? '▼' : '▶'}
            </span>
          </div>
          
          {expandedSection === 'calculator' && (
            <div className="mt-3" onClick={(e) => e.stopPropagation()}>
              {/* Wear Range Visualization */}
              <WearRangeVisualizer floatValue={floatInput ? parseFloat(floatInput) : null} />
              
              <div className="flex space-x-2 mb-3">
                <input
                  type="text"
                  inputMode="decimal"
                  pattern="[0-9]*[.]?[0-9]*"
                  placeholder="Enter float (e.g. 0.15)"
                  value={floatInput}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || /^\d*\.?\d*$/.test(value)) {
                      setFloatInput(value);
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      calculatePriceImpact();
                    }
                  }}
                  className="flex-1 bg-[#23262F] text-white border border-gray-600 rounded px-2 py-1 text-xs focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    calculatePriceImpact();
                  }}
                  disabled={calculatingImpact}
                  className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 disabled:opacity-50"
                >
                  {calculatingImpact ? '...' : 'Check'}
                </button>
              </div>
              
              {priceImpact && (
                <div className="space-y-3">
                  {/* Wear Category Card */}
                  <div className="bg-[#23262F] p-3 rounded border border-gray-600">
                    <div className="text-center mb-2">
                      <p className={`text-sm font-medium ${getWearColor(priceImpact.wear)}`}>
                        {priceImpact.wear}
                      </p>
                      <p className="text-xs text-gray-400">
                        Float Range: {WEAR_RANGES[priceImpact.wear as keyof typeof WEAR_RANGES].min.toFixed(3)} - {WEAR_RANGES[priceImpact.wear as keyof typeof WEAR_RANGES].max.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  {/* Price Effect Analysis */}
                  <div className="bg-[#23262F] p-3 rounded border border-gray-600">
                    <div className="flex flex-col gap-3">
                      {/* Market Price Reference */}
                      <div className="text-center pb-3 border-b border-gray-600">
                        <p className="text-xs text-gray-400 mb-1">Market Price Reference</p>
                        <p className="text-sm text-white">${priceImpact.marketPrice.toLocaleString()}</p>
                      </div>
                      
                      {/* Float Value Effect */}
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">Price with This Float</p>
                          <p className="text-lg font-bold text-white">
                            ${priceImpact.estimatedPrice.toLocaleString()}
                          </p>
                          <div className={`text-sm mt-1 ${
                            priceImpact.priceEffect.percentageChange > 0 ? 'text-green-400' :
                            priceImpact.priceEffect.percentageChange < 0 ? 'text-red-400' :
                            'text-gray-400'
                          }`}>
                            {formatPriceChange(priceImpact.priceEffect.absoluteChange)}
                            <span className="text-xs ml-1">
                              ({priceImpact.priceEffect.percentageChange > 0 ? '+' : ''}
                              {priceImpact.priceEffect.percentageChange.toFixed(1)}%)
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-center border-l border-gray-600">
                          <p className="text-xs text-gray-400 mb-1">Similar Floats</p>
                          <div className="space-y-1">
                            {priceImpact.priceEffect.similarFloats.map((range, index) => (
                              <div key={index} className="text-xs">
                                <span className="text-gray-400">
                                  {range.min.toFixed(4)}-{range.max.toFixed(4)}:
                                </span>
                                <span className="text-white ml-1">
                                  ${range.avgPrice.toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Market Analysis */}
                  <div className="bg-[#23262F] p-3 rounded border border-gray-600">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Float Quality</p>
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            priceImpact.priceEffect.percentageChange > 20 ? 'bg-green-400' :
                            priceImpact.priceEffect.percentageChange > 0 ? 'bg-blue-400' :
                            'bg-yellow-400'
                          }`} />
                          <p className="text-sm text-white">
                            {priceImpact.priceEffect.percentageChange > 20 ? 'Premium Float' :
                             priceImpact.priceEffect.percentageChange > 0 ? 'Above Average' :
                             'Standard Float'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">Market Rarity</p>
                        <p className={`text-sm font-medium ${getRarityColor(priceImpact.rarity)}`}>
                          {priceImpact.rarity}
                          <span className="text-xs text-gray-400 ml-1">
                            ({priceImpact.rarity === 'Very Rare' ? 'Top 10%' :
                              priceImpact.rarity === 'Rare' ? 'Top 25%' :
                              priceImpact.rarity === 'Uncommon' ? 'Top 40%' : 'Common'})
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Trading Insight */}
                  <div className="text-xs text-gray-400 mt-2 flex items-center gap-2">
                    <span className="text-blue-400">💡</span>
                    <p>
                      {priceImpact.priceEffect.percentageChange > 30 ? 
                        "Exceptional float value - commands significant premium over market price!" :
                       priceImpact.priceEffect.percentageChange > 10 ?
                        "Good float value - worth more than typical market price." :
                       priceImpact.priceEffect.percentageChange > 0 ?
                        "Slightly better than market average - small premium possible." :
                        "Standard float value - expect typical market pricing."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Simple Trading Tips */}
      <div className="mb-3">
        <div 
          className="bg-[#1A1C23] p-3 rounded-lg cursor-pointer hover:bg-gray-700/20 transition-colors"
          onClick={() => toggleSection('tips')}
        >
          <div className="flex justify-between items-center">
            <h4 className="font-medium text-white text-sm">Quick Tips</h4>
            <span className="text-gray-400 text-xs">
              {expandedSection === 'tips' ? '▼' : '▶'}
            </span>
          </div>
          
          {expandedSection === 'tips' && (
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center space-x-2 p-2 bg-[#23262F] rounded">
                <span className="text-green-400">💡</span>
                <div>
                  <p className="text-white font-medium">Best Value: {insights.bestValue}</p>
                  <p className="text-gray-400">Good balance of price and quality</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-[#23262F] rounded">
                <span className="text-blue-400">🎯</span>
                <div>
                  <p className="text-white font-medium">Lower float = Higher price</p>
                  <p className="text-gray-400">Factory New (0.00-0.07) costs most</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-2 bg-[#23262F] rounded">
                <span className="text-yellow-400">⚡</span>
                <div>
                  <p className="text-white font-medium">Price spread: {insights.priceSpread}%</p>
                  <p className="text-gray-400">Difference between best and worst condition</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Footer */}
      <div className="text-xs text-gray-400 text-center">
        <p>Float data • Updated {new Date().toLocaleTimeString()}</p>
      </div>
    </div>
  );
} 