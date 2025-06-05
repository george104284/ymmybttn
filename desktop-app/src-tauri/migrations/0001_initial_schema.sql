-- SQLite Schema for ymmybttn Desktop App
-- This local database stores proprietary pricing data until Monday sync

-- ============================================================================
-- SUBSCRIPTION & AUTH CACHE
-- ============================================================================

-- Cache subscription info for offline validation
CREATE TABLE IF NOT EXISTS subscription_cache (
    organization_id TEXT PRIMARY KEY,
    organization_name TEXT NOT NULL,
    plan_name TEXT NOT NULL,
    max_restaurants INTEGER NOT NULL,
    features TEXT, -- JSON string
    expires_at TIMESTAMP NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cache user authentication for offline access
CREATE TABLE IF NOT EXISTS auth_cache (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    full_name TEXT NOT NULL,
    auth_token_hash TEXT, -- Hashed auth token for offline validation
    restaurants TEXT NOT NULL, -- JSON array of restaurant IDs user has access to
    permissions TEXT, -- JSON object of permissions
    expires_at TIMESTAMP NOT NULL,
    cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- SYNCED REFERENCE DATA (from cloud)
-- ============================================================================

-- Minimal product catalog (synced from cloud)
CREATE TABLE IF NOT EXISTS products (
    catalog_product_id TEXT PRIMARY KEY,
    product_name TEXT NOT NULL,
    preferred_measurement TEXT NOT NULL,
    measurement_type TEXT NOT NULL CHECK (measurement_type IN ('weight', 'volume', 'count')),
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributors (synced from cloud)
CREATE TABLE IF NOT EXISTS distributors (
    distributor_id TEXT PRIMARY KEY,
    distributor_name TEXT NOT NULL,
    distributor_code TEXT,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Distributor product specs (synced from cloud)
CREATE TABLE IF NOT EXISTS distributor_specs (
    spec_id TEXT PRIMARY KEY,
    catalog_product_id TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    distributor_item_code TEXT,
    case_packs INTEGER NOT NULL,
    pack_size REAL NOT NULL,
    pack_unit_of_measure TEXT NOT NULL,
    total_preferred_units REAL NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (catalog_product_id) REFERENCES products(catalog_product_id),
    FOREIGN KEY (distributor_id) REFERENCES distributors(distributor_id),
    UNIQUE(catalog_product_id, distributor_id)
);

-- Restaurant assignments (what restaurants this user manages)
CREATE TABLE IF NOT EXISTS restaurants (
    restaurant_id TEXT PRIMARY KEY,
    restaurant_name TEXT NOT NULL,
    organization_id TEXT NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- LOCAL PROPRIETARY DATA
-- ============================================================================

-- Current week's prices (proprietary - not synced until Monday)
CREATE TABLE IF NOT EXISTS local_current_prices (
    price_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    catalog_product_id TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    case_price REAL NOT NULL,
    total_preferred_units REAL NOT NULL,
    unit_price REAL GENERATED ALWAYS AS (case_price / total_preferred_units) STORED,
    effective_date DATE NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('csv_import', 'manual_entry')),
    source_file_name TEXT,
    source_file_hash TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    FOREIGN KEY (catalog_product_id) REFERENCES products(catalog_product_id),
    FOREIGN KEY (distributor_id) REFERENCES distributors(distributor_id),
    UNIQUE(restaurant_id, catalog_product_id, distributor_id, effective_date)
);

-- CSV import history
CREATE TABLE IF NOT EXISTS csv_imports (
    import_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_hash TEXT NOT NULL UNIQUE, -- Prevent duplicate imports
    file_size INTEGER NOT NULL,
    row_count INTEGER,
    imported_count INTEGER,
    failed_count INTEGER,
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    imported_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id),
    FOREIGN KEY (distributor_id) REFERENCES distributors(distributor_id)
);

-- Import errors for debugging
CREATE TABLE IF NOT EXISTS csv_import_errors (
    error_id INTEGER PRIMARY KEY AUTOINCREMENT,
    import_id TEXT NOT NULL,
    row_number INTEGER NOT NULL,
    error_type TEXT NOT NULL, -- 'parsing', 'validation', 'product_not_found', etc.
    error_message TEXT NOT NULL,
    row_data TEXT, -- JSON of the problematic row
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (import_id) REFERENCES csv_imports(import_id)
);

-- ============================================================================
-- SYNC QUEUE
-- ============================================================================

-- Events pending sync to cloud (processed every Monday at 12:01 AM)
CREATE TABLE IF NOT EXISTS pending_sync_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL CHECK (event_type IN ('price_upload', 'csv_import')),
    restaurant_id TEXT NOT NULL,
    payload TEXT NOT NULL, -- JSON data to sync
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    scheduled_for TIMESTAMP NOT NULL, -- Next Monday 12:01 AM
    sync_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    last_error TEXT,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(restaurant_id)
);

-- Successfully synced events (for audit trail)
CREATE TABLE IF NOT EXISTS sync_history (
    sync_id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    response_data TEXT -- JSON response from server
);

-- ============================================================================
-- APP STATE & SETTINGS
-- ============================================================================

-- Application settings
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default settings
INSERT OR IGNORE INTO app_settings (key, value) VALUES
    ('last_cloud_sync', ''),
    ('auto_sync_enabled', 'true'),
    ('sync_time', '00:01'), -- 12:01 AM
    ('sync_day', '1'), -- Monday
    ('theme', 'light'),
    ('csv_delimiter', ','),
    ('csv_encoding', 'UTF-8');

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Price lookup indexes
CREATE INDEX IF NOT EXISTS idx_local_prices_lookup ON local_current_prices(restaurant_id, catalog_product_id, distributor_id, effective_date DESC);
CREATE INDEX IF NOT EXISTS idx_local_prices_date ON local_current_prices(restaurant_id, effective_date);

-- Sync queue indexes
CREATE INDEX IF NOT EXISTS idx_pending_sync_scheduled ON pending_sync_events(scheduled_for, sync_attempts);
CREATE INDEX IF NOT EXISTS idx_pending_sync_restaurant ON pending_sync_events(restaurant_id);

-- Import indexes
CREATE INDEX IF NOT EXISTS idx_csv_imports_restaurant ON csv_imports(restaurant_id, imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_import_errors_import ON csv_import_errors(import_id);