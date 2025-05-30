'use client';

import React from 'react';

export default function TradingPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Trading</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Trading Chart</h2>
          <p className="text-gray-400">Trading chart will be displayed here</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">Order Book</h2>
          <p className="text-gray-400">Order book will be displayed here</p>
        </div>
      </div>
    </div>
  );
} 