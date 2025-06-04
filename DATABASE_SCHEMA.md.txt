#DATABASE_SCHEMA

##🌐 Web App (Supabase/PostgreSQL) - Source of Truth

###Core Product Tables
sql
-- Global product catalog (shared across all restaurants)
CREATE TABLE product_catalog (
    catalog_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_name VARCHAR(255) NOT NULL UNIQUE,
    category_id UUID REFERENCES categories(category_id),
    preferred_measurement VARCHAR(20) NOT NULL,
    measurement_type VARCHAR(20) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Restaurant-specific product assignments with par levels
CREATE TABLE restaurant_products (
    restaurant_product_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    custom_name VARCHAR(255), -- Optional: "Napkins" could be "Fancy Napkins" at Italian restaurant
    par_level DECIMAL(10,2), -- Restaurant-specific par
    par_unit VARCHAR(20), -- cases, units, etc.
    sort_order INTEGER, -- Custom ordering within restaurant
    is_visible BOOLEAN DEFAULT TRUE, -- Can hide without removing
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, catalog_product_id)
);

-- Distributor specs are global but pricing is per restaurant
CREATE TABLE distributor_product_specs (
    spec_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    distributor_item_code VARCHAR(100),
    case_packs INTEGER NOT NULL,
    pack_size DECIMAL(10,3) NOT NULL,
    pack_unit_of_measure VARCHAR(20) NOT NULL,
    total_preferred_units DECIMAL(12,4) NOT NULL, -- Calculated
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(catalog_product_id, distributor_id)
);

-- Categories for organization
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL, -- Beef, Poultry, Seafood, Produce, Dairy, Alcohol, Dry Goods, etc.
    parent_category_id UUID REFERENCES categories(category_id),
    sort_order INTEGER,
    temperature_zone VARCHAR(50), -- refrigerated, frozen, dry, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

-- Define storage rooms/areas
CREATE TABLE storage_rooms (
    room_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    room_name VARCHAR(255) NOT NULL, -- Walk-in Freezer, Walk-in Refrigerator, Upstairs Stock Room, Basement
    room_type VARCHAR(50), -- freezer, refrigerator, dry_storage
    temperature_range VARCHAR(50), -- 0-32F, 33-40F, ambient
    sort_order INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, room_name)
);

-- Define locations within rooms
CREATE TABLE room_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    room_id UUID REFERENCES storage_rooms(room_id),
    location_name VARCHAR(255) NOT NULL, -- Left Wall, Shelf 1, Chest Freezer 1
    location_type VARCHAR(50), -- wall, shelf, freezer, rack, bin
    parent_location_id UUID REFERENCES room_locations(location_id), -- For nested locations
    sort_order INTEGER,
    capacity_info JSONB, -- Optional: {"shelves": 5, "weight_limit": "50lbs"}
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(room_id, location_name, parent_location_id)
);

