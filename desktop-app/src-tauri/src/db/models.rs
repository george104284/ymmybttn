use chrono::{DateTime, Utc, NaiveDate};
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

// Auth cache for offline access
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct AuthCache {
    pub user_id: String,
    pub email: String,
    pub full_name: String,
    pub auth_token_hash: Option<String>,
    pub restaurants: String, // JSON array
    pub permissions: Option<String>, // JSON object
    pub expires_at: DateTime<Utc>,
    pub cached_at: Option<DateTime<Utc>>,
}

// Subscription cache
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct SubscriptionCache {
    pub organization_id: String,
    pub organization_name: String,
    pub plan_name: String,
    pub max_restaurants: i32,
    pub features: Option<String>, // JSON
    pub expires_at: DateTime<Utc>,
    pub cached_at: Option<DateTime<Utc>>,
}

// Products synced from cloud
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Product {
    pub catalog_product_id: String,
    pub product_name: String,
    pub category_id: Option<String>,
    pub preferred_measurement: String,
    pub measurement_type: String,
    pub description: Option<String>,
    pub is_active: bool,
    pub updated_at: Option<DateTime<Utc>>,  // Changed from last_modified to match sync code
    pub synced_at: Option<DateTime<Utc>>,
}

// Distributors synced from cloud
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Distributor {
    pub distributor_id: String,
    pub distributor_name: String,
    pub distributor_code: Option<String>,
    pub synced_at: Option<DateTime<Utc>>,
}

// Distributor product specs
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct DistributorSpec {
    pub spec_id: String,
    pub catalog_product_id: String,
    pub distributor_id: String,
    pub distributor_item_code: Option<String>,
    pub case_packs: i32,
    pub pack_size: f64,
    pub pack_unit_of_measure: String,
    pub total_preferred_units: f64,
    pub synced_at: Option<DateTime<Utc>>,
}

// Restaurants this user manages
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct Restaurant {
    pub restaurant_id: String,
    pub restaurant_name: String,
    pub organization_id: String,
    pub synced_at: Option<DateTime<Utc>>,
}

// Local current prices (proprietary data)
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct LocalCurrentPrice {
    pub price_id: String,
    pub restaurant_id: String,
    pub catalog_product_id: String,
    pub distributor_id: String,
    pub case_price: f64,
    pub total_preferred_units: f64,
    pub unit_price: f64,
    pub effective_date: NaiveDate,
    pub source_type: String,
    pub source_file_name: Option<String>,
    pub source_file_hash: Option<String>,
    pub created_at: Option<DateTime<Utc>>,
}

// CSV import tracking
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct CsvImport {
    pub import_id: String,
    pub restaurant_id: String,
    pub distributor_id: String,
    pub file_name: String,
    pub file_hash: String,
    pub file_size: i32,
    pub row_count: Option<i32>,
    pub imported_count: Option<i32>,
    pub failed_count: Option<i32>,
    pub status: String,
    pub error_message: Option<String>,
    pub imported_at: Option<DateTime<Utc>>,
}

// Sync events pending Monday upload
#[derive(Debug, Clone, Serialize, Deserialize, FromRow)]
pub struct PendingSyncEvent {
    pub event_id: String,
    pub event_type: String,
    pub restaurant_id: String,
    pub payload: String, // JSON
    pub created_at: Option<DateTime<Utc>>,
    pub scheduled_for: DateTime<Utc>,
    pub sync_attempts: i32,
    pub last_attempt_at: Option<DateTime<Utc>>,
    pub last_error: Option<String>,
}

// View models for frontend display
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceWithDetails {
    pub price: LocalCurrentPrice,
    pub product_name: String,
    pub distributor_name: String,
    pub is_winner: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PriceImportResult {
    pub total_rows: i32,
    pub successful_imports: i32,
    pub failed_imports: i32,
    pub errors: Vec<String>,
    pub distributor_id: String,
    pub effective_date: NaiveDate,
}

// Column mapping for CSV imports
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CsvColumnMapping {
    pub product_name_column: Option<String>,
    pub product_code_column: Option<String>,
    pub price_column: Option<String>,
    pub pack_size_column: Option<String>,
    pub unit_column: Option<String>,
}

// Legacy models (remove these after updating all references)
pub type User = AuthCache;
pub type RestaurantProduct = Product;
pub type CurrentPrice = PriceWithDetails;
pub type PriceEvent = LocalCurrentPrice;
pub type Order = CsvImport; // Placeholder
pub type OrderItem = CsvImport; // Placeholder
