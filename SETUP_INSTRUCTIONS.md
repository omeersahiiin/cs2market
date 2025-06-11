# 🚀 **REAL-TIME PRICE DATA SETUP GUIDE**

## **STEP 1: GET API KEYS (In This Order)**

### **1. Steam Web API Key** ⭐ **DO FIRST (FREE)**
1. Go to: https://steamcommunity.com/dev/apikey
2. Login with your Steam account
3. **Domain Name**: `localhost` (for development)
4. **Key Name**: `CS2 Derivatives Platform`
5. Copy your API key (it looks like: `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX`)

### **2. CSFloat API Key** ⭐ **HIGH PRIORITY (FREE/PAID)**
1. Go to: https://csfloat.com/
2. Create account or login
3. Go to: https://csfloat.com/api
4. **Free Tier**: 1,000 requests/day (perfect for development)
5. **Pro Tier**: $10/month unlimited requests (for production)
6. Get your API key from the dashboard

### **3. SkinPort API** 🔧 **BACKUP SOURCE (FREE TIER)**
1. Go to: https://skinport.com/
2. Create account
3. Go to: https://docs.skinport.com/
4. Apply for API access (usually approved within 24 hours)
5. Free tier: 100 requests/hour

### **4. BitSkins API** 🔧 **ADDITIONAL SOURCE (FREE)**
1. Go to: https://bitskins.com/
2. Create account
3. Go to account settings → API
4. Generate API key (free for price data)

---

## **STEP 2: ENVIRONMENT SETUP**

✅ **Your environment file has been created!** We've set up `.env.local` with all necessary configuration.

**Now update your API keys:**

1. **Open** `.env.local` in your text editor
2. **Replace** the placeholder values with your real API keys:

```env
CSFLOAT_API_KEY=your_actual_csfloat_key_here
STEAM_API_KEY=your_actual_steam_key_here
SKINPORT_API_KEY=your_actual_skinport_key_here
BITSKINS_API_KEY=your_actual_bitskins_key_here
```

---

## **STEP 3: TEST YOUR SETUP**

Run this command to test your configuration:
```bash
node test-price-service.js
```

This will show you:
- ✅ Which API keys are configured
- ✅ Which price sources are enabled
- ✅ Rate limiting configuration
- ✅ Next steps if anything is missing

---

## **STEP 4: START THE PRICE SERVICE**

1. **Start your development server:**
```bash
npm run dev
```

2. **Activate price updates** by visiting:
```
http://localhost:3000/api/price-service?action=start
```

3. **Check status** anytime at:
```
http://localhost:3000/api/price-service?action=status
```

---

## **STEP 5: VERIFY IT'S WORKING**

### **Real-Time Price Updates:**
- Prices update every 30 seconds
- Multiple sources provide data reliability
- Weighted averaging ensures accurate pricing
- Rate limiting prevents API overuse

### **Monitor the Console:**
When `DEBUG_PRICE_SERVICE=true`, you'll see:
```
🔄 Starting price update cycle...
📊 Updating prices for 17 skins
💰 AK-47 | Redline: $85.50 (from steam, csfloat)
💰 AWP | Dragon Lore: $8500.00 (from csfloat, skinport)
✅ Price update cycle completed
```

---

## **EXPECTED COSTS:**
- **Steam API**: FREE ✅
- **CSFloat Free**: FREE ✅
- **CSFloat Pro**: $10/month (recommended for production)
- **SkinPort**: FREE tier available ✅
- **BitSkins**: FREE for price data ✅

**Total Development Cost**: $0-10/month
**Total Production Cost**: $10-20/month

---

## **BENEFITS YOU'LL GET:**
✅ Real-time price updates every 30 seconds
✅ Multiple data sources for accuracy
✅ Professional-grade data reliability
✅ Rate limiting and fallback systems
✅ Historical price tracking
✅ Market depth data

---

## **🚨 TROUBLESHOOTING**

### **If prices aren't updating:**
1. Check API keys in `.env.local`
2. Verify development server is running
3. Check console for error messages
4. Test individual endpoints: `/api/price-service?action=status`

### **If you get rate limiting errors:**
1. Reduce `PRICE_UPDATE_INTERVAL` (increase the number)
2. Disable some sources temporarily
3. Upgrade to paid API tiers

### **If Steam API fails:**
- Steam Market has aggressive rate limiting
- CSFloat and SkinPort are more reliable
- Steam API is backup/supplement only

---

## **🎯 SUCCESS CRITERIA**

Your setup is complete when:
- ✅ All desired API keys are configured
- ✅ Development server starts without errors
- ✅ Price updates show in console logs
- ✅ API status endpoint returns source information
- ✅ Database prices are updating automatically

**You'll have a professional-grade real-time price feed system! 🚀** 