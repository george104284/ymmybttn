-- Product catalog and related tables

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