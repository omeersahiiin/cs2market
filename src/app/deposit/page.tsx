'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface WalletInfo {
  symbol: string;
  address: string;
  name: string;
  network: string;
  minDeposit: number;
  icon: string;
}

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<WalletInfo | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rates, setRates] = useState<Record<string, number>>({});

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (session) {
      fetchDepositInfo();
      fetchRates();
    }
  }, [session, status, router]);

  const fetchDepositInfo = async () => {
    try {
      const response = await fetch('/api/crypto/simple-deposit');
      if (response.ok) {
        const data = await response.json();
        setWallets(data.wallets || []);
        setCurrentBalance(data.currentBalance || 0);
      } else {
        setError('Failed to load deposit information');
      }
    } catch (error) {
      console.error('Error fetching deposit info:', error);
      setError('Network error. Please try again.');
    }
  };

  const fetchRates = async () => {
    try {
      const response = await fetch('/api/crypto/simple-deposit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'get-rates' })
      });
      if (response.ok) {
        const data = await response.json();
        setRates(data.rates || {});
      }
    } catch (error) {
      console.error('Error fetching rates:', error);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Show success message (you could add a toast here)
    alert('Address copied to clipboard!');
  };

  const calculateUSDValue = (amount: number, symbol: string) => {
    const rate = rates[symbol] || 0;
    return (amount * rate).toFixed(2);
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
          <div className="mt-4 p-4 bg-[#23262F] rounded-lg border border-[#2A2D3A]">
            <div className="text-sm text-gray-400">Current Balance</div>
            <div className="text-2xl font-bold text-green-400">${currentBalance.toFixed(2)}</div>
          </div>
        </div>

        {error && (
          <div className="bg-red-900/30 border border-red-500 text-red-400 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {!selectedWallet ? (
          /* Crypto Selection */
          <div className="bg-[#23262F] rounded-2xl p-6 mb-8 border border-[#2A2D3A]">
            <h2 className="text-xl font-semibold text-white mb-6">Select Cryptocurrency</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {wallets.map((wallet) => (
                <button
                  key={wallet.symbol}
                  onClick={() => setSelectedWallet(wallet)}
                  disabled={isLoading}
                  className="flex items-center space-x-4 p-4 bg-[#1A1C23] rounded-lg border border-[#2A2D3A] hover:border-blue-500 transition-colors disabled:opacity-50"
                >
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{wallet.icon}</span>
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-white font-medium">{wallet.name}</div>
                    <div className="text-gray-400 text-sm">{wallet.network} Network</div>
                    <div className="text-gray-400 text-sm">Min: {wallet.minDeposit} {wallet.symbol}</div>
                    {rates[wallet.symbol] && (
                      <div className="text-green-400 text-sm">
                        Rate: ${rates[wallet.symbol].toLocaleString()}
                      </div>
                    )}
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
                Deposit {selectedWallet.name} ({selectedWallet.symbol})
              </h2>
              <button
                onClick={() => setSelectedWallet(null)}
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
                  Our {selectedWallet.symbol} Wallet Address ({selectedWallet.network} Network)
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={selectedWallet.address}
                    readOnly
                    className="flex-1 px-3 py-2 bg-[#1A1C23] border border-[#2A2D3A] rounded-lg text-white font-mono text-sm"
                  />
                  <button
                    onClick={() => copyToClipboard(selectedWallet.address)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>

              {/* Current Rate */}
              {rates[selectedWallet.symbol] && (
                <div className="bg-[#1A1C23] rounded-lg p-4 border border-[#2A2D3A]">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Current Rate:</span>
                    <span className="text-green-400 font-bold">
                      1 {selectedWallet.symbol} = ${rates[selectedWallet.symbol].toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    Min deposit: {selectedWallet.minDeposit} {selectedWallet.symbol} 
                    (≈ ${calculateUSDValue(selectedWallet.minDeposit, selectedWallet.symbol)})
                  </div>
                </div>
              )}

              {/* Instructions */}
              <div className="bg-[#1A1C23] rounded-lg p-4 border border-[#2A2D3A]">
                <h3 className="text-white font-medium mb-3">📋 Deposit Instructions:</h3>
                <ol className="space-y-2 text-gray-300 text-sm list-decimal list-inside">
                  <li>Send your {selectedWallet.symbol} to the address above</li>
                  <li>Use only the {selectedWallet.network} network</li>
                  <li>Minimum deposit: {selectedWallet.minDeposit} {selectedWallet.symbol}</li>
                  <li>After sending, contact support with your transaction ID</li>
                  <li>Your balance will be credited after manual verification</li>
                </ol>
              </div>

              {/* Support Contact */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
                <h3 className="text-blue-400 font-medium mb-2">💬 Need Help?</h3>
                <p className="text-gray-300 text-sm mb-3">
                  After making your deposit, please contact our support team with:
                </p>
                <ul className="text-gray-300 text-sm space-y-1 list-disc list-inside">
                  <li>Your transaction ID (TXID)</li>
                  <li>Amount sent</li>
                  <li>Your account email</li>
                </ul>
                <div className="mt-3 flex space-x-4">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Contact Support
                  </button>
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm">
                    Live Chat
                  </button>
                </div>
              </div>

              {/* Warning */}
              <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
                <h3 className="text-red-400 font-medium mb-2">⚠️ Important Warning</h3>
                <ul className="text-gray-300 text-sm space-y-1">
                  <li>• Only send {selectedWallet.symbol} to this address</li>
                  <li>• Wrong network or token will result in permanent loss</li>
                  <li>• Double-check the address before sending</li>
                  <li>• We are not responsible for incorrect deposits</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
            <div className="text-gray-400 text-sm">Supported Cryptos</div>
            <div className="text-white text-2xl font-bold">{wallets.length}</div>
          </div>
          <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
            <div className="text-gray-400 text-sm">Processing Time</div>
            <div className="text-white text-2xl font-bold">~30min</div>
          </div>
          <div className="bg-[#23262F] rounded-lg p-4 border border-[#2A2D3A]">
            <div className="text-gray-400 text-sm">Deposit Fee</div>
            <div className="text-green-400 text-2xl font-bold">FREE</div>
          </div>
        </div>
      </div>
    </div>
  );
} 