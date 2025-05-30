# CS2 Derivatives - Skin Extension Guide

## What Caused the Crash

The website crash when extending the number of skins was caused by a **Prisma client schema mismatch**. Here's what happened:

### The Problem
1. **Prisma Client Out of Sync**: The generated Prisma client was expecting a database field `volume24h` that didn't exist in the actual database schema
2. **Schema Mismatch**: This created a mismatch between the generated TypeScript types and the actual database structure
3. **Database Query Failures**: Any attempt to query the `Skin` table failed with the error: `The column 'Skin.volume24h' does not exist in the current database`

### The Root Cause
- The `volume24h` field was defined in `src/types/index.ts` in the `MarketData` interface but was never added to the Prisma schema
- The Prisma client generation process somehow got corrupted or cached an incorrect schema
- This prevented any database operations from working

## The Solution

### ✅ What We Fixed
1. **Regenerated Prisma Client**: Cleared the corrupted client and regenerated it properly
2. **Verified Database Schema**: Confirmed the database structure matches the Prisma schema
3. **Enhanced Price Service**: Added pricing data for popular skins
4. **Created Extension Scripts**: Built tools to safely add more skins

### ✅ Current Status
- ✅ Website is now working with the original 3 skins
- ✅ Prisma client is properly synced
- ✅ Database queries are functioning
- ✅ Ready for safe skin extension

## How to Safely Add More Skins

### Method 1: Use the Popular Skins Script (Recommended)

```bash
# Add 10 popular CS2 skins with proper pricing
node scripts/add-popular-skins.js
```

This script adds:
- AK-47 | Redline
- AWP | Asiimov  
- M4A1-S | Hyper Beast
- Glock-18 | Fade
- USP-S | Kill Confirmed
- Karambit | Doppler
- M4A4 | Howl
- AK-47 | Fire Serpent
- Desert Eagle | Blaze
- AWP | Lightning Strike

### Method 2: Add Individual Skins

```bash
# Use the existing add-skin script
node scripts/add-skin.js "Skin Name" "Type" "Rarity" "Wear" "Price" "SteamImageID"

# Example:
node scripts/add-skin.js "AK-47 | Vulcan" "Rifle" "Classified" "Field-Tested" "125.00" "-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI"
```

### Method 3: Add Pricing Data for New Skins

When adding skins not in the PriceService, they'll use default prices. To add realistic pricing:

1. Edit `src/lib/priceService.ts`
2. Add your skin to the `wearPrices` object in `getWearPricesForSkin()`
3. Include all 5 wear conditions with realistic prices

Example:
```typescript
'Your New Skin': {
  'Factory New': 150.00,
  'Minimal Wear': 120.00,
  'Field-Tested': 100.00,
  'Well-Worn': 80.00,
  'Battle-Scarred': 65.00
}
```

## Getting Steam Image IDs

To get the correct Steam image ID for a skin:

1. Go to [wiki.cs.money](https://wiki.cs.money) and find your skin
2. Right-click on the skin image and "Inspect Element"
3. Look for the Steam CDN URL: `https://steamcommunity-a.akamaihd.net/economy/image/[IMAGE_ID]`
4. Copy the `[IMAGE_ID]` part (the long base64-like string)

## Testing Your Changes

After adding skins:

1. **Check Database**: `node check-skin-price.js`
2. **Start Dev Server**: `npm run dev`
3. **Visit Skins Page**: `http://localhost:3000/skins`
4. **Test Trading**: Click on any skin to test the trading interface

## Best Practices

### ✅ Do's
- Always use the provided scripts to add skins
- Test with a few skins first before adding many
- Verify Steam image IDs work before adding
- Add realistic pricing data for better user experience
- Keep backups of your database

### ❌ Don'ts
- Don't modify the Prisma schema without proper migrations
- Don't add skins directly to the database without using scripts
- Don't use placeholder or broken image URLs
- Don't add too many skins at once without testing

## Troubleshooting

### If the website crashes again:

1. **Check Prisma Client**:
   ```bash
   npx prisma generate
   ```

2. **Verify Database Connection**:
   ```bash
   npx prisma migrate status
   ```

3. **Test Database Queries**:
   ```bash
   node check-skin-price.js
   ```

4. **Check for Schema Mismatches**:
   - Compare `prisma/schema.prisma` with generated types
   - Look for fields in TypeScript interfaces that don't exist in schema

### Common Issues

- **Permission Errors**: Stop the dev server before regenerating Prisma client
- **Image Loading Failures**: Verify Steam image IDs are correct
- **Price Errors**: Ensure prices are valid numbers
- **Database Locks**: Restart PostgreSQL if needed

## Current Architecture

### Database Schema
- **Skin Model**: `id`, `name`, `type`, `rarity`, `price`, `iconPath`, `wear`, timestamps
- **User Model**: User accounts with balances
- **Order Model**: Trading orders (buy/sell, limit/market)
- **Position Model**: Open trading positions
- **Float Analysis**: Advanced skin float value data

### Price System
- **Unified Liquidity**: All wear conditions trade at average market price
- **Real-time Updates**: Prices update every 15 seconds via SSE
- **Multi-platform Simulation**: CSFloat, Steam Market, Buff163 price aggregation
- **Wear Analysis**: Individual wear condition pricing for education

### Trading Features
- **CFD Trading**: Long/short positions on skin price movements
- **Order Matching**: Real-time order book with price-time priority
- **Market Making**: Automated liquidity provision
- **Risk Management**: Margin requirements and position limits

## Next Steps

1. **Add Popular Skins**: Run the popular skins script
2. **Test Trading**: Verify all features work with new skins
3. **Monitor Performance**: Check for any issues with more data
4. **Add More Features**: Consider adding more skin categories or trading pairs

The platform is now stable and ready for expansion! 🚀 