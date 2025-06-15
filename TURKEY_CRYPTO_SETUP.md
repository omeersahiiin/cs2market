# Crypto Integration for Turkish Users 🇹🇷

## Issue: Binance Geographic Restrictions in Turkey

Turkey has regulatory restrictions with Binance, causing HTTP 451 errors when trying to access Binance API from Turkish IP addresses or Vercel servers.

## Recommended Solutions

### Option 1: Turkish Crypto Exchanges (Best for Turkey)

#### 1. **Paribu** (Most Popular in Turkey)
- Website: https://www.paribu.com/
- API Documentation: https://github.com/paribu/api-documentation
- Supports: BTC, ETH, USDT, and many Turkish Lira pairs
- **Advantage**: Fully compliant with Turkish regulations

#### 2. **BtcTurk** (Largest Turkish Exchange)
- Website: https://www.btcturk.com/
- API Documentation: https://github.com/BTCTrader/broker-api-docs
- Supports: BTC, ETH, USDT, TRY pairs
- **Advantage**: Most liquid Turkish exchange

#### 3. **Bitexen**
- Website: https://www.bitexen.com/
- API Documentation: Available on their developer portal
- Supports: Major cryptocurrencies with TRY pairs

### Option 2: International Alternatives (Turkey-Friendly)

#### 1. **Coinbase Pro** (Now Coinbase Advanced)
- Generally accessible from Turkey
- Good API documentation
- Supports major cryptocurrencies

#### 2. **Kraken**
- Available in Turkey
- Excellent API
- Professional trading features

#### 3. **Gate.io**
- Accessible from Turkey
- Comprehensive API
- Wide range of cryptocurrencies

### Option 3: Manual Deposit System (Temporary Solution)

For immediate deployment, you can implement a manual deposit confirmation system:

1. **Users send crypto to your provided addresses**
2. **Admin manually confirms deposits** through admin panel
3. **Balances updated manually** until API integration is complete

## Implementation Priority

1. **Immediate**: Set up manual deposit system
2. **Short-term**: Integrate with Paribu or BtcTurk API
3. **Long-term**: Add multiple exchange support

## Next Steps

1. Choose a Turkish exchange (Paribu recommended)
2. Create account and generate API keys
3. Update the crypto integration to use Turkish exchange API
4. Test with small amounts first

## Environment Variables for Turkish Exchanges

### For Paribu:
```
PARIBU_API_KEY=your_paribu_api_key
PARIBU_SECRET_KEY=your_paribu_secret_key
CRYPTO_EXCHANGE=paribu
```

### For BtcTurk:
```
BTCTURK_API_KEY=your_btcturk_api_key
BTCTURK_SECRET_KEY=your_btcturk_secret_key
CRYPTO_EXCHANGE=btcturk
```

This approach will be much more reliable for Turkish users and comply with local regulations. 