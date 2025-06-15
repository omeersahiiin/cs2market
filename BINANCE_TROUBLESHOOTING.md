# 🔧 Binance API Troubleshooting Guide

## Current Issue: "Invalid credentials"

### ✅ Quick Fix Steps

1. **Update Local Credentials**:
   ```bash
   node update-binance-credentials.js
   ```
   - Enter your actual Binance API key and secret
   - The script will update your `.env` file automatically

2. **Update Vercel Production**:
   - Go to: https://vercel.com/omeersahiiins-projects/cs2market-prod/settings/environment-variables
   - Add/Update: `BINANCE_API_KEY` = your actual API key
   - Add/Update: `BINANCE_SECRET_KEY` = your actual secret key
   - **Redeploy** the application

3. **Test the Configuration**:
   ```bash
   npm run dev
   ```
   - Visit: http://localhost:3000/admin
   - Click "Test Binance API" button

---

## 🚨 Common Issues & Solutions

### 1. "Invalid credentials" Error
**Cause**: Wrong API key or secret key
**Solution**:
- Double-check your API key and secret from Binance
- Ensure no extra spaces or characters
- Make sure you copied the complete keys

### 2. "IP restriction" Error
**Cause**: Your IP is not whitelisted on Binance
**Solution**:
- Go to Binance API Management
- Add your current IP to the whitelist
- For development: Add your local IP
- For production: Add Vercel's IP ranges

### 3. "Permission denied" Error
**Cause**: API key doesn't have required permissions
**Solution**:
- Enable "Reading" permission
- Enable "Spot & Margin Trading" permission
- **DO NOT** enable withdrawals or futures

### 4. "Signature invalid" Error
**Cause**: System time mismatch or encoding issues
**Solution**:
- Ensure your system time is accurate
- Check for special characters in keys
- Verify keys are copied correctly

---

## 🔑 Correct Binance API Setup

### Required Permissions:
```
✅ Enable Reading
✅ Enable Spot & Margin Trading
❌ Disable Futures Trading  
❌ Disable Withdrawals
❌ Disable Internal Transfer
```

### Security Settings:
```
✅ Enable IP Access Restriction (recommended)
✅ Add your server/development IPs
✅ Set API key label (e.g., "CS2-Platform")
```

---

## 🧪 Testing Commands

### Test Local Configuration:
```bash
# Update credentials
node update-binance-credentials.js

# Start development server
npm run dev

# Test in browser
# Go to: http://localhost:3000/admin
# Click "Test Binance API"
```

### Test API Directly:
```bash
# Test credentials via API
curl -X POST http://localhost:3000/api/admin/setup-binance \
  -H "Content-Type: application/json" \
  -d '{"action": "test-credentials"}'
```

---

## 📋 Environment Variables Checklist

### Local (.env file):
- [ ] `BINANCE_API_KEY` = your actual API key
- [ ] `BINANCE_SECRET_KEY` = your actual secret key
- [ ] No placeholder values like "your_actual_binance_api_key_here"

### Vercel Production:
- [ ] `BINANCE_API_KEY` added to environment variables
- [ ] `BINANCE_SECRET_KEY` added to environment variables  
- [ ] Application redeployed after adding variables

---

## 🔍 Debug Information

### Check Current Environment:
```bash
# View current .env file (without showing secrets)
node -e "
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf8');
const hasApiKey = env.includes('BINANCE_API_KEY=') && !env.includes('your_actual_binance_api_key_here');
const hasSecret = env.includes('BINANCE_SECRET_KEY=') && !env.includes('your_actual_binance_secret_key_here');
console.log('API Key configured:', hasApiKey);
console.log('Secret Key configured:', hasSecret);
"
```

### Common File Issues:
- `.env` file exists but has placeholder values
- Environment variables not loaded by Next.js
- Cached environment variables in development

---

## 🚀 Success Indicators

When properly configured, you should see:
- ✅ "Binance API credentials are valid" in admin panel
- ✅ Monitoring status shows "active"
- ✅ No errors in browser console
- ✅ Deposit monitoring works correctly

---

## 📞 Still Having Issues?

1. **Check Binance API Status**: https://binance-docs.github.io/apidocs/spot/en/#general-info
2. **Verify API Key**: Log into Binance and check API management
3. **Test with Postman**: Use Binance API documentation to test directly
4. **Check Server Logs**: Look for detailed error messages in console

---

## ⚡ Quick Commands Reference

```bash
# Setup/Update credentials
node update-binance-credentials.js

# Test setup
node setup-binance-api.js

# Start development
npm run dev

# Check environment
Get-Content .env | Select-String "BINANCE"
``` 