-- Assign products to specific locations
CREATE TABLE product_locations (
    location_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    generic_product_id UUID REFERENCES generic_products(generic_product_id),
    room_id UUID REFERENCES storage_rooms(room_id),
    room_location_id UUID REFERENCES room_locations(location_id),
    location_notes TEXT,
    quantity_typically_stored VARCHAR(50), -- "2 cases", "1 box"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, generic_product_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_product_room ON product_locations(room_id);
CREATE INDEX idx_product_location ON product_locations(room_location_id);

-- Distributor information
CREATE TABLE distributors (
    distributor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    distributor_name VARCHAR(255) NOT NULL,
    distributor_code VARCHAR(50) UNIQUE,
    contact_info JSONB,
    api_credentials JSONB, -- encrypted
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

###Restaurant-Specific Tables
sql-- Restaurant master
CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name VARCHAR(255) NOT NULL,
    restaurant_group_id UUID,
    address JSONB,
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Which distributors each restaurant uses
CREATE TABLE restaurant_distributors (
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    account_number VARCHAR(100),
    delivery_days JSONB, -- ["Monday", "Thursday"]
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (restaurant_id, distributor_id)
);

-- Product preferences per restaurant
CREATE TABLE product_preferences (
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    generic_product_id UUID REFERENCES generic_products(generic_product_id),
    preferred_distributor_id UUID REFERENCES distributors(distributor_id),
    always_use_preferred BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (restaurant_id, generic_product_id)
);

-- Sales contacts for each distributor relationship
CREATE TABLE distributor_sales_contacts (
    contact_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    contact_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    mobile VARCHAR(50),
    is_primary BOOLEAN DEFAULT FALSE,
    preferred_contact_method VARCHAR(50), -- email, text, phone
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(restaurant_id, distributor_id, email)
);

-- Order export configurations
CREATE TABLE order_export_configs (
    config_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    export_format VARCHAR(50) DEFAULT 'csv', -- csv, email, text
    csv_column_mapping JSONB, -- {"product_name": "Item Description", "distributor_code": "Item #"}
    email_template TEXT,
    delivery_method VARCHAR(50), -- download, email, text
    auto_send BOOLEAN DEFAULT FALSE,
    send_to_contact_id UUID REFERENCES distributor_sales_contacts(contact_id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, distributor_id)
);

###Substitution Groups
sql-- Groups of interchangeable products
CREATE TABLE substitution_groups (
    group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    group_name VARCHAR(255) NOT NULL, -- "Tomatoes - Any Size"
    measurement_type VARCHAR(20) NOT NULL, -- for validation
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Products in each substitution group
CREATE TABLE substitution_group_members (
    group_id UUID REFERENCES substitution_groups(group_id),
    generic_product_id UUID REFERENCES generic_products(generic_product_id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, generic_product_id)
);

###Price History & Events

-- Price events now reference restaurant AND catalog product
CREATE TABLE price_events (
    event_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    case_price DECIMAL(10,2) NOT NULL,
    total_preferred_units DECIMAL(12,4) NOT NULL,
    unit_price DECIMAL(10,4) GENERATED ALWAYS AS (case_price / total_preferred_units) STORED,
    effective_date DATE NOT NULL,
    source_type VARCHAR(50) NOT NULL,
    source_document_id UUID,
    source_file_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW(),
    
    INDEX idx_lookup (restaurant_id, catalog_product_id, distributor_id, effective_date DESC),
    INDEX idx_date_range (restaurant_id, effective_date)
);

-- Updated current prices view
CREATE MATERIALIZED VIEW current_prices AS
SELECT DISTINCT ON (restaurant_id, catalog_product_id, distributor_id)
    restaurant_id,
    catalog_product_id,
    distributor_id,
    case_price,
    total_preferred_units,
    unit_price,
    effective_date,
    source_type
FROM price_events
ORDER BY restaurant_id, catalog_product_id, distributor_id, effective_date DESC;

CREATE INDEX idx_current_prices ON current_prices(restaurant_id, generic_product_id);

###Orders & Analytics
sql-- Order history
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    order_date DATE NOT NULL,
    processing_mode VARCHAR(20), -- local, cloud
    total_amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    status VARCHAR(50)
);

-- Order line items with winner information
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    generic_product_id UUID REFERENCES generic_products(generic_product_id),
    selected_distributor_id UUID REFERENCES distributors(distributor_id),
    quantity DECIMAL(10,3),
    case_price DECIMAL(10,2),
    total_preferred_units DECIMAL(12,4),
    unit_price DECIMAL(10,4),
    extended_price DECIMAL(12,2),
    price_effective_date DATE,
    was_substitution BOOLEAN DEFAULT FALSE,
    original_product_id UUID -- if substitution was used
);

-- Track order exports
CREATE TABLE order_exports (
    export_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    export_format VARCHAR(50), -- csv, email, text
    export_file_url TEXT, -- S3/storage URL for CSV
    email_sent_to VARCHAR(255),
    text_sent_to VARCHAR(50),
    export_status VARCHAR(50), -- pending, sent, failed
    created_at TIMESTAMP DEFAULT NOW(),
    sent_at TIMESTAMP,
    error_message TEXT
);

-- Order items by distributor (view for easy CSV generation)
CREATE VIEW order_items_by_distributor AS
SELECT 
    oi.order_id,
    o.restaurant_id,
    oi.selected_distributor_id,
    gp.product_name as generic_name,
    pds.distributor_item_code,
    oi.quantity as case_quantity,
    pl.location_path,
    oi.case_price,
    oi.extended_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN generic_products gp ON oi.generic_product_id = gp.generic_product_id
JOIN product_distributor_specs pds ON 
    oi.generic_product_id = pds.generic_product_id 
    AND oi.selected_distributor_id = pds.distributor_id
LEFT JOIN product_locations pl ON 
    o.restaurant_id = pl.restaurant_id 
    AND oi.generic_product_id = pl.generic_product_id
ORDER BY pl.location_path, pl.sort_order, gp.product_name;

###Supporting Tables
sql-- Unit conversion reference
CREATE TABLE unit_conversions (
    from_unit VARCHAR(20),
    to_unit VARCHAR(20),
    conversion_factor DECIMAL(12,6) NOT NULL,
    PRIMARY KEY (from_unit, to_unit)
);

-- Measurement type reference
CREATE TABLE measurement_types (
    unit VARCHAR(20) PRIMARY KEY,
    measurement_type VARCHAR(20) NOT NULL -- weight, volume, count
);

-- Scanned invoices
CREATE TABLE invoice_scans (
    invoice_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    invoice_number VARCHAR(100),
    invoice_date DATE,
    scan_file_url TEXT,
    ocr_data JSONB,
    processing_status VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP
);

### User Tables

-- Core user table (integrates with Supabase Auth)
CREATE TABLE users (
    user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    mobile VARCHAR(50),
    preferred_contact_method VARCHAR(50), -- email, text, phone
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP,
    auth_user_id UUID UNIQUE -- Links to Supabase Auth
);

-- User types and their base permissions
CREATE TABLE user_types (
    user_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type_name VARCHAR(50) UNIQUE NOT NULL, -- owner, gm, manager, chef, distributor_sales, viewer
    description TEXT,
    base_permissions JSONB, -- Default permissions for this type
    created_at TIMESTAMP DEFAULT NOW()
);

-- User assignments to restaurants/distributors with roles
CREATE TABLE user_assignments (
    assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(user_id),
    user_type_id UUID REFERENCES user_types(user_type_id),
    -- One of these will be filled
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    -- Specific permissions that override base permissions
    custom_permissions JSONB,
    is_primary BOOLEAN DEFAULT FALSE, -- Primary contact for distributor
    notes TEXT,
    assigned_at TIMESTAMP DEFAULT NOW(),
    assigned_by UUID REFERENCES users(user_id),
    is_active BOOLEAN DEFAULT TRUE,
    -- Ensure user is assigned to either restaurant OR distributor, not both
    CONSTRAINT assignment_check CHECK (
        (restaurant_id IS NOT NULL AND distributor_id IS NULL) OR
        (restaurant_id IS NULL AND distributor_id IS NOT NULL)
    ),
    -- Unique assignment per user per entity
    UNIQUE(user_id, restaurant_id),
    UNIQUE(user_id, distributor_id)
);

-- Granular permissions
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_category VARCHAR(50), -- products, orders, reports, users, distributors
    description TEXT
);

