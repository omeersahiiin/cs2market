// User related types
export interface User {
  id: string;
  email: string;
  username: string;
  balance: number;
  createdAt: Date;
}

// Skin related types
export interface Skin {
  id: string;
  name: string;
  wear: string;
  price: number;
  lastUpdated: Date;
  imageUrl: string;
}

// Trading related types
export interface Order {
  id: string;
  userId: string;
  skinId: string;
  type: 'BUY' | 'SELL';
  price: number;
  quantity: number;
  status: 'OPEN' | 'FILLED' | 'CANCELLED';
  createdAt: Date;
}

export interface Position {
  id: string;
  userId: string;
  skinId: string;
  type: 'LONG' | 'SHORT';
  entryPrice: number;
  quantity: number;
  currentPrice: number;
  pnl: number;
  createdAt: Date;
}

// Market data types
export interface MarketData {
  skinId: string;
  price: number;
  volume24h: number;
  change24h: number;
  lastUpdated: Date;
} 