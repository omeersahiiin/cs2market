-- Final AWP Dragon Lore Duplicate Fix
-- Run these commands in your database (Prisma Studio or directly)

-- First, check the current Dragon Lore variants
SELECT id, name, price, type FROM "skins" WHERE name LIKE '%Dragon Lore%' ORDER BY price DESC;

-- Move all orders from the pipe version to the clean version
-- From: AWP | Dragon Lore (ID: cmbt4rwax0004tepcb8a2cadx) 
-- To: AWP Dragon Lore (ID: cmc36nz3j0001tebkkzus4d4v)
UPDATE "orders" 
SET "skinId" = 'cmc36nz3j0001tebkkzus4d4v' 
WHERE "skinId" = 'cmbt4rwax0004tepcb8a2cadx';

-- Move any favorites
UPDATE "FavoriteSkin" 
SET "skinId" = 'cmc36nz3j0001tebkkzus4d4v' 
WHERE "skinId" = 'cmbt4rwax0004tepcb8a2cadx';

-- Update the kept skin to have a reasonable price (average of both: ~$11,680)
UPDATE "skins" 
SET price = 11680, name = 'AWP Dragon Lore' 
WHERE id = 'cmc36nz3j0001tebkkzus4d4v';

-- Now safely delete the duplicate
DELETE FROM "skins" WHERE id = 'cmbt4rwax0004tepcb8a2cadx';

-- Verify the fix
SELECT COUNT(*) as awp_count FROM "skins" WHERE name LIKE '%AWP%';
SELECT name, type, price FROM "skins" WHERE name LIKE '%AWP%' ORDER BY price DESC; 