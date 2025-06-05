-- Orders and analytics tables

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