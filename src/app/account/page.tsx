'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UserStats {
  totalTrades: number;
  totalVolume: number;
  totalPnL: number;
  winRate: number;
  openPositions: number;
  openOrders: number;
}

interface Transaction {
  id: string;
  type: 'TRADE' | 'POSITION_OPEN' | 'POSITION_CLOSE' | 'FEE' | 'DEPOSIT';
  amount: number;
  description: string;
  createdAt: string;
  skinName?: string;
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState<number | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'settings'>('overview');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      fetchAccountData();
    }
  }, [session, status, router]);

  const fetchAccountData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch balance
      const balanceRes = await fetch('/api/user/balance');
      if (balanceRes.ok) {
        const balanceData = await balanceRes.json();
        setBalance(balanceData.balance);
      }

      // Fetch real user stats
      const statsRes = await fetch('/api/user/stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      } else {
        // Fallback to default stats if API fails
        setStats({
          totalTrades: 0,
          totalVolume: 0,
          totalPnL: 0,
          winRate: 0,
          openPositions: 0,
          openOrders: 0
        });
      }

      // Fetch real transaction history
      const transactionsRes = await fetch('/api/user/transactions');
      if (transactionsRes.ok) {
        const transactionsData = await transactionsRes.json();
        setTransactions(transactionsData.transactions || []);
      } else {
        // Fallback to empty transactions if API fails
        setTransactions([]);
      }

    } catch (error) {
      console.error('Error fetching account data:', error);
      // Set fallback data on error
      setStats({
        totalTrades: 0,
        totalVolume: 0,
        totalPnL: 0,
        winRate: 0,
        openPositions: 0,
        openOrders: 0
      });
      setTransactions([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-[#0F1419] py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
          <p className="text-gray-400">Manage your account and view trading activity</p>
        </div>

        {/* Account Summary Card */}
        <div className="bg-[#23262F] rounded-2xl p-6 mb-8 border border-[#2A2D3A]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Account Info</h3>
              <div className="space-y-2">
                <div>
                  <span className="text-gray-400 text-sm">Email</span>
                  <p className="text-white font-medium">{session.user?.email}</p>
                </div>
                <div>
                  <span className="text-gray-400 text-sm">Username</span>
                  <p className="text-white font-medium">{session.user?.username || 'Not set'}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Balance</h3>
              <div className="text-3xl font-bold text-green-400">
                {balance !== null ? formatCurrency(balance) : '...'}
              </div>
              <p className="text-gray-400 text-sm mt-1">Available for trading</p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
              <div className="space-y-2">
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Deposit Funds
                </button>
                <button className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Withdraw Funds
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-[#23262F] rounded-lg p-1">
          {[
            { key: 'overview', label: 'Overview' },
            { key: 'transactions', label: 'Transactions' },
            { key: 'settings', label: 'Settings' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-[#2A2D3A]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && stats && (
          <div className="space-y-6">
            {/* Trading Stats */}
            <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
              <h3 className="text-xl font-semibold text-white mb-6">Trading Statistics</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{stats.totalTrades}</div>
                  <div className="text-gray-400 text-sm">Total Trades</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{formatCurrency(stats.totalVolume)}</div>
                  <div className="text-gray-400 text-sm">Total Volume</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${stats.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.totalPnL >= 0 ? '+' : ''}{formatCurrency(stats.totalPnL)}
                  </div>
                  <div className="text-gray-400 text-sm">Total P&L</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{stats.winRate}%</div>
                  <div className="text-gray-400 text-sm">Win Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">{stats.openPositions}</div>
                  <div className="text-gray-400 text-sm">Open Positions</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">{stats.openOrders}</div>
                  <div className="text-gray-400 text-sm">Open Orders</div>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
              <h3 className="text-xl font-semibold text-white mb-6">Recent Activity</h3>
              <div className="space-y-4">
                {transactions.slice(0, 5).map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-[#2A2D3A] last:border-b-0">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        transaction.type === 'DEPOSIT' ? 'bg-green-400' :
                        transaction.type === 'POSITION_CLOSE' ? 'bg-red-400' :
                        transaction.type === 'TRADE' ? 'bg-blue-400' :
                        transaction.type === 'POSITION_OPEN' ? 'bg-yellow-400' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <p className="text-white font-medium">{transaction.description}</p>
                        <p className="text-gray-400 text-sm">{formatDate(transaction.createdAt)}</p>
                      </div>
                    </div>
                    <div className={`font-semibold ${
                      transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'transactions' && (
          <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Transaction History</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2D3A]">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Type</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Description</th>
                    <th className="text-right py-3 px-2 text-gray-400 font-medium">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-[#2A2D3A] hover:bg-[#1A1C23]">
                      <td className="py-3 px-2 text-gray-300">{formatDate(transaction.createdAt)}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          transaction.type === 'DEPOSIT' ? 'bg-green-900/30 text-green-400' :
                          transaction.type === 'POSITION_CLOSE' ? 'bg-red-900/30 text-red-400' :
                          transaction.type === 'TRADE' ? 'bg-blue-900/30 text-blue-400' :
                          transaction.type === 'POSITION_OPEN' ? 'bg-yellow-900/30 text-yellow-400' :
                          transaction.type === 'FEE' ? 'bg-orange-900/30 text-orange-400' :
                          'bg-gray-900/30 text-gray-400'
                        }`}>
                          {transaction.type}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-white">{transaction.description}</td>
                      <td className={`py-3 px-2 text-right font-semibold ${
                        transaction.amount >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {transaction.amount >= 0 ? '+' : ''}{formatCurrency(transaction.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
            <h3 className="text-xl font-semibold text-white mb-6">Account Settings</h3>
            <div className="space-y-6">
              <div>
                <h4 className="text-lg font-medium text-white mb-4">Profile Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={session.user?.email || ''}
                      disabled
                      className="w-full px-3 py-2 bg-[#1A1C23] border border-[#2A2D3A] rounded-lg text-white disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-2">Username</label>
                    <input
                      type="text"
                      value={session.user?.username || ''}
                      className="w-full px-3 py-2 bg-[#1A1C23] border border-[#2A2D3A] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-4">Security</h4>
                <div className="space-y-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    Change Password
                  </button>
                  <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                    Enable 2FA
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-lg font-medium text-white mb-4">Preferences</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-white">Email Notifications</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-white">Trading Alerts</span>
                    <input type="checkbox" className="toggle" defaultChecked />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 