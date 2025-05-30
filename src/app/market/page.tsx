'use client';

import React from 'react';

export default function MarketPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Market</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Market items will be added here */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Coming Soon</h2>
          <p className="text-gray-400">Market data will be displayed here</p>
        </div>
      </div>
    </div>
  );
} 