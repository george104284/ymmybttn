-- Restaurant and distributor core tables

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