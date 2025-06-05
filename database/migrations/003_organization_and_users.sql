-- Organization and user management tables

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