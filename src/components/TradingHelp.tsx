import React, { useState } from 'react';

export default function TradingHelp() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-blue-400 hover:text-blue-300 text-sm underline"
      >
        How do orders work? 🤔
      </button>
      
      {isOpen && (
        <div className="absolute top-6 left-0 z-50 w-96 bg-gray-800 border border-gray-600 rounded-lg p-4 shadow-lg">
          <div className="space-y-3">
            <h4 className="text-white font-semibold">📚 Order Types Explained</h4>
            
            <div className="space-y-2">
              <div className="bg-green-900/20 border border-green-600 rounded p-2">
                <div className="text-green-400 font-medium text-sm">🟢 BUY Limit Order</div>
                <div className="text-gray-300 text-xs">
                  "Buy at $X or better" - Executes when someone sells at/below your price
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Example: BUY limit at $100 → Executes if ask ≤ $100
                </div>
              </div>
              
              <div className="bg-red-900/20 border border-red-600 rounded p-2">
                <div className="text-red-400 font-medium text-sm">🔴 SELL Limit Order</div>
                <div className="text-gray-300 text-xs">
                  "Sell at $X or better" - Executes when someone buys at/above your price
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  Example: SELL limit at $100 → Executes if bid ≥ $100
                </div>
              </div>
              
              <div className="bg-yellow-900/20 border border-yellow-600 rounded p-2">
                <div className="text-yellow-400 font-medium text-sm">⚡ Market Orders</div>
                <div className="text-gray-300 text-xs">
                  Execute immediately at best available price
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  BUY market → Takes best ask | SELL market → Takes best bid
                </div>
              </div>
            </div>
            
            <div className="border-t border-gray-600 pt-2">
              <div className="text-blue-400 text-xs font-medium">💡 Pro Tip:</div>
              <div className="text-gray-300 text-xs">
                If your limit order executes immediately, you got a better price than expected!
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(false)}
              className="w-full mt-2 px-3 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
            >
              Got it! ✅
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 