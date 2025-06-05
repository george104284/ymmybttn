-- Storage location management

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