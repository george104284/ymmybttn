-- Development Schema - Combined from all migrations
-- This file recreates the entire database schema for development use
-- Use scripts/reset-dev-database.js to apply this schema

-- ============================================================================
-- EXTENSIONS
-- ============================================================================

-- Enable necessary PostgreSQL extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE REFERENCE TABLES
-- ============================================================================

-- Unit conversion reference
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

-- Insert common unit conversions
INSERT INTO unit_conversions (from_unit, to_unit, conversion_factor) VALUES
    -- Weight conversions
    ('lb', 'oz', 16),
    ('oz', 'lb', 0.0625),
    ('kg', 'lb', 2.20462),
    ('lb', 'kg', 0.453592),
    ('g', 'oz', 0.035274),
    ('oz', 'g', 28.3495),
    
    -- Volume conversions
    ('gal', 'qt', 4),
    ('qt', 'gal', 0.25),
    ('qt', 'pt', 2),
    ('pt', 'qt', 0.5),
    ('pt', 'cup', 2),
    ('cup', 'pt', 0.5),
    ('cup', 'fl_oz', 8),
    ('fl_oz', 'cup', 0.125),
    ('l', 'ml', 1000),
    ('ml', 'l', 0.001),
    
    -- Count conversions (same unit)
    ('each', 'each', 1),
    ('dozen', 'each', 12),
    ('each', 'dozen', 0.083333),
    ('case', 'case', 1);

-- Insert measurement types
INSERT INTO measurement_types (unit, measurement_type) VALUES
    -- Weight units
    ('lb', 'weight'),
    ('oz', 'weight'),
    ('kg', 'weight'),
    ('g', 'weight'),
    
    -- Volume units
    ('gal', 'volume'),
    ('qt', 'volume'),
    ('pt', 'volume'),
    ('cup', 'volume'),
    ('fl_oz', 'volume'),
    ('l', 'volume'),
    ('ml', 'volume'),
    
    -- Count units
    ('each', 'count'),
    ('dozen', 'count'),
    ('case', 'count');

-- ============================================================================
-- ORGANIZATION AND USER MANAGEMENT
-- ============================================================================

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

