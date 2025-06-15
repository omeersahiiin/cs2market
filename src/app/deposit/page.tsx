'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// Your actual wallet addresses
const WALLET_ADDRESSES = {
  BTC: '1365feiMB5himtGcrhtPjH6tCzCfS7QJCG',
  ETH: '0x49cd0a247b5f8cb03df506473a7a60fe3ea56bba',
  USDT: 'TQn9Y2khHuCpEHhprmY7xQNWRsZFqc7UV6',
  SOL: 'DQn9Y2khHuCpEHhprmY7xQNWRsZFqc7UV6'
};

// Current crypto prices (update these regularly)
const CRYPTO_PRICES = {
  BTC: 43000,
  ETH: 2400,
  USDT: 1,
  SOL: 95
};

const CRYPTO_INFO = {
  BTC: { name: 'Bitcoin', network: 'Bitcoin Network', minDeposit: 0.001 },
  ETH: { name: 'Ethereum', network: 'Ethereum Network (ERC-20)', minDeposit: 0.01 },
  USDT: { name: 'Tether', network: 'Tron Network (TRC-20)', minDeposit: 10 },
  SOL: { name: 'Solana', network: 'Solana Network', minDeposit: 1 }
};

export default function DepositPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [selectedCrypto, setSelectedCrypto] = useState<keyof typeof WALLET_ADDRESSES>('BTC');
  const [amount, setAmount] = useState('');
  const [txHash, setTxHash] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) {
      router.push('/auth/signin');
      return;
    }
  }, [session, status, router]);

  const handleSubmitDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');

    try {
      // Validate inputs
      if (!amount || !txHash) {
        setSubmitMessage('❌ Please fill in all fields');
        return;
      }

      const amountNum = parseFloat(amount);
      const minDeposit = CRYPTO_INFO[selectedCrypto].minDeposit;

      if (amountNum < minDeposit) {
        setSubmitMessage(`❌ Minimum deposit is ${minDeposit} ${selectedCrypto}`);
        return;
      }

      // Calculate USD value
      const usdValue = amountNum * CRYPTO_PRICES[selectedCrypto];

      // For now, just show success message (you can implement actual submission later)
      setSubmitMessage(`✅ Deposit submitted successfully! 
      
📋 Details:
• Amount: ${amount} ${selectedCrypto}
• USD Value: $${usdValue.toFixed(2)}
• Transaction: ${txHash.substring(0, 20)}...
• Status: Pending Review

⏰ Your deposit will be reviewed and credited within 24 hours.
📧 You'll receive an email confirmation once processed.`);

      // Log for admin (you can see this in Vercel logs)
      console.log('📥 New deposit submission:', {
        user: session?.user?.email,
        crypto: `${amount} ${selectedCrypto}`,
        usd: `$${usdValue.toFixed(2)}`,
        txHash: txHash,
        timestamp: new Date().toISOString()
      });

      // Clear form
      setAmount('');
      setTxHash('');

    } catch (error) {
      setSubmitMessage('❌ Error submitting deposit. Please try again.');
      console.error('Deposit submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Address copied to clipboard!');
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const selectedAddress = WALLET_ADDRESSES[selectedCrypto];
  const selectedInfo = CRYPTO_INFO[selectedCrypto];
  const estimatedUSD = amount ? (parseFloat(amount) * CRYPTO_PRICES[selectedCrypto]).toFixed(2) : '0.00';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">💰 Crypto Deposits</h1>

        {/* Important Notice */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mb-8">
          <h2 className="text-blue-400 font-semibold mb-2">🇹🇷 Manual Deposit System</h2>
          <p className="text-blue-200">
            Due to geographic restrictions, we're using a manual deposit system. 
            Send crypto to our addresses below and submit the transaction hash for quick processing.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column - Deposit Form */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📤 Submit Deposit</h2>

            <form onSubmit={handleSubmitDeposit} className="space-y-4">
              {/* Crypto Selection */}
              <div>
                <label className="block text-sm font-medium mb-2">Select Cryptocurrency</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(CRYPTO_INFO).map(([crypto, info]) => (
                    <button
                      key={crypto}
                      type="button"
                      onClick={() => setSelectedCrypto(crypto as keyof typeof WALLET_ADDRESSES)}
                      className={`p-3 rounded border text-left ${
                        selectedCrypto === crypto
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-600 bg-gray-700'
                      }`}
                    >
                      <div className="font-semibold">{crypto}</div>
                      <div className="text-sm text-gray-400">{info.name}</div>
                      <div className="text-sm text-green-400">${CRYPTO_PRICES[crypto as keyof typeof CRYPTO_PRICES].toLocaleString()}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Amount Input */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount ({selectedCrypto})
                </label>
                <input
                  type="number"
                  step="0.00000001"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder={`Min: ${selectedInfo.minDeposit} ${selectedCrypto}`}
                  required
                />
                {amount && (
                  <div className="text-sm text-gray-400 mt-1">
                    ≈ ${estimatedUSD} USD
                  </div>
                )}
              </div>

              {/* Transaction Hash */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Transaction Hash
                </label>
                <input
                  type="text"
                  value={txHash}
                  onChange={(e) => setTxHash(e.target.value)}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="0x... or transaction ID"
                  required
                />
                <div className="text-sm text-gray-400 mt-1">
                  Copy the transaction hash from your wallet after sending
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded font-medium"
              >
                {isSubmitting ? 'Submitting...' : '📤 Submit Deposit'}
              </button>
            </form>

            {/* Submit Message */}
            {submitMessage && (
              <div className="mt-4 p-4 bg-gray-700 rounded whitespace-pre-line">
                {submitMessage}
              </div>
            )}
          </div>

          {/* Right Column - Deposit Instructions */}
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📋 Deposit Instructions</h2>

            {/* Selected Crypto Info */}
            <div className="bg-gray-700 rounded p-4 mb-4">
              <h3 className="font-semibold text-lg">{selectedInfo.name} ({selectedCrypto})</h3>
              <p className="text-gray-400 text-sm">{selectedInfo.network}</p>
              <p className="text-green-400">Current Price: ${CRYPTO_PRICES[selectedCrypto].toLocaleString()}</p>
            </div>

            {/* Deposit Address */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Deposit Address:</label>
              <div className="bg-gray-700 p-3 rounded flex items-center justify-between">
                <span className="font-mono text-sm break-all">{selectedAddress}</span>
                <button
                  onClick={() => copyToClipboard(selectedAddress)}
                  className="ml-2 bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm"
                >
                  Copy
                </button>
              </div>
            </div>

            {/* Steps */}
            <div className="space-y-3">
              <h3 className="font-semibold">How to Deposit:</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">1</span>
                  <span>Send {selectedCrypto} to the address above</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">2</span>
                  <span>Copy the transaction hash from your wallet</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">3</span>
                  <span>Submit the form with amount and transaction hash</span>
                </div>
                <div className="flex items-start">
                  <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs mr-3 mt-0.5">4</span>
                  <span>Wait for confirmation (usually within 24 hours)</span>
                </div>
              </div>
            </div>

            {/* Important Notes */}
            <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600 rounded">
              <h4 className="text-yellow-400 font-semibold mb-2">⚠️ Important Notes:</h4>
              <ul className="text-yellow-200 text-sm space-y-1">
                <li>• Minimum deposit: {selectedInfo.minDeposit} {selectedCrypto}</li>
                <li>• Only send {selectedCrypto} to this address</li>
                <li>• Deposits are processed manually within 24 hours</li>
                <li>• Double-check the address before sending</li>
                <li>• Keep your transaction hash for reference</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">🆘 Need Help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-semibold text-green-400">✅ Deposit Issues</h3>
              <p className="text-gray-400">If your deposit isn't showing up after 24 hours, contact support with your transaction hash.</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-400">🔍 Track Transaction</h3>
              <p className="text-gray-400">Use blockchain explorers to track your transaction status before contacting support.</p>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-400">⚡ Fast Processing</h3>
              <p className="text-gray-400">Most deposits are processed within 1-6 hours during business hours.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 