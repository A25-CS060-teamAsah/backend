-- Migration: Add balance column to customers table
-- Created: 2025-11-30
-- Description: Add balance field to track customer account balance

-- Add balance column
ALTER TABLE customers
ADD COLUMN IF NOT EXISTS balance DECIMAL(12,2) DEFAULT 0;

-- Add comment
COMMENT ON COLUMN customers.balance IS 'Customer account balance in dollars';

-- Create index for balance (optional, for performance on balance queries)
CREATE INDEX IF NOT EXISTS idx_customers_balance ON customers(balance);

-- Update existing records to have default balance of 0
UPDATE customers SET balance = 0 WHERE balance IS NULL;

-- Display success message
SELECT 'Balance column added successfully!' as status;
