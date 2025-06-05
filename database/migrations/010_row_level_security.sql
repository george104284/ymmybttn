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