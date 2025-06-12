// Mock data system for when database is unavailable
export const MOCK_USERS = [
  {
    id: 'mock-user-1',
    email: 'omeersahiiin8@gmail.com',
    username: 'omeersahiiin8',
    password: 'test123', // In real app, this would be hashed
    balance: 10000
  },
  {
    id: 'mock-user-2', 
    email: 'trader2@example.com',
    username: 'trader2',
    password: 'test456',
    balance: 15000
  },
  {
    id: 'mock-user-3',
    email: 'marketmaker@cs2derivatives.com',
    username: 'marketmaker', 
    password: 'marketmaker123',
    balance: 0
  }
];

export const MOCK_SKINS = [
  {
    id: 'skin-1',
    name: 'AWP | Dragon Lore',
    type: 'Sniper Rifle',
    rarity: 'Contraband',
    wear: 'Field-Tested',
    price: 7500.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g',
    priceChange: 170.1,
    priceChangePercent: 2.3,
    volume24h: 1250000,
    marketCap: 45000000,
    category: 'Sniper',
    collection: 'Cobblestone Collection',
    float: 0.25,
    popularity: 95,
    tradingData: {
      currentPrice: 7500.00,
      dayHigh: 7650.00,
      dayLow: 7350.00,
      volume: 125,
      priceHistory: generatePriceHistory(7500.00, 24)
    }
  },
  {
    id: 'skin-2',
    name: 'AK-47 | Vulcan',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Minimal Wear',
    price: 185.75,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-UdsZGHyd4_Bd1RvNQ7T_FDrw-_ng5Pu75iY1zI97bhJJJJJ',
    priceChange: -17.1,
    priceChangePercent: -9.2,
    volume24h: 850000,
    marketCap: 12000000,
    category: 'Rifle',
    collection: 'Operation Breakout Collection',
    float: 0.08,
    popularity: 88,
    tradingData: {
      currentPrice: 185.75,
      dayHigh: 195.50,
      dayLow: 180.25,
      volume: 89,
      priceHistory: generatePriceHistory(185.75, 24)
    }
  },
  {
    id: 'skin-3',
    name: 'AWP | Asiimov',
    type: 'Sniper Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 151.25,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2P9o6migzl_Us5ZmCmLYDDJgU9NA6B81S5yezvg8e-7cycnXJgvHZx5WGdwUJqz1Tl4g',
    priceChange: 4.4,
    priceChangePercent: 2.9,
    volume24h: 650000,
    marketCap: 8500000,
    category: 'Sniper',
    collection: 'Phoenix Collection',
    float: 0.35,
    popularity: 92,
    tradingData: {
      currentPrice: 151.25,
      dayHigh: 155.00,
      dayLow: 148.75,
      volume: 67,
      priceHistory: generatePriceHistory(151.25, 24)
    }
  },
  {
    id: 'skin-4',
    name: 'M4A4 | Asiimov',
    type: 'Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 109.99,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GlUucFwjruR9t7231DmrRc_NW7yItCRcVNoYVHS-APrwbzu0JK-78nXiSw0EnwDRM0',
    priceChange: -3.5,
    priceChangePercent: -3.2,
    volume24h: 420000,
    marketCap: 6200000,
    category: 'Rifle',
    collection: 'Phoenix Collection',
    float: 0.28,
    popularity: 85,
    tradingData: {
      currentPrice: 109.99,
      dayHigh: 115.50,
      dayLow: 108.25,
      volume: 45,
      priceHistory: generatePriceHistory(109.99, 24)
    }
  },
  {
    id: 'skin-5',
    name: 'Karambit | Fade',
    type: 'Knife',
    rarity: 'Covert',
    wear: 'Factory New',
    price: 2850.00,
    iconPath: '-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpovbSsLQJf0ebcZThQ6tOlq4GGqPP7IYTck29Y_chOhuDG_Zi72gzj-kVpMGGhJoaVcVU3aV7V_1K9wOjxxcjrJJJJJJJJ',
    priceChange: 125.0,
    priceChangePercent: 4.6,
    volume24h: 2100000,
    marketCap: 35000000,
    category: 'Knife',
    collection: 'Dust Collection',
    float: 0.01,
    popularity: 98,
    tradingData: {
      currentPrice: 2850.00,
      dayHigh: 2920.00,
      dayLow: 2780.00,
      volume: 23,
      priceHistory: generatePriceHistory(2850.00, 24)
    }
  }
];

