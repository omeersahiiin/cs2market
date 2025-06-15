'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface ApiResponse {
  success?: boolean;
  message?: string;
  error?: string;
  details?: any;
  status?: string;
  [key: string]: any;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [migrationResult, setMigrationResult] = useState<ApiResponse | null>(null);
  const [monitoringStatus, setMonitoringStatus] = useState<ApiResponse | null>(null);
  const [binanceStatus, setBinanceStatus] = useState<ApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Allow access for admin email or if not authenticated (for testing)
  const isAdmin = !session || session?.user?.email === 'omeersahiiin8@gmail.com';

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    
    if (status === 'unauthenticated') {
      // Allow access for testing, but show a warning
      return;
    }
    
    if (session && !isAdmin) {
      router.push('/');
      return;
    }
  }, [session, status, isAdmin, router]);

  const runMigration = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/migrate-database', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      setMigrationResult(data);
    } catch (error) {
      setMigrationResult({
        success: false,
        error: 'Failed to run migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkMonitoringStatus = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crypto/monitor-deposits');
      const data = await response.json();
      setMonitoringStatus(data);
    } catch (error) {
      setMonitoringStatus({
        status: 'error',
        error: 'Failed to check monitoring status',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const testBinanceAPI = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/setup-binance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test-credentials' })
      });
      const data = await response.json();
      setBinanceStatus(data);
    } catch (error) {
      setBinanceStatus({
        valid: false,
        error: 'Failed to test Binance API',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const startMonitoring = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/crypto/monitor-deposits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      alert(data.success ? 'Monitoring completed successfully!' : `Error: ${data.error}`);
    } catch (error) {
      alert(`Failed to start monitoring: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-[#0F1419] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F1419] py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-400">Manage crypto deposit system and monitoring</p>
          
          {/* Access Info */}
          {!session && (
            <div className="mt-4 p-4 bg-yellow-900/30 border border-yellow-500/30 rounded-lg">
              <p className="text-yellow-400 text-sm">
                ⚠️ You're accessing admin functions without authentication. 
                For security, please <a href="/auth/signin" className="underline">sign in</a> with admin account.
              </p>
            </div>
          )}
          
          {session && (
            <div className="mt-4 p-4 bg-blue-900/30 border border-blue-500/30 rounded-lg">
              <p className="text-blue-400 text-sm">
                👋 Welcome, {session.user?.email} - Admin Access Granted
              </p>
            </div>
          )}
        </div>

        {/* Step 1: Database Migration */}
        <div className="bg-[#23262F] rounded-2xl p-6 mb-6 border border-[#2A2D3A]">
          <h2 className="text-xl font-semibold text-white mb-4">
            🗄️ Step 1: Database Migration
          </h2>
          <p className="text-gray-400 mb-4">
            Create crypto deposit tables and initialize supported cryptocurrencies
          </p>
          
          <button
            onClick={runMigration}
            disabled={isLoading}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Running Migration...' : 'Run Database Migration'}
          </button>

          {migrationResult && (
            <div className={`p-4 rounded-lg ${
              migrationResult.success 
                ? 'bg-green-900/30 border border-green-500' 
                : 'bg-red-900/30 border border-red-500'
            }`}>
              <h3 className={`font-medium mb-2 ${
                migrationResult.success ? 'text-green-400' : 'text-red-400'
              }`}>
                Migration Result
              </h3>
              <p className="text-gray-300 text-sm mb-2">{migrationResult.message}</p>
              {migrationResult.details && (
                <pre className="text-xs text-gray-400 bg-black/30 p-2 rounded overflow-auto">
                  {JSON.stringify(migrationResult.details, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Binance API Test */}
        <div className="bg-[#23262F] rounded-2xl p-6 mb-6 border border-[#2A2D3A]">
          <h2 className="text-xl font-semibold text-white mb-4">
            🔑 Step 2: Binance API Test
          </h2>
          <p className="text-gray-400 mb-4">
            Test your Binance API credentials for automatic deposit monitoring
          </p>
          
          <button
            onClick={testBinanceAPI}
            disabled={isLoading}
            className="px-6 py-3 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Testing API...' : 'Test Binance API'}
          </button>

          {binanceStatus && (
            <div className={`p-4 rounded-lg ${
              binanceStatus.valid 
                ? 'bg-green-900/30 border border-green-500' 
                : 'bg-red-900/30 border border-red-500'
            }`}>
              <h3 className={`font-medium mb-2 ${
                binanceStatus.valid ? 'text-green-400' : 'text-red-400'
              }`}>
                Binance API Status
              </h3>
              <p className="text-gray-300 text-sm mb-2">{binanceStatus.message}</p>
              {binanceStatus.error && (
                <p className="text-red-400 text-sm">{binanceStatus.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Step 3: Monitoring Status */}
        <div className="bg-[#23262F] rounded-2xl p-6 mb-6 border border-[#2A2D3A]">
          <h2 className="text-xl font-semibold text-white mb-4">
            📊 Step 3: Monitoring Status
          </h2>
          <p className="text-gray-400 mb-4">
            Check if automatic deposit monitoring is ready
          </p>
          
          <button
            onClick={checkMonitoringStatus}
            disabled={isLoading}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Checking Status...' : 'Check Monitoring Status'}
          </button>

          {monitoringStatus && (
            <div className={`p-4 rounded-lg ${
              monitoringStatus.status === 'active' 
                ? 'bg-green-900/30 border border-green-500' 
                : 'bg-yellow-900/30 border border-yellow-500'
            }`}>
              <h3 className={`font-medium mb-2 ${
                monitoringStatus.status === 'active' ? 'text-green-400' : 'text-yellow-400'
              }`}>
                Monitoring Status: {monitoringStatus.status}
              </h3>
              <p className="text-gray-300 text-sm mb-2">{monitoringStatus.message}</p>
              
              {monitoringStatus.requirements && (
                <div className="mt-3">
                  <h4 className="text-white text-sm font-medium mb-2">Requirements:</h4>
                  <ul className="text-sm space-y-1">
                    <li className="text-gray-300">
                      Binance API: {monitoringStatus.requirements.binanceApi}
                    </li>
                    <li className="text-gray-300">
                      Database: {monitoringStatus.requirements.database}
                    </li>
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 4: Start Monitoring */}
        <div className="bg-[#23262F] rounded-2xl p-6 mb-6 border border-[#2A2D3A]">
          <h2 className="text-xl font-semibold text-white mb-4">
            🚀 Step 4: Start Monitoring
          </h2>
          <p className="text-gray-400 mb-4">
            Manually trigger deposit monitoring to test the system
          </p>
          
          <button
            onClick={startMonitoring}
            disabled={isLoading}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 mb-4"
          >
            {isLoading ? 'Starting Monitoring...' : 'Start Deposit Monitoring'}
          </button>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 mt-4">
            <h3 className="text-blue-400 font-medium mb-2">ℹ️ How it works:</h3>
            <ul className="text-gray-300 text-sm space-y-1">
              <li>• Checks your Binance account for new deposits</li>
              <li>• Matches deposits with pending transactions in database</li>
              <li>• Automatically credits user balances</li>
              <li>• Updates deposit statuses to confirmed</li>
            </ul>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-[#23262F] rounded-2xl p-6 border border-[#2A2D3A]">
          <h2 className="text-xl font-semibold text-white mb-4">🔗 Quick Links</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/deposit"
              className="block p-4 bg-[#1A1C23] rounded-lg border border-[#2A2D3A] hover:border-blue-500 transition-colors"
            >
              <h3 className="text-white font-medium">Deposit Page</h3>
              <p className="text-gray-400 text-sm">Test the user deposit interface</p>
            </a>
            <a
              href="/account"
              className="block p-4 bg-[#1A1C23] rounded-lg border border-[#2A2D3A] hover:border-blue-500 transition-colors"
            >
              <h3 className="text-white font-medium">Account Page</h3>
              <p className="text-gray-400 text-sm">View user account and transactions</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 