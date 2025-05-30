'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface MarketMaker {
  id: string;
  username: string;
  email: string;
  balance: number;
  createdAt: string;
}

export default function AdminPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [marketMaker, setMarketMaker] = useState<MarketMaker | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Simple admin check - only allow specific admin emails
  const isAdmin = session?.user?.email === 'omeersahiiin8@gmail.com';

  useEffect(() => {
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (!isAdmin) {
      router.push('/');
      return;
    }

    fetchMarketMakerBalance();
  }, [session, isAdmin, router]);

  const fetchMarketMakerBalance = async () => {
    try {
      const response = await fetch('/api/marketmaker/balance');
      if (!response.ok) {
        throw new Error('Failed to fetch market maker balance');
      }
      const data = await response.json();
      setMarketMaker(data.marketMaker);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (!session || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#181A20] py-8 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#181A20] py-8 px-4">
        <div className="container mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
          <div className="text-red-500">Error: {error}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#181A20] py-8 px-4">
      <div className="container mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
        
        {/* Market Maker Balance Card */}
        <div className="bg-[#23262F] rounded-2xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Market Maker Account</h2>
          {marketMaker && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#1A1C23] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Account</p>
                <p className="text-white font-semibold">{marketMaker.username}</p>
                <p className="text-gray-500 text-xs">{marketMaker.email}</p>
              </div>
              <div className="bg-[#1A1C23] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Commission Balance</p>
                <p className="text-green-400 font-bold text-2xl">${marketMaker.balance.toFixed(2)}</p>
              </div>
              <div className="bg-[#1A1C23] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Account Created</p>
                <p className="text-white font-semibold">
                  {new Date(marketMaker.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="bg-[#1A1C23] p-4 rounded-lg">
                <p className="text-gray-400 text-sm">Status</p>
                <p className="text-green-400 font-semibold">Active</p>
              </div>
            </div>
          )}
          
          <div className="mt-4 flex gap-4">
            <button
              onClick={fetchMarketMakerBalance}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
            >
              Refresh Balance
            </button>
          </div>
        </div>

        {/* Commission Info */}
        <div className="bg-[#23262F] rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Commission Settings</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#1A1C23] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Commission Rate</p>
              <p className="text-yellow-400 font-bold text-xl">0.02%</p>
            </div>
            <div className="bg-[#1A1C23] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Applied On</p>
              <p className="text-white font-semibold">All Trades</p>
            </div>
            <div className="bg-[#1A1C23] p-4 rounded-lg">
              <p className="text-gray-400 text-sm">Collection Method</p>
              <p className="text-white font-semibold">Automatic</p>
            </div>
          </div>
          
          <div className="mt-4 p-4 bg-[#1A1C23] rounded-lg">
            <h3 className="text-white font-semibold mb-2">How Commission Works:</h3>
            <ul className="text-gray-400 text-sm space-y-1">
              <li>• 0.02% commission is charged on every trade (both opening and closing positions)</li>
              <li>• Commission is automatically deducted from trader's balance</li>
              <li>• Commission is automatically transferred to market maker account</li>
              <li>• Commission is calculated on trade value (price × quantity)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 