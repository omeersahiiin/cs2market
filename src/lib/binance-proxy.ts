import { HttpsProxyAgent } from 'https-proxy-agent';
import fetch from 'node-fetch';

interface ProxyConfig {
  host: string;
  port: number;
  username?: string;
  password?: string;
}

export class BinanceProxyAPI {
  private proxyAgent: HttpsProxyAgent | null = null;
  private baseUrl = 'https://api.binance.com';

  constructor() {
    this.setupProxy();
  }

  private setupProxy() {
    // Check for proxy configuration in environment variables
    const proxyHost = process.env.PROXY_HOST;
    const proxyPort = process.env.PROXY_PORT;
    const proxyUser = process.env.PROXY_USERNAME;
    const proxyPass = process.env.PROXY_PASSWORD;

    if (proxyHost && proxyPort) {
      const proxyUrl = proxyUser && proxyPass 
        ? `http://${proxyUser}:${proxyPass}@${proxyHost}:${proxyPort}`
        : `http://${proxyHost}:${proxyPort}`;
      
      this.proxyAgent = new HttpsProxyAgent(proxyUrl);
      console.log('🌐 Proxy configured for Binance API:', proxyHost);
    }
  }

  async makeProxiedRequest(endpoint: string, options: any = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    
    const fetchOptions = {
      ...options,
      agent: this.proxyAgent || undefined
    };

    console.log('🚀 Making proxied request to:', endpoint);
    
    const response = await fetch(url, fetchOptions);
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Binance API Error: ${response.status} - ${error}`);
    }

    return response.json();
  }
}

// Alternative: Use different Binance endpoints
export const BINANCE_ENDPOINTS = {
  main: 'https://api.binance.com',
  backup1: 'https://api1.binance.com',
  backup2: 'https://api2.binance.com',
  backup3: 'https://api3.binance.com',
  // Some regions have different endpoints
  alternative: 'https://api.binance.cc'
};

export async function testBinanceEndpoints(apiKey: string, secretKey: string) {
  const endpoints = Object.entries(BINANCE_ENDPOINTS);
  
  for (const [name, url] of endpoints) {
    try {
      console.log(`🧪 Testing ${name} endpoint: ${url}`);
      
      const timestamp = Date.now();
      const queryString = `timestamp=${timestamp}`;
      const signature = require('crypto')
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest('hex');
      
      const testUrl = `${url}/api/v3/account?${queryString}&signature=${signature}`;
      
      const response = await fetch(testUrl, {
        headers: {
          'X-MBX-APIKEY': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        console.log(`✅ ${name} endpoint works!`);
        return { working: true, endpoint: url, name };
      } else {
        console.log(`❌ ${name} endpoint failed:`, response.status);
      }
    } catch (error) {
      console.log(`❌ ${name} endpoint error:`, error);
    }
  }
  
  return { working: false, endpoint: null, name: null };
} 