-- Sample permissions would include:
-- products.view, products.edit, products.create, products.delete
-- orders.view, orders.create, orders.edit, orders.export
-- reports.view, reports.financial, reports.analytics  
-- users.manage, users.invite
-- distributor_products.edit (for sales reps)
-- prices.view_current, prices.upload_csv, prices.view_historical

-- Junction table for user type permissions
CREATE TABLE user_type_permissions (
    user_type_id UUID REFERENCES user_types(user_type_id),
    permission_id UUID REFERENCES permissions(permission_id),
    PRIMARY KEY (user_type_id, permission_id)
);

-- Subscription plans
CREATE TABLE subscription_plans (
    plan_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_name VARCHAR(100) NOT NULL, -- "Starter", "Professional", "Enterprise"
    max_restaurants INTEGER NOT NULL, -- 1, 3, 10, unlimited (-1)
    max_users INTEGER, -- Total users allowed, NULL = unlimited
    price_monthly DECIMAL(10,2) NOT NULL,
    price_annual DECIMAL(10,2),
    features JSONB, -- {"csv_upload": true, "invoice_scanning": true, "api_access": false}
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Customer subscriptions
CREATE TABLE subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL, -- Groups restaurants under one billing entity
    plan_id UUID REFERENCES subscription_plans(plan_id),
    status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255), -- Payment provider reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Organization that owns restaurants
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    primary_contact_id UUID REFERENCES users(user_id),
    billing_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Update restaurants table to link to organization
