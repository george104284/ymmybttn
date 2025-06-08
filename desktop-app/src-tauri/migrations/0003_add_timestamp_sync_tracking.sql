-- Add timestamp-based sync tracking to products table
-- This enables safe deletion of products no longer in the catalog

-- Add sync tracking column
ALTER TABLE products ADD COLUMN last_synced_at TIMESTAMP;

-- Initialize existing rows with current synced_at value (or CURRENT_TIMESTAMP if NULL)
UPDATE products SET last_synced_at = COALESCE(synced_at, CURRENT_TIMESTAMP) WHERE last_synced_at IS NULL;

-- Create index for performance when deleting old products
CREATE INDEX IF NOT EXISTS idx_products_last_synced ON products(last_synced_at);