'use client';

import React, { useState } from 'react';
import { 
  XMarkIcon, 
  ExclamationTriangleIcon, 
  ArrowTrendingUpIcon 
} from '@heroicons/react/24/outline';
import ConditionalOrderForm from './ConditionalOrderForm';

interface Position {
  id: string;
  skinId: string;
  skinName: string;
  side: 'long' | 'short';
  quantity: number;
  entryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  margin: number;
  timestamp: string;
}

interface PositionManagerProps {
  positions: Position[];
  onClosePosition: (positionId: string) => void;
  onOrderPlaced?: () => void;
}

export default function PositionManager({ 
  positions, 
  onClosePosition, 
  onOrderPlaced 
}: PositionManagerProps) {
  const [showConditionalForm, setShowConditionalForm] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [orderType, setOrderType] = useState<'STOP_LOSS' | 'TAKE_PROFIT'>('STOP_LOSS');

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number) => (price || 0).toFixed(2);

  const handleStopLoss = (position: Position) => {
    setSelectedPosition(position);
    setOrderType('STOP_LOSS');
    setShowConditionalForm(true);
  };

  const handleTakeProfit = (position: Position) => {
    setSelectedPosition(position);
    setOrderType('TAKE_PROFIT');
    setShowConditionalForm(true);
  };

  const handleOrderPlaced = () => {
    setShowConditionalForm(false);
    setSelectedPosition(null);
    if (onOrderPlaced) {
      onOrderPlaced();
    }
  };

  return (
    <>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#2A2D3A]">
          <h3 className="text-lg font-semibold text-white mb-2">Open Positions</h3>
          <div className="text-sm text-gray-400">
            {positions.length} position{positions.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Positions List */}
        <div className="flex-1 overflow-y-auto">
          {positions.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-400">
                <div className="text-4xl mb-2">📊</div>
                <p>No open positions</p>
                <p className="text-sm mt-1">Place an order to start trading</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              {positions.map((position) => (
                <div
                  key={position.id}
                  className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A] hover:border-gray-500 transition-colors"
                >
                  {/* Position Header */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        position.side === 'long' 
                          ? 'bg-green-900/30 text-green-300' 
                          : 'bg-red-900/30 text-red-300'
                      }`}>
                        {position.side.toUpperCase()}
                      </div>
                      <div className="text-white font-medium truncate">
                        {position.skinName}
                      </div>
                    </div>
                    <button
                      onClick={() => onClosePosition(position.id)}
                      className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                      title="Close Position"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Position Details */}
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <div className="text-gray-400">Quantity</div>
                      <div className="text-white font-mono">{position.quantity}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Entry Price</div>
                      <div className="text-white font-mono">${formatPrice(position.entryPrice)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Current Price</div>
                      <div className="text-white font-mono">${formatPrice(position.currentPrice)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400">Margin</div>
                      <div className="text-white font-mono">${formatPrice(position.margin)}</div>
                    </div>
                  </div>

                  {/* Risk Management Buttons */}
                  <div className="flex space-x-2 mb-3">
                    <button
                      onClick={() => handleStopLoss(position)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/30 rounded-lg text-red-400 text-sm font-medium transition-colors"
                    >
                      <ExclamationTriangleIcon className="h-4 w-4" />
                      <span>Stop Loss</span>
                    </button>
                    <button
                      onClick={() => handleTakeProfit(position)}
                      className="flex-1 flex items-center justify-center space-x-2 px-3 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-600/30 rounded-lg text-green-400 text-sm font-medium transition-colors"
                    >
                      <ArrowTrendingUpIcon className="h-4 w-4" />
                      <span>Take Profit</span>
                    </button>
                  </div>

                  {/* PnL */}
                  <div className="pt-3 border-t border-[#2A2D3A]">
                    <div className="flex items-center justify-between">
                      <div className="text-gray-400 text-sm">Unrealized PnL</div>
                      <div className={`font-semibold ${
                        position.pnl >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {position.pnl >= 0 ? '+' : ''}${formatPrice(position.pnl)}
                        <span className="ml-2 text-sm">
                          ({(position.pnl || 0) >= 0 ? '+' : ''}{(position.pnlPercent || 0).toFixed(2)}%)
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Timestamp */}
                  <div className="mt-2 text-xs text-gray-500">
                    Opened: {formatTime(position.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Summary */}
        {positions.length > 0 && (
          <div className="p-4 border-t border-[#2A2D3A] bg-[#23262F]">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Total Margin</div>
                <div className="text-white font-semibold">
                  ${positions.reduce((sum, pos) => sum + (pos.margin || 0), 0).toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-gray-400">Total PnL</div>
                <div className={`font-semibold ${
                  positions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0 
                    ? 'text-green-400' 
                    : 'text-red-400'
                }`}>
                  {positions.reduce((sum, pos) => sum + pos.pnl, 0) >= 0 ? '+' : ''}
                  ${positions.reduce((sum, pos) => sum + (pos.pnl || 0), 0).toFixed(2)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Conditional Order Form Modal */}
      {showConditionalForm && selectedPosition && (
        <ConditionalOrderForm
          skinId={selectedPosition.skinId}
          skinName={selectedPosition.skinName}
          currentPrice={selectedPosition.currentPrice}
          positionId={selectedPosition.id}
          positionType={selectedPosition.side.toUpperCase() as 'LONG' | 'SHORT'}
          positionSize={selectedPosition.quantity}
          onClose={() => {
            setShowConditionalForm(false);
            setSelectedPosition(null);
          }}
          onOrderPlaced={handleOrderPlaced}
        />
      )}
    </>
  );
} 