ALTER TABLE restaurants 
ADD COLUMN organization_id UUID REFERENCES organizations(organization_id),
ADD CONSTRAINT fk_organization FOREIGN KEY (organization_id) 
    REFERENCES organizations(organization_id);

-- Subscription usage tracking
CREATE TABLE subscription_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(subscription_id),
    usage_type VARCHAR(50), -- restaurants_count, users_count
    usage_value INTEGER,
    recorded_at TIMESTAMP DEFAULT NOW()
);

##💻 Local App (SQLite) - Operational Data Only

###Current Prices (Minimal Storage)
sql-- Current price for each product/distributor
CREATE TABLE local_current_prices (
    restaurant_id TEXT NOT NULL,
    generic_product_id TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    case_price REAL NOT NULL,
    total_preferred_units REAL NOT NULL,
    unit_price REAL GENERATED ALWAYS AS (case_price / total_preferred_units) STORED,
    effective_date TEXT NOT NULL, -- ISO date
    last_updated TEXT NOT NULL, -- ISO timestamp
    PRIMARY KEY (restaurant_id, generic_product_id, distributor_id)
);

-- Product reference data (synced from web)
CREATE TABLE local_product_locations (
    restaurant_id TEXT NOT NULL,
    generic_product_id TEXT NOT NULL,
    location_path TEXT, -- JSON array as string
    sort_order INTEGER,
    PRIMARY KEY (restaurant_id, generic_product_id)
);

-- Distributor specs (synced from web)
CREATE TABLE local_distributor_specs (
    generic_product_id TEXT,
    distributor_id TEXT,
    distributor_item_code TEXT,
    case_packs INTEGER,
    pack_size REAL,
    pack_unit_of_measure TEXT,
    total_preferred_units REAL NOT NULL,
    last_synced TEXT NOT NULL,
    PRIMARY KEY (generic_product_id, distributor_id),
    FOREIGN KEY (generic_product_id) REFERENCES local_products(generic_product_id)
);

-- Preferences (synced from web)
CREATE TABLE local_preferences (
    generic_product_id TEXT,
    preferred_distributor_id TEXT,
    always_use_preferred INTEGER DEFAULT 0,
    PRIMARY KEY (generic_product_id)
);

-- Substitution groups (synced from web)
CREATE TABLE local_substitution_groups (
    group_id TEXT PRIMARY KEY,
    group_name TEXT NOT NULL,
    measurement_type TEXT NOT NULL
);

CREATE TABLE local_substitution_members (
    group_id TEXT,
    generic_product_id TEXT,
    PRIMARY KEY (group_id, generic_product_id),
    FOREIGN KEY (group_id) REFERENCES local_substitution_groups(group_id)
);

##Sync Queue
sql-- Events waiting to sync to web
CREATE TABLE pending_sync_events (
    event_id TEXT PRIMARY KEY,
    restaurant_id TEXT NOT NULL,
    generic_product_id TEXT NOT NULL,
    distributor_id TEXT NOT NULL,
    case_price REAL NOT NULL,
    total_preferred_units REAL NOT NULL,
    effective_date TEXT NOT NULL,
    source_type TEXT NOT NULL,
    source_file_hash TEXT,
    created_at TEXT NOT NULL,
    retry_count INTEGER DEFAULT 0,
    last_retry TEXT
);

-- Track sync status
CREATE TABLE sync_metadata (
    sync_type TEXT PRIMARY KEY, -- 'products', 'preferences', etc.
    last_sync_timestamp TEXT,
    last_sync_status TEXT,
    error_message TEXT
);

-- Cache subscription status for offline checks
CREATE TABLE subscription_cache (
    organization_id TEXT PRIMARY KEY,
    is_valid INTEGER NOT NULL, -- boolean
    expires_at TEXT NOT NULL, -- ISO timestamp
    max_restaurants INTEGER,
    current_restaurants INTEGER,
    last_checked TEXT NOT NULL
);