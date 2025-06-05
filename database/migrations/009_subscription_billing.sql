-- Subscription and billing tables

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