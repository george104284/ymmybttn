-- Migration to align products table with sync module requirements
-- This ensures the column names match between the Rust structs and database schema

-- Since SQLite doesn't support renaming columns easily, and we need to change
-- last_modified to updated_at, we'll recreate the table with the correct schema

-- Create temporary table with desired schema
CREATE TABLE IF NOT EXISTS products_temp (
    catalog_product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    category_id TEXT,
    preferred_measurement TEXT NOT NULL,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('weight', 'volume', 'count')),
    description TEXT,
    is_active INTEGER DEFAULT 1,
    updated_at TIMESTAMP,
    last_synced_at TIMESTAMP,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Copy existing data from products table
-- Handle the column rename from last_modified to updated_at
INSERT INTO products_temp (
    catalog_product_id,
    product_name,
    category_id,
    preferred_measurement,
    measurement_type,
    description,
    is_active,
    updated_at,
    last_synced_at,
    synced_at
)
SELECT 
    catalog_product_id,
    product_name,
    category_id,
    preferred_measurement,
    measurement_type,
    description,
    is_active,
    last_modified,  -- Map last_modified to updated_at
    last_synced_at,
    synced_at
FROM products;

-- Drop the old table
DROP TABLE products;

-- Rename temporary table to products
ALTER TABLE products_temp RENAME TO products;

-- Recreate all indexes
CREATE INDEX IF NOT EXISTS idx_products_active ON products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_last_synced ON products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_products_updated ON products(updated_at);