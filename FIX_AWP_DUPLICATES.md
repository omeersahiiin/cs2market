# 🔧 AWP Issues Fix Guide

## Problems Identified
1. **Duplicate AWP skins** - Some AWPs appear twice with slightly different names (e.g., "AWP Dragon Lore" vs "AWP | Dragon Lore")
2. **Wrong categorization** - AWPs are showing as "Rifle" instead of "Sniper Rifle"

## Quick Manual Fix

### Option 1: Using Prisma Studio (Recommended)
1. Open Prisma Studio: `npx prisma studio`
2. Go to the "Skin" model
3. **Remove duplicates**: 
   - Search for "AWP |" (with pipe)
   - Delete all entries that contain "AWP | " (these are the duplicates)
4. **Fix categorization**:
   - Search for all AWP skins where type = "Rifle"
   - Change their type to "Sniper Rifle"

### Option 2: Using SQL Commands
If database connection issues persist, restart the development server first:
```bash
# Stop any running processes, then:
npm run dev
```

Then run these SQL commands in your database:
```sql
-- Remove duplicate AWP skins (ones with pipe separators)
DELETE FROM "skins" WHERE name LIKE 'AWP |%';

-- Update AWP categorization
UPDATE "skins" SET type = 'Sniper Rifle' WHERE name LIKE '%AWP%' AND type != 'Sniper Rifle';
```

## Expected Results After Fix
- **Unique AWP skins only** (no duplicates)
- **All AWPs categorized as "Sniper Rifle"**
- **Approximately 10 AWP skins total** including:
  1. AWP Dragon Lore (~$14,756)
  2. AWP Gungnir (~$8,416) 
  3. AWP Fade (~$865)
  4. AWP Lightning Strike (~$310)
  5. AWP The Prince (~$272)
  6. AWP CMYK (~$270)
  7. AWP Printstream (~$232)
  8. AWP Asiimov (~$181)
  9. AWP Desert Hydra (~$192)

## Prevention for Future
The skin population scripts have been updated to:
- ✅ Properly categorize AWPs as "Sniper Rifle"
- ✅ Use consistent naming without pipe separators
- ✅ Check for duplicates before adding

## Verification
After the fix, check your website:
1. Go to `/skins` page
2. Filter by "Sniper Rifle" category
3. You should see ~10 unique AWP skins
4. No duplicates should appear

**Total skin count should be around 86-90 skins** (down from 94 due to duplicate removal) 