-- Update products table to match Supabase product_catalog schema
-- Add missing columns for complete synchronization

-- Drop the existing products table if it exists and recreate with new schema
DROP TABLE IF EXISTS products;

-- Create new products table with all required columns
CREATE TABLE IF NOT EXISTS products (
    catalog_product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category_id TEXT,
    preferred_measurement TEXT NOT NULL,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('weight', 'volume', 'count')),
    description TEXT,
    is_active BOOLEAN DEFAULT 1,
    last_modified TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);