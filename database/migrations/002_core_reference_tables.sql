-- Core reference tables that don't depend on others

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