-- Organization that owns restaurants
CREATE TABLE organizations (
    organization_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_name VARCHAR(255) NOT NULL,
    primary_contact_id UUID REFERENCES users(user_id),
    billing_email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Granular permissions
CREATE TABLE permissions (
    permission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_name VARCHAR(100) UNIQUE NOT NULL,
    permission_category VARCHAR(50), -- products, orders, reports, users, distributors
    description TEXT
);

-- Junction table for user type permissions
CREATE TABLE user_type_permissions (
    user_type_id UUID REFERENCES user_types(user_type_id),
    permission_id UUID REFERENCES permissions(permission_id),
    PRIMARY KEY (user_type_id, permission_id)
);

-- Insert default user types
INSERT INTO user_types (type_name, description, base_permissions) VALUES
    ('owner', 'Restaurant owner with full access', '{"all": true}'),
    ('gm', 'General Manager with operational access', '{"products": true, "orders": true, "reports": true, "users": "limited"}'),
    ('manager', 'Manager with ordering capabilities', '{"products": "view", "orders": true, "reports": "limited"}'),
    ('chef', 'Chef with product and ordering access', '{"products": true, "orders": true}'),
    ('distributor_sales', 'Distributor sales representative', '{"distributor_products": true, "orders": "view"}'),
    ('viewer', 'View-only access', '{"products": "view", "orders": "view", "reports": "view"}');

-- Insert default permissions
INSERT INTO permissions (permission_name, permission_category, description) VALUES
    -- Product permissions
    ('products.view', 'products', 'View products and pricing'),
    ('products.edit', 'products', 'Edit product information'),
    ('products.create', 'products', 'Create new products'),
    ('products.delete', 'products', 'Delete products'),
    
    -- Order permissions
    ('orders.view', 'orders', 'View orders'),
    ('orders.create', 'orders', 'Create new orders'),
    ('orders.edit', 'orders', 'Edit existing orders'),
    ('orders.export', 'orders', 'Export orders to distributors'),
    
    -- Report permissions
    ('reports.view', 'reports', 'View basic reports'),
    ('reports.financial', 'reports', 'View financial reports'),
    ('reports.analytics', 'reports', 'View analytics and insights'),
    
    -- User permissions
    ('users.manage', 'users', 'Manage user accounts'),
    ('users.invite', 'users', 'Invite new users'),
    
    -- Distributor permissions
    ('distributor_products.edit', 'distributors', 'Edit distributor product specs'),
    
    -- Price permissions
    ('prices.view_current', 'products', 'View current prices'),
    ('prices.upload_csv', 'products', 'Upload CSV price files'),
    ('prices.view_historical', 'products', 'View historical pricing');

-- ============================================================================
-- RESTAURANTS AND DISTRIBUTORS
-- ============================================================================

-- Restaurant master table
CREATE TABLE restaurants (
    restaurant_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_name VARCHAR(255) NOT NULL,
    organization_id UUID REFERENCES organizations(organization_id),
    address JSONB,
    contact_info JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

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

-- Which distributors each restaurant uses
CREATE TABLE restaurant_distributors (
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    distributor_id UUID REFERENCES distributors(distributor_id),
    account_number VARCHAR(100),
    delivery_days JSONB, -- ["Monday", "Thursday"]
    is_active BOOLEAN DEFAULT TRUE,
    PRIMARY KEY (restaurant_id, distributor_id)
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

-- Insert some common distributors (can be removed in production)
INSERT INTO distributors (distributor_name, distributor_code, is_active) VALUES
    ('Sysco', 'SYSCO', TRUE),
    ('US Foods', 'USF', TRUE),
    ('Performance Food Group', 'PFG', TRUE),
    ('Restaurant Depot', 'RD', TRUE);

-- ============================================================================
-- PRODUCT CATALOG
-- ============================================================================

-- Categories for organization
CREATE TABLE categories (
    category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL, -- Beef, Poultry, Seafood, Produce, Dairy, Alcohol, Dry Goods, etc.
    parent_category_id UUID REFERENCES categories(category_id),
    sort_order INTEGER,
    temperature_zone VARCHAR(50), -- refrigerated, frozen, dry, etc.
    created_at TIMESTAMP DEFAULT NOW()
);

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

-- Product preferences per restaurant
CREATE TABLE product_preferences (
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    preferred_distributor_id UUID REFERENCES distributors(distributor_id),
    always_use_preferred BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (restaurant_id, catalog_product_id)
);

-- Groups of interchangeable products
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
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    created_at TIMESTAMP DEFAULT NOW(),
    PRIMARY KEY (group_id, catalog_product_id)
);

-- Insert default categories
INSERT INTO categories (category_name, sort_order, temperature_zone) VALUES
    ('Produce', 1, 'refrigerated'),
    ('Dairy', 2, 'refrigerated'),
    ('Meat', 3, 'refrigerated'),
    ('Poultry', 4, 'refrigerated'),
    ('Seafood', 5, 'refrigerated'),
    ('Frozen', 6, 'frozen'),
    ('Dry Goods', 7, 'dry'),
    ('Beverages', 8, 'dry'),
    ('Paper & Disposables', 9, 'dry'),
    ('Cleaning Supplies', 10, 'dry'),
    ('Equipment & Smallwares', 11, 'dry');

-- Create indexes for common queries
CREATE INDEX idx_product_catalog_category ON product_catalog(category_id);
CREATE INDEX idx_restaurant_products_restaurant ON restaurant_products(restaurant_id);
CREATE INDEX idx_restaurant_products_catalog ON restaurant_products(catalog_product_id);
CREATE INDEX idx_distributor_specs_catalog ON distributor_product_specs(catalog_product_id);
CREATE INDEX idx_distributor_specs_distributor ON distributor_product_specs(distributor_id);

-- ============================================================================
-- STORAGE LOCATIONS
-- ============================================================================

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
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
    room_id UUID REFERENCES storage_rooms(room_id),
    room_location_id UUID REFERENCES room_locations(location_id),
    location_notes TEXT,
    quantity_typically_stored VARCHAR(50), -- "2 cases", "1 box"
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(restaurant_id, catalog_product_id)
);

-- Create indexes for efficient queries
CREATE INDEX idx_product_room ON product_locations(room_id);
CREATE INDEX idx_product_location ON product_locations(room_location_id);
CREATE INDEX idx_storage_rooms_restaurant ON storage_rooms(restaurant_id);

-- ============================================================================
-- PRICE EVENTS AND HISTORY
-- ============================================================================

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
    source_type VARCHAR(50) NOT NULL, -- csv_import, manual_entry, invoice_scan, api
    source_document_id UUID,
    source_file_hash VARCHAR(64),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for price lookups
CREATE INDEX idx_price_lookup ON price_events(restaurant_id, catalog_product_id, distributor_id, effective_date DESC);
CREATE INDEX idx_price_date_range ON price_events(restaurant_id, effective_date);

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

-- Create materialized view for current prices
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

-- Create index on the materialized view
CREATE INDEX idx_current_prices ON current_prices(restaurant_id, catalog_product_id);

-- Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_current_prices()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY current_prices;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger function to refresh after price events
CREATE OR REPLACE FUNCTION trigger_refresh_current_prices()
RETURNS trigger AS $$
BEGIN
    -- Schedule a refresh (in production, you might use pg_cron or similar)
    -- For now, we'll just set a flag that the app can check
    PERFORM pg_notify('refresh_current_prices', 'true');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on price_events
CREATE TRIGGER after_price_event_change
AFTER INSERT OR UPDATE OR DELETE ON price_events
FOR EACH STATEMENT
EXECUTE FUNCTION trigger_refresh_current_prices();

-- ============================================================================
-- ORDERS AND ANALYTICS
-- ============================================================================

-- Order history
CREATE TABLE orders (
    order_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES restaurants(restaurant_id),
    order_date DATE NOT NULL,
    processing_mode VARCHAR(20), -- local, cloud
    total_amount DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    status VARCHAR(50) -- draft, submitted, completed, cancelled
);

-- Order line items with winner information
CREATE TABLE order_items (
    order_item_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(order_id),
    catalog_product_id UUID REFERENCES product_catalog(catalog_product_id),
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
-- Note: Fixed to use catalog_product_id instead of generic_product_id
CREATE VIEW order_items_by_distributor AS
SELECT 
    oi.order_id,
    o.restaurant_id,
    oi.selected_distributor_id,
    pc.product_name,
    rp.custom_name,
    COALESCE(rp.custom_name, pc.product_name) as display_name,
    dps.distributor_item_code,
    oi.quantity as case_quantity,
    COALESCE(
        JSON_BUILD_OBJECT(
            'room', sr.room_name,
            'location', rl.location_name
        )::text,
        'No location assigned'
    ) as location_info,
    oi.case_price,
    oi.extended_price
FROM order_items oi
JOIN orders o ON oi.order_id = o.order_id
JOIN product_catalog pc ON oi.catalog_product_id = pc.catalog_product_id
LEFT JOIN restaurant_products rp ON 
    o.restaurant_id = rp.restaurant_id 
    AND oi.catalog_product_id = rp.catalog_product_id
LEFT JOIN distributor_product_specs dps ON 
    oi.catalog_product_id = dps.catalog_product_id 
    AND oi.selected_distributor_id = dps.distributor_id
LEFT JOIN product_locations pl ON 
    o.restaurant_id = pl.restaurant_id 
    AND oi.catalog_product_id = pl.catalog_product_id
LEFT JOIN storage_rooms sr ON pl.room_id = sr.room_id
LEFT JOIN room_locations rl ON pl.room_location_id = rl.location_id
ORDER BY sr.sort_order, rl.sort_order, pc.product_name;

-- Create indexes for order queries
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(catalog_product_id);
CREATE INDEX idx_order_exports_order ON order_exports(order_id);

-- ============================================================================
-- SUBSCRIPTION AND BILLING
-- ============================================================================

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
    organization_id UUID REFERENCES organizations(organization_id),
    plan_id UUID REFERENCES subscription_plans(plan_id),
    status VARCHAR(50) NOT NULL, -- active, canceled, past_due, trialing
    current_period_start TIMESTAMP NOT NULL,
    current_period_end TIMESTAMP NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    stripe_subscription_id VARCHAR(255), -- Payment provider reference
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Subscription usage tracking
CREATE TABLE subscription_usage (
    usage_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    subscription_id UUID REFERENCES subscriptions(subscription_id),
    usage_type VARCHAR(50), -- restaurants_count, users_count
    usage_value INTEGER,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, max_restaurants, max_users, price_monthly, price_annual, features) VALUES
    ('Starter', 1, 5, 99.00, 990.00, '{"csv_upload": true, "invoice_scanning": false, "api_access": false, "support": "email"}'),
    ('Professional', 3, 15, 249.00, 2490.00, '{"csv_upload": true, "invoice_scanning": true, "api_access": false, "support": "priority"}'),
    ('Enterprise', 10, 50, 599.00, 5990.00, '{"csv_upload": true, "invoice_scanning": true, "api_access": true, "support": "dedicated"}'),
    ('Unlimited', -1, -1, 999.00, 9990.00, '{"csv_upload": true, "invoice_scanning": true, "api_access": true, "support": "dedicated", "custom_features": true}');

-- Create a view to check subscription status
CREATE VIEW subscription_status AS
SELECT 
    s.organization_id,
    s.subscription_id,
    s.status,
    s.current_period_end,
    sp.plan_name,
    sp.max_restaurants,
    sp.max_users,
    sp.features,
    (SELECT COUNT(*) FROM restaurants r WHERE r.organization_id = s.organization_id) as current_restaurants,
    (SELECT COUNT(DISTINCT ua.user_id) 
     FROM user_assignments ua 
     JOIN restaurants r ON ua.restaurant_id = r.restaurant_id 
     WHERE r.organization_id = s.organization_id) as current_users,
    CASE 
        WHEN sp.max_restaurants = -1 THEN TRUE
        WHEN (SELECT COUNT(*) FROM restaurants r WHERE r.organization_id = s.organization_id) < sp.max_restaurants THEN TRUE
        ELSE FALSE
    END as can_add_restaurant,
    CASE 
        WHEN sp.max_users IS NULL THEN TRUE
        WHEN sp.max_users = -1 THEN TRUE
        WHEN (SELECT COUNT(DISTINCT ua.user_id) 
              FROM user_assignments ua 
              JOIN restaurants r ON ua.restaurant_id = r.restaurant_id 
              WHERE r.organization_id = s.organization_id) < sp.max_users THEN TRUE
        ELSE FALSE
    END as can_add_user
FROM subscriptions s
JOIN subscription_plans sp ON s.plan_id = sp.plan_id
WHERE s.status IN ('active', 'trialing');

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable Row Level Security on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_product_specs ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_distributors ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitution_group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE distributor_sales_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_export_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's restaurant IDs
CREATE OR REPLACE FUNCTION get_user_restaurant_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT restaurant_id 
        FROM user_assignments 
        WHERE user_id = user_uuid 
        AND is_active = TRUE
        AND restaurant_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get user's organization IDs
CREATE OR REPLACE FUNCTION get_user_organization_ids(user_uuid UUID)
RETURNS UUID[] AS $$
BEGIN
    RETURN ARRAY(
        SELECT DISTINCT r.organization_id 
        FROM restaurants r
        JOIN user_assignments ua ON r.restaurant_id = ua.restaurant_id
        WHERE ua.user_id = user_uuid 
        AND ua.is_active = TRUE
        AND r.organization_id IS NOT NULL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to check if user is distributor rep
CREATE OR REPLACE FUNCTION is_distributor_rep(user_uuid UUID, dist_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM user_assignments ua
        JOIN user_types ut ON ua.user_type_id = ut.user_type_id
        WHERE ua.user_id = user_uuid 
        AND ua.distributor_id = dist_id
        AND ut.type_name = 'distributor_sales'
        AND ua.is_active = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations policies
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- Restaurants policies
CREATE POLICY "Users can view their assigned restaurants" ON restaurants
    FOR SELECT USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Organization owners can manage restaurants" ON restaurants
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id FROM organizations 
            WHERE primary_contact_id = auth.uid()
        )
    );

-- Users policies
CREATE POLICY "Users can view users in their restaurants" ON users
    FOR SELECT USING (
        user_id IN (
            SELECT DISTINCT ua.user_id 
            FROM user_assignments ua
            WHERE ua.restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
        )
        OR user_id = auth.uid()
    );

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (user_id = auth.uid());

-- Product catalog policies (global products are viewable by all authenticated users)
CREATE POLICY "All authenticated users can view product catalog" ON product_catalog
    FOR SELECT USING (auth.uid() IS NOT NULL);

-- Restaurant products policies
CREATE POLICY "Users can view products for their restaurants" ON restaurant_products
    FOR SELECT USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Users can manage products for their restaurants" ON restaurant_products
    FOR ALL USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

-- Distributor product specs policies
CREATE POLICY "Users can view distributor specs" ON distributor_product_specs
    FOR SELECT USING (
        auth.uid() IS NOT NULL
    );

CREATE POLICY "Distributor reps can update their specs" ON distributor_product_specs
    FOR UPDATE USING (
        is_distributor_rep(auth.uid(), distributor_id)
    );

-- Price events policies
CREATE POLICY "Users can view prices for their restaurants" ON price_events
    FOR SELECT USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Users can insert prices for their restaurants" ON price_events
    FOR INSERT WITH CHECK (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

-- Orders policies
CREATE POLICY "Users can view orders for their restaurants" ON orders
    FOR SELECT USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Users can create orders for their restaurants" ON orders
    FOR INSERT WITH CHECK (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Users can update orders for their restaurants" ON orders
    FOR UPDATE USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

-- Order items policies (inherit from orders)
CREATE POLICY "Users can view order items for their orders" ON order_items
    FOR SELECT USING (
        order_id IN (
            SELECT order_id FROM orders 
            WHERE restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
        )
    );

CREATE POLICY "Users can manage order items for their orders" ON order_items
    FOR ALL USING (
        order_id IN (
            SELECT order_id FROM orders 
            WHERE restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
        )
    );

-- Storage locations policies
CREATE POLICY "Users can view storage rooms for their restaurants" ON storage_rooms
    FOR SELECT USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

CREATE POLICY "Users can manage storage rooms for their restaurants" ON storage_rooms
    FOR ALL USING (
        restaurant_id = ANY(get_user_restaurant_ids(auth.uid()))
    );

-- Subscription policies
CREATE POLICY "Users can view their organization subscriptions" ON subscriptions
    FOR SELECT USING (
        organization_id = ANY(get_user_organization_ids(auth.uid()))
    );

-- Public tables (no RLS needed, but still require authentication)
CREATE POLICY "Authenticated users can view categories" ON categories
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view distributors" ON distributors
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view user types" ON user_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view permissions" ON permissions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view measurement types" ON measurement_types
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view unit conversions" ON unit_conversions
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can view subscription plans" ON subscription_plans
    FOR SELECT USING (auth.uid() IS NOT NULL AND is_active = TRUE);

-- ============================================================================
-- AUTH INTEGRATION TRIGGERS
-- ============================================================================

-- Function to handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.users (
        auth_user_id,
        email,
        full_name,
        phone,
        mobile,
        preferred_contact_method,
        is_active,
        last_login
    ) VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.raw_user_meta_data->>'phone',
        NEW.raw_user_meta_data->>'mobile',
        COALESCE(NEW.raw_user_meta_data->>'preferred_contact_method', 'email'),
        true,
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile when auth user is created
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to handle user updates from Supabase Auth
CREATE OR REPLACE FUNCTION handle_user_update()
RETURNS trigger AS $$
BEGIN
    UPDATE public.users 
    SET 
        email = NEW.email,
        updated_at = NOW(),
        last_login = CASE 
            WHEN NEW.last_sign_in_at > OLD.last_sign_in_at THEN NOW()
            ELSE last_login
        END
    WHERE auth_user_id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to sync user updates
CREATE TRIGGER on_auth_user_updated
    AFTER UPDATE ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_user_update();