function generatePriceHistory(basePrice: number, hours: number) {
  const history = [];
  let currentPrice = basePrice;
  
  for (let i = hours; i >= 0; i--) {
    // Generate realistic price movement (±2% random walk)
    const change = (Math.random() - 0.5) * 0.04; // ±2%
    currentPrice = currentPrice * (1 + change);
    
    history.push({
      timestamp: new Date(Date.now() - i * 60 * 60 * 1000).toISOString(),
      price: Math.round(currentPrice * 100) / 100,
      volume: Math.floor(Math.random() * 50) + 10
    });
  }
  
  return history;
}

export const MOCK_ORDER_BOOK = {
  bids: [
    { price: 7492.50, quantity: 2, total: 14985.00 },
    { price: 7485.00, quantity: 6, total: 44910.00 },
    { price: 7477.50, quantity: 8, total: 59820.00 },
    { price: 7470.00, quantity: 2, total: 14940.00 },
    { price: 7462.50, quantity: 6, total: 44775.00 },
    { price: 7455.00, quantity: 6, total: 44730.00 },
    { price: 7447.50, quantity: 8, total: 59580.00 },
    { price: 7440.00, quantity: 6, total: 44640.00 },
    { price: 7432.50, quantity: 9, total: 66892.50 },
    { price: 7425.00, quantity: 2, total: 14850.00 }
  ],
  asks: [
    { price: 7507.50, quantity: 2, total: 15015.00 },
    { price: 7515.00, quantity: 3, total: 22545.00 },
    { price: 7522.50, quantity: 5, total: 37612.50 },
    { price: 7530.00, quantity: 8, total: 60240.00 },
    { price: 7537.50, quantity: 6, total: 45225.00 },
    { price: 7545.00, quantity: 2, total: 15090.00 },
    { price: 7552.50, quantity: 4, total: 30210.00 },
    { price: 7560.00, quantity: 10, total: 75600.00 },
    { price: 7567.50, quantity: 1, total: 7567.50 },
    { price: 7575.00, quantity: 8, total: 60600.00 }
  ]
};

export const MOCK_RECENT_TRADES = [
  { price: 7500.00, quantity: 1, timestamp: new Date(Date.now() - 30000).toISOString(), side: 'buy' },
  { price: 7498.50, quantity: 2, timestamp: new Date(Date.now() - 45000).toISOString(), side: 'sell' },
  { price: 7501.25, quantity: 1, timestamp: new Date(Date.now() - 60000).toISOString(), side: 'buy' },
  { price: 7499.75, quantity: 3, timestamp: new Date(Date.now() - 90000).toISOString(), side: 'sell' },
  { price: 7502.00, quantity: 1, timestamp: new Date(Date.now() - 120000).toISOString(), side: 'buy' }
];

export const MOCK_FLOAT_ANALYSIS = {
  floatValue: 0.15234567,
  floatRank: 1247,
  totalItems: 15678,
  floatPercentile: 92.1,
  pattern: 387,
  paintSeed: 168,
  rarity: 'Rare Pattern',
  estimatedValue: 7650.00,
  confidence: 'High'
};

export const MOCK_WEAR_ANALYSIS = {
  wearRating: 'Field-Tested',
  wearValue: 0.25,
  condition: 'Good',
  durability: 85,
  marketDemand: 'High',
  priceImpact: '+5.2%'
};

// Helper function to check if we should use mock data
export function shouldUseMockData(): boolean {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined') {
    // In browser, always use mock data for now (since database is down)
    return true;
  }
  
  // Server-side check
  return process.env.USE_MOCK_DATA === 'true' || 
         process.env.NODE_ENV === 'development' ||
         !process.env.DATABASE_URL ||
         process.env.DATABASE_URL.includes('mock');
}

// Mock authentication
export function mockAuthenticate(email: string, password: string) {
  const user = MOCK_USERS.find(u => u.email === email && u.password === password);
  if (user) {
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
  return null;
} 