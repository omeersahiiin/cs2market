'use client';

import React, { useState, useEffect } from 'react';
import { 
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  XMarkIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface ConditionalOrder {
  id: string;
  orderType: 'STOP_LOSS' | 'TAKE_PROFIT' | 'STOP_LIMIT';
  triggerPrice: number;
  limitPrice?: number;
  side: 'BUY' | 'SELL';
  positionType: 'LONG' | 'SHORT';
  quantity: number;
  status: 'PENDING' | 'TRIGGERED' | 'FILLED' | 'CANCELLED';
  linkedPositionId?: string;
  createdAt: string;
  triggeredAt?: string;
  filledAt?: string;
  skin: {
    name: string;
    price: number;
  };
}

interface ConditionalOrdersListProps {
  skinId?: string;
  refreshTrigger?: number;
}

export default function ConditionalOrdersList({ skinId, refreshTrigger }: ConditionalOrdersListProps) {
  const [orders, setOrders] = useState<ConditionalOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const url = skinId 
        ? `/api/orders/conditional?skinId=${skinId}`
        : '/api/orders/conditional';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setOrders(data.orders || []);
      }
    } catch (error) {
      console.error('Error fetching conditional orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [skinId, refreshTrigger]);

  const handleCancel = async (orderId: string) => {
    setCancelling(orderId);
    try {
      const response = await fetch(`/api/orders/conditional/${orderId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setOrders(orders.filter(order => order.id !== orderId));
      }
    } catch (error) {
      console.error('Error cancelling order:', error);
    } finally {
      setCancelling(null);
    }
  };

  const getOrderTypeIcon = (type: string) => {
    switch (type) {
      case 'STOP_LOSS':
        return <ExclamationTriangleIcon className="h-4 w-4 text-red-400" />;
      case 'TAKE_PROFIT':
        return <ArrowTrendingUpIcon className="h-4 w-4 text-green-400" />;
      case 'STOP_LIMIT':
        return <ArrowTrendingDownIcon className="h-4 w-4 text-blue-400" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'text-yellow-400 bg-yellow-900/20';
      case 'TRIGGERED':
        return 'text-blue-400 bg-blue-900/20';
      case 'FILLED':
        return 'text-green-400 bg-green-900/20';
      case 'CANCELLED':
        return 'text-gray-400 bg-gray-900/20';
      default:
        return 'text-gray-400 bg-gray-900/20';
    }
  };

  const getDistanceToTrigger = (triggerPrice: number, currentPrice: number, orderType: string) => {
    const distance = ((triggerPrice - currentPrice) / currentPrice) * 100;
    const absDistance = Math.abs(distance);
    
    if (absDistance < 1) {
      return { text: `${absDistance.toFixed(2)}%`, color: 'text-red-400' };
    } else if (absDistance < 5) {
      return { text: `${absDistance.toFixed(1)}%`, color: 'text-yellow-400' };
    } else {
      return { text: `${absDistance.toFixed(1)}%`, color: 'text-gray-400' };
    }
  };

  if (loading) {
    return (
      <div className="bg-[#181A20] rounded-xl border border-[#2A2D3A] p-6">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="bg-[#181A20] rounded-xl border border-[#2A2D3A] p-6">
        <div className="text-center py-8">
          <ClockIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No conditional orders</p>
          <p className="text-sm text-gray-500 mt-1">
            Create stop-loss or take-profit orders to manage your risk
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#181A20] rounded-xl border border-[#2A2D3A]">
      <div className="p-4 border-b border-[#2A2D3A]">
        <h3 className="text-lg font-semibold text-white">Conditional Orders</h3>
        <p className="text-sm text-gray-400">{orders.length} active orders</p>
      </div>

      <div className="divide-y divide-[#2A2D3A]">
        {orders.map((order) => {
          const distance = getDistanceToTrigger(order.triggerPrice, order.skin.price, order.orderType);
          
          return (
            <div key={order.id} className="p-4 hover:bg-[#0F1419]/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    {getOrderTypeIcon(order.orderType)}
                    <span className="font-medium text-white">
                      {order.orderType.replace('_', '-')}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.positionType === 'LONG' ? 'bg-green-900/20 text-green-400' : 'bg-red-900/20 text-red-400'
                    }`}>
                      {order.side} {order.positionType}
                    </span>
                  </div>

                  <div className="text-sm text-gray-400 mb-2">
                    {!skinId && <span className="font-medium">{order.skin.name} • </span>}
                    {order.quantity} units @ ${order.triggerPrice.toFixed(2)}
                    {order.limitPrice && ` (Limit: $${order.limitPrice.toFixed(2)})`}
                  </div>

                  <div className="flex items-center space-x-4 text-xs">
                    <div>
                      <span className="text-gray-500">Current: </span>
                      <span className="text-white">${order.skin.price.toFixed(2)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Distance: </span>
                      <span className={distance.color}>{distance.text}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Created: </span>
                      <span className="text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>

                {order.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancel(order.id)}
                    disabled={cancelling === order.id}
                    className="ml-4 p-2 text-gray-400 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                    title="Cancel Order"
                  >
                    {cancelling === order.id ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <XMarkIcon className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
} 