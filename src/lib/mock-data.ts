// Mock data system for when database is unavailable

// Global state for mock data (in a real app, this would be in a database)
let mockOrdersState: any[] = [];
let mockTradesState: any[] = [];
let mockPositionsState: any[] = [];
let mockOrderBookState = {
  bids: [] as any[],
  asks: [] as any[]
};

// Reset mock order book to only show real orders
export function resetMockOrderBook() {
  mockOrderBookState = {
    bids: [],
    asks: []
  };
}

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
  // Ultra High Liquidity Items (Most Traded) - Using reliable Cloudflare CDN URLs
  {
    id: 'skin-1',
    name: 'AWP | Dragon Lore',
    type: 'Sniper Rifle',
    rarity: 'Contraband',
    wear: 'Field-Tested',
    price: 7500.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17P7NdTRH-t26q4SZlvD7PYTQgXtu5Mx2gv2PrdSijAWwqkVtN272JIGdJw46YVrYqVO3xLy-gJC9u5vByCBh6ygi7WGdwUKTYdRD8A',
    priceChange: 200.9,
    priceChangePercent: 2.7,
    volume24h: 2500000,
    marketCap: 85000000,
    category: 'Sniper',
    collection: 'Cobblestone Collection',
    float: 0.25,
    popularity: 98,
    tradingData: {
      currentPrice: 7500.00,
      dayHigh: 7650.00,
      dayLow: 7350.00,
      volume: 185,
      priceHistory: generatePriceHistory(7500.00, 24)
    }
  },
  {
    id: 'skin-2',
    name: 'AK-47 | Fire Serpent',
    type: 'Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 1250.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszOeC9H_9mkhIWFg8j1OO-GqWlD6dN-teHE9Jrsxgfn_hBvMm6nIoaRIQA9aVqF8ljrxuu-jZfv6J_PnXQw73Ii4nqJzBGpwUYbKJ7O0IM',
    priceChange: 65.0,
    priceChangePercent: 5.5,
    volume24h: 1800000,
    marketCap: 32000000,
    category: 'Rifle',
    collection: 'Bravo Collection',
    float: 0.22,
    popularity: 95,
    tradingData: {
      currentPrice: 1250.00,
      dayHigh: 1285.00,
      dayLow: 1220.00,
      volume: 425,
      priceHistory: generatePriceHistory(1250.00, 24)
    }
  },
  {
    id: 'skin-3',
    name: 'AWP | Asiimov',
    type: 'Sniper Rifle',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 151.25,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAR17PLfYQJD_9W7m5a0mvLwOq7c2DMBupQn2eqVotqkiwHiqhdlMmigJtOWJwE5Zw3X8wS-yea8jcDo7c7XiSw0g89L9us',
    priceChange: -9.5,
    priceChangePercent: -6.3,
    volume24h: 1650000,
    marketCap: 28500000,
    category: 'Sniper',
    collection: 'Phoenix Collection',
    float: 0.35,
    popularity: 94,
    tradingData: {
      currentPrice: 151.25,
      dayHigh: 165.00,
      dayLow: 148.75,
      volume: 387,
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
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJQJD_9W7m5a0mvLwOq7c2GpQ7JMg0uyYoYin2wHj-kU6YGD0cYOUcFA9YFnS_AC9xeq508K0us7XiSw0vgXM_Rw',
    priceChange: -5.3,
    priceChangePercent: -4.8,
    volume24h: 1420000,
    marketCap: 22200000,
    category: 'Rifle',
    collection: 'Phoenix Collection',
    float: 0.28,
    popularity: 92,
    tradingData: {
      currentPrice: 109.99,
      dayHigh: 115.50,
      dayLow: 108.25,
      volume: 298,
      priceHistory: generatePriceHistory(109.99, 24)
    }
  },
  {
    id: 'skin-5',
    name: 'AK-47 | Vulcan',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Minimal Wear',
    price: 185.75,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV086jloKOhcj5Nr_Yg2Yf6cR02LmS9tn3ilK1qBVkMGzyIICRdgRvYVCDqwTsyO7n1JTo6M7PwGwj5Hei-fvc4A',
    priceChange: 11.5,
    priceChangePercent: 6.2,
    volume24h: 1350000,
    marketCap: 18000000,
    category: 'Rifle',
    collection: 'Operation Breakout Collection',
    float: 0.08,
    popularity: 91,
    tradingData: {
      currentPrice: 185.75,
      dayHigh: 195.50,
      dayLow: 180.25,
      volume: 267,
      priceHistory: generatePriceHistory(185.75, 24)
    }
  },
  {
    id: 'skin-6',
    name: 'M4A4 | Howl',
    type: 'Rifle',
    rarity: 'Contraband',
    wear: 'Field-Tested',
    price: 4250.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhjxszFJTwT09S5g4yCmfDLP7LWnn8f6pIl2-yYp9SnjA23-BBuNW-iLI-XJgFsZQyG_VW2lOq918e8uszLn2wj5HeAvkVdtQ',
    priceChange: 185.0,
    priceChangePercent: 4.6,
    volume24h: 2800000,
    marketCap: 65000000,
    category: 'Rifle',
    collection: 'Huntsman Collection',
    float: 0.18,
    popularity: 97,
    tradingData: {
      currentPrice: 4250.00,
      dayHigh: 4380.00,
      dayLow: 4150.00,
      volume: 89,
      priceHistory: generatePriceHistory(4250.00, 24)
    }
  },
  // High Liquidity Items
  {
    id: 'skin-7',
    name: 'AWP | Lightning Strike',
    type: 'Sniper Rifle',
    rarity: 'Classified',
    wear: 'Factory New',
    price: 425.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZt7P_BdjVW4tW4k7-KgOfLP7LWnn8fsJEh0uuR9I6m3gbi_Bc_Zm6ncISWdw42ZwvX8gfoku3s15Tu6czKySZgu3U8pSGKta3IN2E',
    priceChange: 18.5,
    priceChangePercent: 4.6,
    volume24h: 1200000,
    marketCap: 25000000,
    category: 'Sniper',
    collection: 'eSports 2013 Collection',
    float: 0.01,
    popularity: 89,
    tradingData: {
      currentPrice: 425.00,
      dayHigh: 445.00,
      dayLow: 415.00,
      volume: 312,
      priceHistory: generatePriceHistory(425.00, 24)
    }
  },
  {
    id: 'skin-8',
    name: 'Desert Eagle | Blaze',
    type: 'Pistol',
    rarity: 'Restricted',
    wear: 'Factory New',
    price: 385.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposr-kLAtl7PLJTjtO7dGzh7-HnvD8J_XSwGkG65d1juqZp4rz3VLhrhc_azqhJtORdgM4YFvR-1C5wry5gpHqot2XnpVn5DmP',
    priceChange: 15.5,
    priceChangePercent: 4.2,
    volume24h: 950000,
    marketCap: 18500000,
    category: 'Pistol',
    collection: 'Dust Collection',
    float: 0.01,
    popularity: 86,
    tradingData: {
      currentPrice: 385.00,
      dayHigh: 395.00,
      dayLow: 375.00,
      volume: 456,
      priceHistory: generatePriceHistory(385.00, 24)
    }
  },
  {
    id: 'skin-9',
    name: 'USP-S | Kill Confirmed',
    type: 'Pistol',
    rarity: 'Covert',
    wear: 'Field-Tested',
    price: 78.90,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpoo6m1FBRp3_bGcjhQ09-jq5WYh8j_OrfdqWhe5sN4mOTE8bP5gVO8v106NT37LY-cJAZvZF-ErAC7wLi60MO57s7NwSBgvSgksynamEfmiRBJcKUx0nUflmj0',
    priceChange: -3.2,
    priceChangePercent: -3.9,
    volume24h: 680000,
    marketCap: 12500000,
    category: 'Pistol',
    collection: 'Gamma Collection',
    float: 0.25,
    popularity: 87,
    tradingData: {
      currentPrice: 78.90,
      dayHigh: 82.50,
      dayLow: 77.80,
      volume: 198,
      priceHistory: generatePriceHistory(78.90, 24)
    }
  },
  {
    id: 'skin-10',
    name: 'Glock-18 | Fade',
    type: 'Pistol',
    rarity: 'Restricted',
    wear: 'Factory New',
    price: 285.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgposbaqKAxf0vL3dzxG6eO6nYeDg7n1a-6GkDoC7pMp3rGYpNqiiQ23-UM5ZT-hcIeQJgZsMFvR_lTox7i-m9bi6-pjfulG',
    priceChange: 12.8,
    priceChangePercent: 4.7,
    volume24h: 1100000,
    marketCap: 22000000,
    category: 'Pistol',
    collection: 'Dust Collection',
    float: 0.01,
    popularity: 88,
    tradingData: {
      currentPrice: 285.00,
      dayHigh: 295.00,
      dayLow: 278.00,
      volume: 178,
      priceHistory: generatePriceHistory(285.00, 24)
    }
  },
  // Medium-High Liquidity Items
  {
    id: 'skin-11',
    name: 'AK-47 | Case Hardened',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Field-Tested',
    price: 185.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhhwszHeDFH6OO6nYeDg7mhYe6Bw24H7cQm3rnFrdj23gHk-BJrMDr3dtDDclQ2YVnQ-AW4lem8m9bi65T-nsCo',
    priceChange: 8.5,
    priceChangePercent: 4.8,
    volume24h: 850000,
    marketCap: 15000000,
    category: 'Rifle',
    collection: 'Arms Deal Collection',
    float: 0.28,
    popularity: 85,
    tradingData: {
      currentPrice: 185.00,
      dayHigh: 192.00,
      dayLow: 180.00,
      volume: 156,
      priceHistory: generatePriceHistory(185.00, 24)
    }
  },
  {
    id: 'skin-12',
    name: 'M4A1-S | Knight',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Factory New',
    price: 1850.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO3mb-GkuP1P6jummJW4NE_3euYoNujiVHj_Eo-YjunJoKcIAc8Z1jX-gK8k7y6h5O4vZXIyiNisj5iuyg-Y-6U4A',
    priceChange: 95.0,
    priceChangePercent: 5.4,
    volume24h: 2200000,
    marketCap: 38000000,
    category: 'Rifle',
    collection: 'Cobblestone Collection',
    float: 0.02,
    popularity: 93,
    tradingData: {
      currentPrice: 1850.00,
      dayHigh: 1920.00,
      dayLow: 1780.00,
      volume: 124,
      priceHistory: generatePriceHistory(1850.00, 24)
    }
  },
  {
    id: 'skin-13',
    name: 'AK-47 | Hydroponic',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Minimal Wear',
    price: 425.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhh3szKcDBA49OJnpWFkPvxDLfYkWNFpsYhi7rFrNimilKy80doa2j6LYKRIwZrYw7W_QC7lenvgp_p7prKz3d9-n51eq1qbu8',
    priceChange: 22.5,
    priceChangePercent: 5.6,
    volume24h: 750000,
    marketCap: 18000000,
    category: 'Rifle',
    collection: 'Gamma Collection',
    float: 0.12,
    popularity: 84,
    tradingData: {
      currentPrice: 425.00,
      dayHigh: 445.00,
      dayLow: 415.00,
      volume: 89,
      priceHistory: generatePriceHistory(425.00, 24)
    }
  },
  {
    id: 'skin-14',
    name: 'M4A1-S | Hot Rod',
    type: 'Rifle',
    rarity: 'Classified',
    wear: 'Factory New',
    price: 325.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpou-6kejhz2v_Nfz5H_uO3mr-ZkvPLPu_Qx3hu5Mx2gv2Pp9yn31Li_ERtYW70dYaXdFI8NVvYq1i7xOrohcTt7sudySZnsyNz7GGdwUICPND1TA',
    priceChange: 15.5,
    priceChangePercent: 5.0,
    volume24h: 650000,
    marketCap: 12000000,
    category: 'Rifle',
    collection: 'Falchion Collection',
    float: 0.01,
    popularity: 82,
    tradingData: {
      currentPrice: 325.00,
      dayHigh: 335.00,
      dayLow: 315.00,
      volume: 145,
      priceHistory: generatePriceHistory(325.00, 24)
    }
  },
  {
    id: 'skin-15',
    name: 'AWP | Fade',
    type: 'Sniper Rifle',
    rarity: 'Classified',
    wear: 'Factory New',
    price: 1250.00,
    iconPath: 'https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot621FAZh7PLfYQJE7dizq4yCkP_gfezXxj0IvJBy2rrH9NSh2VXs80VsYWGnd9SWcAFoaFCEqVa7wu3oh5Gi_MOeScxOzqI',
    priceChange: 65.0,
    priceChangePercent: 5.5,
    volume24h: 1800000,
    marketCap: 32000000,
    category: 'Sniper',
    collection: 'Dust Collection',
    float: 0.02,
    popularity: 90,
    tradingData: {
      currentPrice: 1250.00,
      dayHigh: 1285.00,
      dayLow: 1220.00,
      volume: 178,
      priceHistory: generatePriceHistory(1250.00, 24)
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

// Dynamic mock order book that updates with new orders
function generateDynamicOrderBook(skinId: string) {
  const skin = MOCK_SKINS.find(s => s.id === skinId);
  if (!skin) return { bids: [], asks: [] };

  const basePrice = skin.price;
  const spread = basePrice * 0.002; // 0.2% spread
  
  // Generate realistic bids (below market price)
  const bids = [];
  for (let i = 0; i < 10; i++) {
    const price = basePrice - spread - (i * basePrice * 0.001);
    const quantity = Math.floor(Math.random() * 8) + 1;
    bids.push({
      price: Math.round(price * 100) / 100,
      quantity,
      total: Math.round(price * quantity * 100) / 100
    });
  }

  // Generate realistic asks (above market price)
  const asks = [];
  for (let i = 0; i < 10; i++) {
    const price = basePrice + spread + (i * basePrice * 0.001);
    const quantity = Math.floor(Math.random() * 8) + 1;
    asks.push({
      price: Math.round(price * 100) / 100,
      quantity,
      total: Math.round(price * quantity * 100) / 100
    });
  }

  return { bids, asks };
}

// Dynamic recent trades that update with new orders
function generateRecentTrades(skinId: string) {
  const skin = MOCK_SKINS.find(s => s.id === skinId);
  if (!skin) return [];

  const basePrice = skin.price;
  const trades = [];
  
  for (let i = 0; i < 20; i++) {
    const priceVariation = (Math.random() - 0.5) * 0.02; // ±1% variation
    const price = basePrice * (1 + priceVariation);
    const quantity = Math.floor(Math.random() * 5) + 1;
    const side = Math.random() > 0.5 ? 'buy' : 'sell';
    const timestamp = new Date(Date.now() - (i * 30000) - Math.random() * 30000).toISOString();
    
    trades.push({
      id: `trade-${Date.now()}-${i}`,
      price: Math.round(price * 100) / 100,
      quantity,
      timestamp,
      side
    });
  }
  
  return trades.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

// Add a new trade to the mock trades state
export function addMockTrade(skinId: string, price: number, quantity: number, side: 'buy' | 'sell') {
  const trade = {
    id: `trade-${Date.now()}`,
    skinId,
    price,
    quantity,
    timestamp: new Date().toISOString(),
    side
  };
  
  mockTradesState.unshift(trade); // Add to beginning
  
  // Keep only last 50 trades
  if (mockTradesState.length > 50) {
    mockTradesState = mockTradesState.slice(0, 50);
  }
  
  return trade;
}

// Add a new order to the mock order book
export function addMockOrder(order: any) {
  mockOrdersState.push(order);
  
  // Only add to order book if it's a limit order (not market order)
  if (order.orderType === 'LIMIT' && order.status === 'OPEN') {
    if (order.side === 'BUY') {
      mockOrderBookState.bids.push({
        price: order.price,
        quantity: order.remainingQty || order.quantity,
        total: order.price * (order.remainingQty || order.quantity),
        orderId: order.id
      });
      // Sort bids by price (highest first)
      mockOrderBookState.bids.sort((a, b) => b.price - a.price);
    } else {
      mockOrderBookState.asks.push({
        price: order.price,
        quantity: order.remainingQty || order.quantity,
        total: order.price * (order.remainingQty || order.quantity),
        orderId: order.id
      });
      // Sort asks by price (lowest first)
      mockOrderBookState.asks.sort((a, b) => a.price - b.price);
    }
  }
  
  return order;
}

// Update the mock order book when orders are placed
function updateMockOrderBook(skinId: string) {
  const openOrders = mockOrdersState.filter(order => 
    order.skinId === skinId && 
    order.status === 'OPEN' && 
    order.remainingQty > 0
  );
  
  const bids = openOrders
    .filter(order => order.side === 'BUY')
    .sort((a, b) => b.price - a.price) // Highest price first
    .slice(0, 10)
    .map(order => ({
      price: order.price,
      quantity: order.remainingQty,
      total: order.price * order.remainingQty
    }));
    
  const asks = openOrders
    .filter(order => order.side === 'SELL')
    .sort((a, b) => a.price - b.price) // Lowest price first
    .slice(0, 10)
    .map(order => ({
      price: order.price,
      quantity: order.remainingQty,
      total: order.price * order.remainingQty
    }));
  
  // Only show real user orders - no generated liquidity
  mockOrderBookState = {
    bids: bids,
    asks: asks
  };
}

// Get current mock order book
export function getMockOrderBook(skinId: string) {
  // Always update with real orders only
  updateMockOrderBook(skinId);
  return mockOrderBookState;
}

// Get recent trades for a skin
export function getMockRecentTrades(skinId: string) {
  const skinTrades = mockTradesState.filter(trade => trade.skinId === skinId);
  
  if (skinTrades.length < 5) {
    // Generate some initial trades if none exist
    const generatedTrades = generateRecentTrades(skinId);
    mockTradesState.push(...generatedTrades);
  }
  
  return mockTradesState
    .filter(trade => trade.skinId === skinId)
    .slice(0, 20);
}

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

// Function to determine if we should use mock data
export function shouldUseMockData(): boolean {
  // In production (Vercel), always use real database
  if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
    return false;
  }
  
  // Check if DATABASE_URL is properly configured for development
  const hasValidDatabase = process.env.DATABASE_URL && 
    process.env.DATABASE_URL !== 'postgresql://mock:mock@localhost:5432/mock' &&
    !process.env.DATABASE_URL.includes('mock') &&
    process.env.DATABASE_URL.includes('supabase');
  
  // Use real database if properly configured, otherwise use mock data
  return !hasValidDatabase;
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

// Add a new position to the mock positions state
export function addMockPosition(position: any) {
  mockPositionsState.push(position);
  return position;
}

// Get user positions
export function getMockPositions(userId: string) {
  return mockPositionsState.filter(position => 
    position.userId === userId && !position.closedAt
  );
}

// Get user orders
export function getMockOrders(userId: string, skinId?: string, status?: string[]) {
  let orders = mockOrdersState.filter(order => order.userId === userId);
  
  if (skinId) {
    orders = orders.filter(order => order.skinId === skinId);
  }
  
  if (status && status.length > 0) {
    orders = orders.filter(order => status.includes(order.status));
  }
  
  return orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
} 