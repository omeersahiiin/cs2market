# CS2 Skin Image Fix Guide

## Current Issue
Some skin images are not loading properly because they're using placeholder/incorrect Steam image IDs. The working skins (AWP Dragon Lore, M4A4 Asiimov, AK-47 Case Hardened) have correct image IDs, but the newly added skins need proper image URLs.

## How to Fix Skin Images

### Method 1: Get Image URLs from wiki.cs.money

1. **Go to [wiki.cs.money](https://wiki.cs.money)**
2. **Search for the skin** (e.g., "AK-47 Redline")
3. **Find the skin image** on the page
4. **Right-click on the image** and select "Copy image address" or "Inspect Element"
5. **Extract the image ID** from the URL

#### Example Process:
For "AK-47 | Redline":
1. Search "AK-47 Redline" on wiki.cs.money
2. Right-click the skin image
3. Copy image URL: `https://community.cloudflare.steamstatic.com/economy/image/LONG_IMAGE_ID_HERE`
4. Copy the part after `/economy/image/` (the long base64-like string)

### Method 2: Use the Fix Script

Once you have the correct image IDs, you can update them using our script:

#### Update a single skin:
```bash
node scripts/fix-skin-images.js "AK-47 | Redline" "CORRECT_IMAGE_ID_HERE"
```

#### Update multiple skins:
1. Edit `scripts/fix-skin-images.js`
2. Replace the placeholder image IDs with correct ones
3. Run: `node scripts/fix-skin-images.js`

## Skins That Need Image Fixes

Based on your screenshot, these skins need correct image URLs:

### ❌ Broken Images (Need Fixing):
1. **AK-47 | Redline** - Currently using placeholder
2. **AWP | Asiimov** - Currently using placeholder  
3. **M4A1-S | Hyper Beast** - Currently using placeholder
4. **Glock-18 | Fade** - Currently using placeholder
5. **USP-S | Kill Confirmed** - Currently using placeholder
6. **Karambit | Doppler** - Currently using placeholder
7. **M4A4 | Howl** - Currently using placeholder
8. **AK-47 | Fire Serpent** - Currently using placeholder
9. **Desert Eagle | Blaze** - Currently using placeholder
10. **AWP | Lightning Strike** - Currently using placeholder

### ✅ Working Images (Keep as is):
1. **AWP | Dragon Lore** - ✅ Working
2. **M4A4 | Asiimov** - ✅ Working  
3. **AK-47 | Case Hardened** - ✅ Working

## Step-by-Step Fix Process

### For Each Broken Skin:

1. **Go to wiki.cs.money**
2. **Search for the skin name** (e.g., "AK-47 Redline")
3. **Find the correct skin variant** (make sure it matches the wear condition)
4. **Right-click the image** and copy the image URL
5. **Extract the image ID** (the long string after `/economy/image/`)
6. **Update using the script**:
   ```bash
   node scripts/fix-skin-images.js "AK-47 | Redline" "NEW_IMAGE_ID"
   ```

### Example Commands:

```bash
# Fix AK-47 Redline
node scripts/fix-skin-images.js "AK-47 | Redline" "CORRECT_IMAGE_ID_FROM_WIKI"

# Fix AWP Asiimov  
node scripts/fix-skin-images.js "AWP | Asiimov" "CORRECT_IMAGE_ID_FROM_WIKI"

# Fix M4A1-S Hyper Beast
node scripts/fix-skin-images.js "M4A1-S | Hyper Beast" "CORRECT_IMAGE_ID_FROM_WIKI"
```

## Image URL Formats

### ✅ Correct Format:
```
https://community.cloudflare.steamstatic.com/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI
```

### ✅ Alternative Format:
```
https://steamcommunity-a.akamaihd.net/economy/image/-9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI
```

## What You Need to Provide

For each broken skin, I need the **Steam Image ID** (the long base64-like string). You can either:

### Option 1: Provide All Image IDs
Give me a list like this:
```
AK-47 | Redline: -9a81dlWLwJ2UUGcVs_nsVtzdOEdtWwKGZZLQHTxDZ7I56KU0Zwwo4NUX4oFJZEHLbXH5ApeO4YmlhxYQknCRvCo04DEVlxkKgpot7HxfDhjxszJemkV09-5lpKKqPrxN7LEmyVQ7MEpiLuSrYmnjQO3-hVpNWj1JNSVdlRrNQ7T_FDqw-_ng8Pv7Z_XiSw0Ej5iuHjD30vgKJJJJJI
AWP | Asiimov: ANOTHER_LONG_IMAGE_ID_HERE
M4A1-S | Hyper Beast: ANOTHER_LONG_IMAGE_ID_HERE
...
```

### Option 2: Fix Them One by One
Provide one image ID at a time, and I'll help you update them individually.

## Testing After Fix

After updating the image IDs:

1. **Refresh your browser** (Ctrl+F5 or Cmd+Shift+R)
2. **Check the skins page** at `http://localhost:3000/skins`
3. **Verify images load properly**
4. **Test a few skin detail pages** to ensure trading interface works

## Troubleshooting

### If images still don't load:
1. **Check the browser console** for 404 errors
2. **Try the alternative CDN** (the script will handle this automatically)
3. **Verify the image ID is correct** by testing the URL directly in browser
4. **Clear browser cache** and try again

### If you can't find a skin on wiki.cs.money:
1. **Try alternative search terms** (without the "|" symbol)
2. **Look for the skin on Steam Market** and inspect the image there
3. **Use CS.MONEY website** directly (not just the wiki)
4. **Check other CS2 skin databases** like CSFloat or Buff163

The goal is to get all 13 skins showing proper images so your trading platform looks professional! 🎯 