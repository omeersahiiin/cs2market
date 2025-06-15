-- Create crypto_deposits table
CREATE TABLE IF NOT EXISTS crypto_deposits (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    cryptocurrency TEXT NOT NULL,
    network TEXT NOT NULL,
    "depositAddress" TEXT NOT NULL,
    amount DECIMAL,
    "usdValue" DECIMAL,
    "txHash" TEXT,
    status TEXT DEFAULT 'PENDING',
    confirmations INTEGER DEFAULT 0,
    "requiredConfirmations" INTEGER DEFAULT 1,
    "expiresAt" TIMESTAMP WITH TIME ZONE,
    "creditedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint
    CONSTRAINT fk_crypto_deposits_user FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
);

-- Create supported_cryptos table
CREATE TABLE IF NOT EXISTS supported_cryptos (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    symbol TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    network TEXT NOT NULL,
    "contractAddress" TEXT,
    decimals INTEGER DEFAULT 18,
    "minDeposit" DECIMAL NOT NULL,
    "requiredConfirmations" INTEGER DEFAULT 1,
    "isActive" BOOLEAN DEFAULT true,
    "depositFee" DECIMAL DEFAULT 0,
    "iconUrl" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_user_status ON crypto_deposits("userId", status);
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_address ON crypto_deposits("depositAddress");
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_txhash ON crypto_deposits("txHash");
CREATE INDEX IF NOT EXISTS idx_crypto_deposits_status_created ON crypto_deposits(status, "createdAt");
CREATE INDEX IF NOT EXISTS idx_supported_cryptos_symbol_active ON supported_cryptos(symbol, "isActive");

-- Insert supported cryptocurrencies
INSERT INTO supported_cryptos (symbol, name, network, decimals, "minDeposit", "requiredConfirmations", "depositFee", "iconUrl") VALUES
('BTC', 'Bitcoin', 'Bitcoin', 8, 0.001, 3, 0, '/crypto/btc.png'),
('ETH', 'Ethereum', 'Ethereum', 18, 0.01, 12, 0, '/crypto/eth.png'),
('USDT', 'Tether (TRC20)', 'Tron', 6, 10, 20, 0, '/crypto/usdt.png'),
('SOL', 'Solana', 'Solana', 9, 0.1, 1, 0, '/crypto/sol.png')
ON CONFLICT (symbol) DO UPDATE SET
    name = EXCLUDED.name,
    network = EXCLUDED.network,
    decimals = EXCLUDED.decimals,
    "minDeposit" = EXCLUDED."minDeposit",
    "requiredConfirmations" = EXCLUDED."requiredConfirmations",
    "depositFee" = EXCLUDED."depositFee",
    "iconUrl" = EXCLUDED."iconUrl",
    "isActive" = true,
    "updatedAt" = NOW();

-- Add contract address for USDT
UPDATE supported_cryptos 
SET "contractAddress" = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t' 
WHERE symbol = 'USDT'; 