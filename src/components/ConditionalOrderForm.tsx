'use client';

import React, { useState } from 'react';
import { 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

interface ConditionalOrderFormProps {
  skinId: string;
  skinName: string;
  currentPrice: number;
  positionId?: string;
  positionType?: 'LONG' | 'SHORT';
  positionSize?: number;
  onClose: () => void;
  onOrderPlaced: () => void;
}

export default function ConditionalOrderForm({
  skinId,
  skinName,
  currentPrice,
  positionId,
  positionType,
  positionSize,
  onClose,
  onOrderPlaced
}: ConditionalOrderFormProps) {
  const [orderType, setOrderType] = useState<'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LIMIT'>('STOP_LOSS');
  const [triggerPrice, setTriggerPrice] = useState('');
  const [limitPrice, setLimitPrice] = useState('');
  const [quantity, setQuantity] = useState(positionSize?.toString() || '');
  const [side, setSide] = useState<'BUY' | 'SELL'>('SELL');
  const [newPositionType, setNewPositionType] = useState<'LONG' | 'SHORT'>('LONG');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isPositionLinked = positionId && positionType;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const triggerPriceNum = parseFloat(triggerPrice);
      const quantityNum = parseFloat(quantity);
      const limitPriceNum = orderType === 'STOP_LIMIT' ? parseFloat(limitPrice) : undefined;

      if (!triggerPriceNum || !quantityNum) {
        throw new Error('Please enter valid trigger price and quantity');
      }

      if (orderType === 'STOP_LIMIT' && !limitPriceNum) {
        throw new Error('Please enter valid limit price for stop-limit order');
      }

      // Validate trigger price based on order type and position
      if (isPositionLinked) {
        if (orderType === 'STOP_LOSS') {
          if (positionType === 'LONG' && triggerPriceNum >= currentPrice) {
            throw new Error('Stop-loss trigger price must be below current price for LONG positions');
          }
          if (positionType === 'SHORT' && triggerPriceNum <= currentPrice) {
            throw new Error('Stop-loss trigger price must be above current price for SHORT positions');
          }
        } else if (orderType === 'TAKE_PROFIT') {
          if (positionType === 'LONG' && triggerPriceNum <= currentPrice) {
            throw new Error('Take-profit trigger price must be above current price for LONG positions');
          }
          if (positionType === 'SHORT' && triggerPriceNum >= currentPrice) {
            throw new Error('Take-profit trigger price must be below current price for SHORT positions');
          }
        }
      }

      const endpoint = orderType === 'STOP_LOSS' 
        ? '/api/orders/stop-loss'
        : orderType === 'TAKE_PROFIT'
        ? '/api/orders/take-profit'
        : '/api/orders/stop-limit';

      const payload = isPositionLinked ? {
        skinId,
        positionId,
        triggerPrice: triggerPriceNum,
        quantity: quantityNum,
        ...(orderType === 'STOP_LIMIT' && { limitPrice: limitPriceNum })
      } : {
        skinId,
        triggerPrice: triggerPriceNum,
        quantity: quantityNum,
        side,
        positionType: newPositionType,
        ...(orderType === 'STOP_LIMIT' && { limitPrice: limitPriceNum })
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place order');
      }

      onOrderPlaced();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'STOP_LOSS':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />;
      case 'TAKE_PROFIT':
        return <ArrowTrendingUpIcon className="h-5 w-5 text-green-400" />;
      case 'STOP_LIMIT':
        return <ArrowTrendingDownIcon className="h-5 w-5 text-blue-400" />;
      default:
        return null;
    }
  };

  const getOrderTypeColor = (type: string) => {
    switch (type) {
      case 'STOP_LOSS':
        return 'border-red-500 bg-red-500/10';
      case 'TAKE_PROFIT':
        return 'border-green-500 bg-green-500/10';
      case 'STOP_LIMIT':
        return 'border-blue-500 bg-blue-500/10';
      default:
        return 'border-gray-500 bg-gray-500/10';
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#181A20] rounded-xl border border-[#2A2D3A] w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#2A2D3A]">
          <div className="flex items-center space-x-3">
            {getOrderTypeIcon(orderType)}
            <div>
              <h3 className="text-lg font-semibold text-white">
                {orderType === 'STOP_LOSS' ? 'Stop-Loss Order' : 
                 orderType === 'TAKE_PROFIT' ? 'Take-Profit Order' : 'Stop-Limit Order'}
              </h3>
              <p className="text-sm text-gray-400">{skinName}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Order Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Order Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(['STOP_LOSS', 'TAKE_PROFIT', 'STOP_LIMIT'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOrderType(type)}
                  className={`p-3 rounded-lg border transition-all ${
                    orderType === type
                      ? getOrderTypeColor(type)
                      : 'border-[#2A2D3A] bg-[#0F1419] hover:border-gray-600'
                  }`}
                >
                  <div className="flex flex-col items-center space-y-1">
                    {getOrderTypeIcon(type)}
                    <span className="text-xs font-medium text-white">
                      {type === 'STOP_LOSS' ? 'Stop Loss' : 
                       type === 'TAKE_PROFIT' ? 'Take Profit' : 'Stop Limit'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Current Price Display */}
          <div className="bg-[#0F1419] p-3 rounded-lg border border-[#2A2D3A]">
            <div className="text-sm text-gray-400">Current Price</div>
            <div className="text-lg font-semibold text-white">${currentPrice.toFixed(2)}</div>
          </div>

          {/* Position Info (if linked) */}
          {isPositionLinked && (
            <div className="bg-[#0F1419] p-3 rounded-lg border border-[#2A2D3A]">
              <div className="text-sm text-gray-400">Position</div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  positionType === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                }`}>
                  {positionType}
                </span>
                <span className="text-white">{positionSize} units</span>
              </div>
            </div>
          )}

          {/* Side and Position Type (for new orders) */}
          {!isPositionLinked && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Side</label>
                <select
                  value={side}
                  onChange={(e) => setSide(e.target.value as 'BUY' | 'SELL')}
                  className="w-full bg-[#0F1419] border border-[#2A2D3A] rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="BUY">BUY</option>
                  <option value="SELL">SELL</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Position Type</label>
                <select
                  value={newPositionType}
                  onChange={(e) => setNewPositionType(e.target.value as 'LONG' | 'SHORT')}
                  className="w-full bg-[#0F1419] border border-[#2A2D3A] rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                >
                  <option value="LONG">LONG</option>
                  <option value="SHORT">SHORT</option>
                </select>
              </div>
            </div>
          )}

          {/* Trigger Price */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trigger Price ($)
            </label>
            <input
              type="number"
              step="0.01"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              className="w-full bg-[#0F1419] border border-[#2A2D3A] rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Enter trigger price"
              required
            />
          </div>

          {/* Limit Price (for stop-limit orders) */}
          {orderType === 'STOP_LIMIT' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Limit Price ($)
              </label>
              <input
                type="number"
                step="0.01"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                className="w-full bg-[#0F1419] border border-[#2A2D3A] rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
                placeholder="Enter limit price"
                required
              />
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Quantity
            </label>
            <input
              type="number"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-[#0F1419] border border-[#2A2D3A] rounded-lg px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
              placeholder="Enter quantity"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-medium transition-all ${
              orderType === 'STOP_LOSS'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : orderType === 'TAKE_PROFIT'
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
            } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? 'Placing Order...' : `Place ${orderType.replace('_', '-')} Order`}
          </button>
        </form>
      </div>
    </div>
  );
} 