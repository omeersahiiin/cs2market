'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Deposit {
  id: string;
  user: {
    email: string;
    name: string;
  };
  cryptoType: string;
  amount: number;
  usdValue: number;
  transactionHash: string;
  status: string;
  createdAt: string;
  confirmedAt?: string;
  notes?: string;
}

export default function AdminDepositsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);

  // Manual deposit form state
  const [manualForm, setManualForm] = useState({
    userEmail: '',
    cryptoType: 'BTC',
    amount: '',
    transactionHash: '',
    notes: ''
  });

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user?.email || !session.user.email.includes('admin')) {
      router.push('/');
      return;
    }

    fetchDeposits();
  }, [session, status, router]);

  const fetchDeposits = async () => {
    try {
      const response = await fetch('/api/admin/manual-deposit');
      const data = await response.json();
      
      if (data.success) {
        setDeposits(data.deposits);
      }
    } catch (error) {
      console.error('Error fetching deposits:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmManualDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    setConfirming('manual');

    try {
      const response = await fetch('/api/admin/manual-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(manualForm),
      });

      const data = await response.json();

      if (data.success) {
        alert(`✅ Deposit confirmed! User balance updated with $${data.deposit.usdValue}`);
        setManualForm({
          userEmail: '',
          cryptoType: 'BTC',
          amount: '',
          transactionHash: '',
          notes: ''
        });
        fetchDeposits(); // Refresh the list
      } else {
        alert(`❌ Error: ${data.message}`);
      }
    } catch (error) {
      alert('❌ Failed to confirm deposit');
      console.error('Error:', error);
    } finally {
      setConfirming(null);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!session?.user?.email || !session.user.email.includes('admin')) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400">Access Denied - Admin Only</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">🇹🇷 Admin - Manual Crypto Deposits</h1>
        
        <div className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 mb-8">
          <h2 className="text-yellow-400 font-semibold mb-2">🚨 Turkey-Specific Notice</h2>
          <p className="text-yellow-200">
            Due to Binance restrictions in Turkey, we're using manual deposit confirmation. 
            Consider integrating with Turkish exchanges like <strong>Paribu</strong> or <strong>BtcTurk</strong> for automation.
          </p>
        </div>

        {/* Manual Deposit Confirmation Form */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">✅ Confirm Manual Deposit</h2>
          
          <form onSubmit={confirmManualDeposit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">User Email</label>
                <input
                  type="email"
                  value={manualForm.userEmail}
                  onChange={(e) => setManualForm({...manualForm, userEmail: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="user@example.com"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Crypto Type</label>
                <select
                  value={manualForm.cryptoType}
                  onChange={(e) => setManualForm({...manualForm, cryptoType: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                >
                  <option value="BTC">Bitcoin (BTC)</option>
                  <option value="ETH">Ethereum (ETH)</option>
                  <option value="USDT">Tether (USDT)</option>
                  <option value="SOL">Solana (SOL)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Amount</label>
                <input
                  type="number"
                  step="0.00000001"
                  value={manualForm.amount}
                  onChange={(e) => setManualForm({...manualForm, amount: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="0.001"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Transaction Hash</label>
                <input
                  type="text"
                  value={manualForm.transactionHash}
                  onChange={(e) => setManualForm({...manualForm, transactionHash: e.target.value})}
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                  placeholder="0x..."
                  required
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Notes (Optional)</label>
              <textarea
                value={manualForm.notes}
                onChange={(e) => setManualForm({...manualForm, notes: e.target.value})}
                className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2"
                rows={2}
                placeholder="Additional notes about this deposit..."
              />
            </div>
            
            <button
              type="submit"
              disabled={confirming === 'manual'}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded font-medium"
            >
              {confirming === 'manual' ? 'Confirming...' : '✅ Confirm Deposit'}
            </button>
          </form>
        </div>

        {/* Deposits History */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">📋 Recent Deposits</h2>
          
          {deposits.length === 0 ? (
            <p className="text-gray-400">No deposits found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2">User</th>
                    <th className="text-left py-2">Crypto</th>
                    <th className="text-left py-2">Amount</th>
                    <th className="text-left py-2">USD Value</th>
                    <th className="text-left py-2">TX Hash</th>
                    <th className="text-left py-2">Status</th>
                    <th className="text-left py-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-b border-gray-700/50">
                      <td className="py-2">
                        <div>
                          <div className="font-medium">{deposit.user.name || 'N/A'}</div>
                          <div className="text-gray-400 text-xs">{deposit.user.email}</div>
                        </div>
                      </td>
                      <td className="py-2">
                        <span className="bg-blue-600 px-2 py-1 rounded text-xs">
                          {deposit.cryptoType}
                        </span>
                      </td>
                      <td className="py-2 font-mono">{deposit.amount}</td>
                      <td className="py-2 font-mono text-green-400">${deposit.usdValue}</td>
                      <td className="py-2">
                        <span className="font-mono text-xs bg-gray-700 px-2 py-1 rounded">
                          {deposit.transactionHash.substring(0, 10)}...
                        </span>
                      </td>
                      <td className="py-2">
                        <span className={`px-2 py-1 rounded text-xs ${
                          deposit.status === 'CONFIRMED' 
                            ? 'bg-green-600' 
                            : 'bg-yellow-600'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="py-2 text-gray-400 text-xs">
                        {new Date(deposit.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="bg-blue-900/20 border border-blue-600 rounded-lg p-4 mt-8">
          <h3 className="text-blue-400 font-semibold mb-2">📖 How to Use</h3>
          <ol className="text-blue-200 space-y-1 text-sm">
            <li>1. User sends crypto to your provided wallet addresses</li>
            <li>2. User provides transaction hash and details</li>
            <li>3. Verify the transaction on blockchain explorer</li>
            <li>4. Use the form above to confirm and credit user balance</li>
            <li>5. User balance is automatically updated in USD equivalent</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 