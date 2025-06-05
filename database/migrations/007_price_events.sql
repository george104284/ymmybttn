-- Price events and history

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