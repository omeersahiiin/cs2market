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
    
    if (!connectionTest) {
      return NextResponse.json({
        success: false,
        error: 'PriceEmpire API connection failed',
        status
      }, { status: 500 });
    }
    
    // Test individual skin price
    console.log('🔍 Testing individual skin price...');
    const testSkins = [
      { name: 'AK-47 | Redline', wear: 'Field-Tested' },
      { name: 'AWP | Dragon Lore', wear: 'Field-Tested' },
      { name: 'M4A4 | Asiimov', wear: 'Field-Tested' }
    ];
    
    const results = [];
    
    for (const skin of testSkins) {
      const price = await priceEmpireService.getSkinPrice(skin.name, skin.wear);
      results.push({
        skin: `${skin.name} (${skin.wear})`,
        price: price,
        success: price !== null
      });
      
      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test search functionality
    console.log('🔍 Testing search functionality...');
    const searchResults = await priceEmpireService.searchItems('AK-47', 5);
    
    return NextResponse.json({
      success: true,
      message: 'PriceEmpire API integration test completed',
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