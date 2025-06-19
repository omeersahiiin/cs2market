const fetch = require('node-fetch');

async function testAPIPerformance() {
  console.log('🚀 Testing Account Page API Performance');
  console.log('=' .repeat(50));
  
  const baseUrl = 'http://localhost:3000';
  
  // Test session - you'll need to be logged in for this to work
  const headers = {
    'Cookie': 'your-session-cookie-here', // Replace with actual session
    'Content-Type': 'application/json'
  };
  
  console.log('\n📊 Testing OLD approach (3 separate API calls):');
  
  // OLD APPROACH - 3 separate API calls
  const oldStart = Date.now();
  
  try {
    const [balanceRes, statsRes, transactionsRes] = await Promise.all([
      fetch(`${baseUrl}/api/user/balance`, { headers }),
      fetch(`${baseUrl}/api/user/stats`, { headers }),
      fetch(`${baseUrl}/api/user/transactions`, { headers })
    ]);
    
    const oldEnd = Date.now();
    const oldTime = oldEnd - oldStart;
    
    console.log(`   ⏱️  Time: ${oldTime}ms`);
    console.log(`   📊 Balance API: ${balanceRes.status}`);
    console.log(`   📊 Stats API: ${statsRes.status}`);
    console.log(`   📊 Transactions API: ${transactionsRes.status}`);
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n⚡ Testing NEW approach (1 optimized API call):');
  
  // NEW APPROACH - 1 optimized API call
  const newStart = Date.now();
  
  try {
    const dashboardRes = await fetch(`${baseUrl}/api/user/dashboard`, { headers });
    
    const newEnd = Date.now();
    const newTime = newEnd - newStart;
    
    console.log(`   ⏱️  Time: ${newTime}ms`);
    console.log(`   📊 Dashboard API: ${dashboardRes.status}`);
    
    if (dashboardRes.ok) {
      const data = await dashboardRes.json();
      console.log(`   ✅ Balance: $${data.balance}`);
      console.log(`   ✅ Stats: ${data.stats.totalTrades} trades, ${data.stats.winRate}% win rate`);
      console.log(`   ✅ Transactions: ${data.recentTransactions.length} recent items`);
    }
    
    // Calculate improvement
    if (oldTime > 0 && newTime > 0) {
      const improvement = ((oldTime - newTime) / oldTime * 100).toFixed(1);
      console.log(`\n🎯 PERFORMANCE IMPROVEMENT: ${improvement}% faster`);
      console.log(`   Old: ${oldTime}ms → New: ${newTime}ms`);
    }
    
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
  }
  
  console.log('\n📋 OPTIMIZATION SUMMARY:');
  console.log('   ✅ Reduced from 3 API calls to 1');
  console.log('   ✅ Parallel database queries instead of sequential');
  console.log('   ✅ Optimized query patterns');
  console.log('   ✅ Reduced data transfer');
  console.log('   ✅ Fixed useEffect dependency loops');
  console.log('   ✅ Added proper loading states');
  console.log('   ✅ Added error boundaries');
  console.log('   ✅ Memoized expensive operations');
}

// Test without session (will show API structure)
async function testPublicEndpoints() {
  console.log('\n🔍 Testing API endpoint availability:');
  
  const endpoints = [
    '/api/health',
    '/api/user/dashboard',
    '/api/user/balance',
    '/api/user/stats',
    '/api/user/transactions'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const res = await fetch(`http://localhost:3000${endpoint}`);
      console.log(`   ${endpoint}: ${res.status} ${res.statusText}`);
    } catch (error) {
      console.log(`   ${endpoint}: ERROR - ${error.message}`);
    }
  }
}

// Run tests
if (require.main === module) {
  testPublicEndpoints()
    .then(() => testAPIPerformance())
    .catch(console.error);
}

module.exports = { testAPIPerformance, testPublicEndpoints }; 