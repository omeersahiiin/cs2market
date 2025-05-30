'use client';

import React from 'react';

interface CommissionInfoProps {
  tradeValue: number;
  quantity: number;
  price: number;
}

export default function CommissionInfo({ tradeValue, quantity, price }: CommissionInfoProps) {
  const commission = tradeValue * 0.0002; // 0.02%
  const margin = tradeValue * 0.2; // 20%
  const totalCost = margin + commission;

  return (
    <div className="bg-gray-700 p-3 rounded-lg text-sm">
      <h4 className="text-white font-medium mb-2">Trading Costs</h4>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Trade Value:</span>
          <span className="text-white font-mono">${tradeValue.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Margin (20%):</span>
          <span className="text-white font-mono">${margin.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Commission (0.02%):</span>
          <span className="text-yellow-400 font-mono">${commission.toFixed(2)}</span>
        </div>
        <div className="flex justify-between border-t border-gray-600 pt-1">
          <span className="text-gray-400 font-medium">Total Cost:</span>
          <span className="text-red-400 font-mono font-medium">${totalCost.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
} 