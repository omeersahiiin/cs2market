'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface SupportedCrypto {
  id: string;
  symbol: string;
  name: string;
  network: string;
  minDeposit: number;
  iconUrl?: string;
}

interface Deposit {
  id: string;
  cryptocurrency: string;
  network: string;
  depositAddress: string;
  amount?: number;
  usdValue?: number;
  status: string;
  confirmations: number;
  requiredConfirmations: number;
  createdAt: string;
  expiresAt?: string;
}

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [supportedCryptos] = useState<SupportedCrypto[]>([
    {
      id: '1',
      symbol: 'BTC',
      name: 'Bitcoin',
      network: 'Bitcoin',
      minDeposit: 0.001,
      iconUrl: '/crypto/btc.png'
    },
    {
      id: '2',
      symbol: 'ETH',
      name: 'Ethereum',
      network: 'Ethereum',
      minDeposit: 0.01,
      iconUrl: '/crypto/eth.png'
    },
    {
      id: '3',
      symbol: 'USDT',
      name: 'Tether (TRC20)',
      network: 'Tron',
      minDeposit: 10,
      iconUrl: '/crypto/usdt.png'
    },
    {
      id: '4',
      symbol: 'SOL',
      name: 'Solana',
      network: 'Solana',
      minDeposit: 0.1,
      iconUrl: '/crypto/sol.png'
    }
  ]);
  
  const [selectedCrypto, setSelectedCrypto] = useState<SupportedCrypto | null>(null);
  const [currentDeposit, setCurrentDeposit] = useState<Deposit | null>(null);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      fetchDepositHistory();
    }
  }, [session, status, router]);

  const fetchDepositHistory = async () => {
    try {
      const response = await fetch('/api/crypto/deposit');
      if (response.ok) {
        const data = await response.json();
        setDeposits(data.deposits || []);
      }
    } catch (error) {
      console.error('Error fetching deposit history:', error);
    }
  };

  const createDeposit = async (crypto: SupportedCrypto) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/crypto/deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cryptocurrency: crypto.symbol,
          network: crypto.network
        })
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentDeposit({
          id: data.depositId,
          cryptocurrency: data.cryptocurrency,
          network: data.network,
          depositAddress: data.depositAddress,
          status: data.status,
          confirmations: 0,
          requiredConfirmations: data.requiredConfirmations,
          createdAt: new Date().toISOString(),
          expiresAt: data.expiresAt
        });
        setSelectedCrypto(crypto);
        fetchDepositHistory(); // Refresh history
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to create deposit');
      }
    } catch (error) {
      setError('Network error. Please try again.');
      console.error('Error creating deposit:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400';
      case 'CONFIRMED': return 'text-blue-400';
      case 'CREDITED': return 'text-green-400';
      case 'FAILED': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#0F1419] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Crypto Deposit</h1>
          <p className="text-gray-400">Fund your account with cryptocurrency</p>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!currentDeposit ? (
          /* Crypto Selection */
          <div className="bg-[#23262F] rounded-2xl p-6 mb-8 border border-[#2A2D3A]">
            <h2 className="text-xl font-semibold text-white mb-6">Select Cryptocurrency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {supportedCryptos.map((crypto) => (
                <button
                  key={crypto.id}
                  onClick={() => createDeposit(crypto)}
                  disabled={isLoading}
                  className="flex items-center space-x-4 p-4 bg-[#1A1C23] rounded-lg border border-[#2A2D3A] hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">{crypto.symbol}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{crypto.name}</div>
                    <div className="text-gray-400 text-sm">{crypto.network} Network</div>
                    <div className="text-gray-400 text-sm">Min: {crypto.minDeposit} {crypto.symbol}</div>
                  </div>
                  <div className="text-blue-400">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Deposit Instructions */
          <div className="bg-[#23262F] rounded-2xl p-6 mb-8 border border-[#2A2D3A]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">
                Deposit {selectedCrypto?.name} ({selectedCrypto?.symbol})
              </h2>
              <button
                onClick={() => {
                  setCurrentDeposit(null);
                  setSelectedCrypto(null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {/* Deposit Address */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Deposit Address ({selectedCrypto?.network} Network)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={currentDeposit.depositAddress}
                    readOnly
                    className="flex-1 px-3 py-2 bg-[#1A1C23] border border-[#2A2D3A] rounded-lg text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(currentDeposit.depositAddress)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* QR Code Placeholder */}
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-[#1A1C23] border border-[#2A2D3A] rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <div className="text-4xl mb-2">📱</div>
                    <div className="text-sm">QR Code</div>
                    <div className="text-xs">Coming Soon</div>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-[#1A1C23] rounded-lg p-4 border border-[#2A2D3A]">
                <h3 className="text-white font-medium mb-3">Important Instructions:</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li>• Send only {selectedCrypto?.symbol} to this address on {selectedCrypto?.network} network</li>
                  <li>• Minimum deposit: {selectedCrypto?.minDeposit} {selectedCrypto?.symbol}</li>
                  <li>• Required confirmations: {currentDeposit.requiredConfirmations}</li>
                  <li>• This address expires in 24 hours</li>
                  <li>• Funds will be credited automatically after confirmation</li>
                </ul>
              </div>

              {/* Status */}
              <div className="flex items-center justify-between p-4 bg-[#1A1C23] rounded-lg border border-[#2A2D3A]">
                <div>
                  <div className="text-white font-medium">Status</div>
                  <div className={`text-sm ${getStatusColor(currentDeposit.status)}`}>
                    {currentDeposit.status}
                  </div>
                </div>
                <div>
                  <div className="text-white font-medium">Confirmations</div>
                  <div className="text-sm text-gray-400">
                    {currentDeposit.confirmations} / {currentDeposit.requiredConfirmations}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Deposit History */}
        {deposits.length > 0 && (
          <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
            <h2 className="text-xl font-semibold text-white mb-6">Deposit History</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#2A2D3A]">
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Date</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Crypto</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Amount</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">USD Value</th>
                    <th className="text-left py-3 px-2 text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-[#2A2D3A] hover:bg-[#1A1C23]">
                      <td className="py-3 px-2 text-gray-300">{formatDate(deposit.createdAt)}</td>
                      <td className="py-3 px-2 text-white">{deposit.cryptocurrency}</td>
                      <td className="py-3 px-2 text-white">
                        {deposit.amount ? `${deposit.amount} ${deposit.cryptocurrency}` : '-'}
                      </td>
                      <td className="py-3 px-2 text-white">
                        {deposit.usdValue ? `$${deposit.usdValue.toFixed(2)}` : '-'}
                      </td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          deposit.status === 'CREDITED' ? 'bg-green-900/30 text-green-400' :
                          deposit.status === 'CONFIRMED' ? 'bg-blue-900/30 text-blue-400' :
                          deposit.status === 'PENDING' ? 'bg-yellow-900/30 text-yellow-400' :
                          'bg-red-900/30 text-red-400'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 