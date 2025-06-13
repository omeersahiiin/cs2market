-- Fix PENDING orders to OPEN status
-- This will make orders appear in the order book

-- First, check current status
SELECT 
  status, 
  COUNT(*) as count 
FROM orders 
GROUP BY status;

-- Update PENDING orders to OPEN
UPDATE orders 
SET status = 'OPEN' 
WHERE status = 'PENDING';

-- Verify the update
SELECT 
  status, 
  COUNT(*) as count 
FROM orders 
GROUP BY status;

-- Show some sample OPEN orders
SELECT 
  id,
  side,
  quantity,
  price,
  "skinId",
  status,
  "createdAt"
FROM orders 
WHERE status = 'OPEN' 
ORDER BY "createdAt" DESC 
LIMIT 10; 