import { NextResponse } from 'next/server';
import { PriceEmpireService } from '@/lib/priceEmpireService';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    console.log('🧪 Testing PriceEmpire API integration...');
    
    const priceEmpireService = PriceEmpireService.getInstance();
    
    // Check service status
    const status = priceEmpireService.getStatus();
    console.log('📊 PriceEmpire Status:', status);
    
    // Test connection
    const connectionTest = await priceEmpireService.testConnection();
    
    // Test individual skin prices with better error handling
    console.log('🔍 Testing individual skin prices...');
    const testSkins = [
      { name: 'AK-47 | Redline', wear: 'Field-Tested' },
      { name: 'AWP | Dragon Lore', wear: 'Field-Tested' },
      { name: 'M4A4 | Asiimov', wear: 'Field-Tested' },
      { name: 'AK-47 | Vulcan', wear: 'Minimal Wear' },
      { name: 'AWP | Asiimov', wear: 'Field-Tested' }
    ];
    
    const results = [];
    let successCount = 0;
    
    for (const skin of testSkins) {
      try {
        const price = await priceEmpireService.getSkinPrice(skin.name, skin.wear);
        const success = price !== null && price > 0;
        
        results.push({
          skin: `${skin.name} (${skin.wear})`,
          price: price,
          success: success
        });
        
        if (success) successCount++;
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        console.error(`Error testing ${skin.name}:`, error);
        results.push({
          skin: `${skin.name} (${skin.wear})`,
          price: null,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    const searchResults = await priceEmpireService.searchItems('AK-47', 5);
    
    // Test batch pricing
    console.log('📦 Testing batch pricing...');
    const batchTest = await priceEmpireService.getBatchPrices([
      { name: 'AK-47 | Redline', wear: 'Field-Tested' },
      { name: 'AWP | Asiimov', wear: 'Field-Tested' }
    ]);
    
    const overallSuccess = connectionTest && successCount >= 3; // At least 3 out of 5 should work
    
    return NextResponse.json({
      success: overallSuccess,
      message: `PriceEmpire integration test completed - ${successCount}/${testSkins.length} prices retrieved`,
      status,
      connectionTest,
      priceTests: results,
      searchTest: {
        query: 'AK-47',
        resultsCount: searchResults.length,
        results: searchResults.slice(0, 3).map(item => ({
          name: item.market_hash_name,
          price: item.suggested_price || item.mean_price,
          currency: item.currency
        }))
      },
      batchTest: {
        requested: 2,
        received: batchTest.size,
        prices: Array.from(batchTest.entries()).map(([key, price]) => ({
          skin: key,
          price: price
        }))
      },
      summary: {
        totalTests: testSkins.length,
        successfulPrices: successCount,
        successRate: `${Math.round((successCount / testSkins.length) * 100)}%`,
        systemStatus: overallSuccess ? 'WORKING' : 'PARTIAL',
        recommendation: overallSuccess ? 
          'System is ready for production use!' : 
          'System is partially working - some price lookups may fail'
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ PriceEmpire test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: 'PriceEmpire test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
} 