use crate::config::SupabaseConfig;
use crate::db;
use crate::error::AppError;
use crate::state::{AppState, ProductSyncStatus};
use chrono::{DateTime, Utc};
use postgrest::Postgrest;
use serde::{Deserialize, Serialize};
use serde_json::json;
use tauri::{AppHandle, Emitter, Manager};
use tracing::{error, info};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncStatus {
    pub last_sync: Option<DateTime<Utc>>,
    pub pending_changes: i32,
    pub sync_in_progress: bool,
    pub next_scheduled_sync: Option<DateTime<Utc>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SyncResult {
    pub success: bool,
    pub items_synced: i32,
    pub errors: Vec<String>,
    pub duration_ms: u64,
}

#[derive(Debug, Serialize, Deserialize)]
struct SupabaseProduct {
    catalog_product_id: String,
    product_name: String,
    category_id: Option<String>,
    preferred_measurement: String,
    measurement_type: String,
    description: Option<String>,
    is_active: bool,
    updated_at: Option<DateTime<Utc>>,
}

// Verify authentication is working
pub async fn verify_authentication(postgrest: &Postgrest) -> Result<bool, AppError> {
    info!("Verifying authentication with Supabase...");
    
    // Try to fetch products with authentication
    match postgrest
        .from("product_catalog")
        .select("catalog_product_id")
        .limit(1)
        .execute()
        .await
    {
        Ok(response) => {
            let status = response.status();
            if status.is_success() {
                info!("Authentication successful");
                Ok(true)
            } else if status.as_u16() == 403 {
                error!("Authentication failed: Access denied (403)");
                Err(AppError::Auth("Authentication failed: Access denied. Check RLS policies.".to_string()))
            } else {
                error!("Authentication failed: HTTP {}", status);
                Err(AppError::Auth(format!("Authentication failed: HTTP {}", status)))
            }
        }
        Err(e) => {
            error!("Network error during authentication: {}", e);
            Err(AppError::Auth(format!("Network error during authentication: {}", e)))
        }
    }
}

// Update auth state helper (exported for main.rs)
pub async fn update_auth_state(app_handle: &AppHandle, is_authenticated: bool, error: Option<String>) {
    let state = app_handle.state::<AppState>();
    state.update_auth_state(|auth| {
        auth.is_authenticated = is_authenticated;
        auth.last_auth_check = Some(Utc::now());
        auth.auth_error = error;
    }).await;
    
    // Emit auth state change
    let auth_state = state.get_auth_state().await;
    app_handle.emit("auth-status-changed", &auth_state).ok();
}

// Main sync entry point
pub async fn start_product_sync(
    app_handle: AppHandle,
    config: SupabaseConfig,
) -> Result<(), AppError> {
    info!("Starting product sync system...");
    
    let _state = app_handle.state::<AppState>();
    
    // Initialize Postgrest client with authentication
    let postgrest_url = format!("{}/rest/v1", config.url);
    info!("Initializing Postgrest client with URL: {}", postgrest_url);
    info!("Using API key (first 10 chars): {}...", &config.anon_key[..10.min(config.anon_key.len())]);
    
    let postgrest = Postgrest::new(postgrest_url)
        .insert_header("apikey", &config.anon_key)
        .insert_header("Authorization", format!("Bearer {}", &config.anon_key));
    
    // Verify authentication before proceeding
    match verify_authentication(&postgrest).await {
        Ok(true) => {
            update_auth_state(&app_handle, true, None).await;
        }
        Err(e) => {
            update_auth_state(&app_handle, false, Some(e.to_string())).await;
            return Err(e);
        }
        _ => unreachable!(),
    }
    
    // Perform initial sync
    smart_sync(&app_handle, &postgrest).await?;
    
    // For now, we'll skip realtime subscription setup since the API is unclear
    // TODO: Implement realtime subscription when API is clarified
    info!("Initial sync complete. Realtime subscription not implemented yet.");
    
    Ok(())
}

// Smart sync function - the core of our sync strategy
pub async fn smart_sync(app_handle: &AppHandle, postgrest: &Postgrest) -> Result<(), AppError> {
    info!("Starting smart sync operation...");
    
    // Step 1: Record sync start time
    let sync_start_time = Utc::now();
    let start_instant = std::time::Instant::now();
    
    let state = app_handle.state::<AppState>();
    let pool = state.get_db().await?;
    
    // Step 2: Update state to show syncing
    state.update_product_sync_state(|s| {
        s.status = ProductSyncStatus::Syncing;
        s.error_message = None;
    }).await;
    emit_sync_status(app_handle, &state).await;
    
    // Step 3: Fetch all products from Supabase
    info!("Fetching products from Supabase...");
    let response = postgrest
        .from("product_catalog")
        .eq("is_active", "true")
        .execute()
        .await
        .map_err(|e| {
            error!("Network request to fetch products failed: {}", e);
            AppError::Sync(format!("Network request to fetch products failed: {}", e))
        })?;
    
    // DEFENSIVE CHECK: Make sure the HTTP status is a success before parsing
    if !response.status().is_success() {
        let status = response.status();
        let error_body = response.text().await.unwrap_or_else(|_| "Could not read error body".to_string());
        error!(
            "Supabase request failed with status {}: {}",
            status, error_body
        );
        
        // Special handling for authentication errors
        if status.as_u16() == 403 {
            return Err(AppError::Auth(format!(
                "Authentication failed during sync. Status: {}. Body: {}",
                status, error_body
            )));
        }
        
        return Err(AppError::Sync(format!(
            "Supabase returned a non-success status: {}. Body: {}",
            status, error_body
        )));
    }
    
    // Now that we know it was a success, we can safely parse the body
    let products: Vec<SupabaseProduct> = response
        .json()
        .await
        .map_err(|e| {
            error!("Failed to parse successful product response: {}", e);
            AppError::Sync(format!("Failed to parse product data from Supabase: {}", e))
        })?;
    
    info!("Fetched {} products, updating local database...", products.len());
    
    // Step 5: Start transaction
    let mut transaction = pool.begin().await?;
    
    // Step 6: UPSERT each product with timestamp
    let mut upserted_count = 0;
    for product in &products {
        sqlx::query(
            r#"
            INSERT INTO products (
                catalog_product_id, 
                product_name, 
                category_id,
                preferred_measurement, 
                measurement_type, 
                description,
                is_active, 
                updated_at, 
                last_synced_at,
                synced_at
            ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, CURRENT_TIMESTAMP)
            ON CONFLICT(catalog_product_id) DO UPDATE SET
                product_name = excluded.product_name,
                category_id = excluded.category_id,
                preferred_measurement = excluded.preferred_measurement,
                measurement_type = excluded.measurement_type,
                description = excluded.description,
                is_active = excluded.is_active,
                updated_at = excluded.updated_at,
                last_synced_at = excluded.last_synced_at,
                synced_at = CURRENT_TIMESTAMP
            "#
        )
        .bind(&product.catalog_product_id)
        .bind(&product.product_name)
        .bind(&product.category_id)
        .bind(&product.preferred_measurement)
        .bind(&product.measurement_type)
        .bind(&product.description)
        .bind(product.is_active as i32)
        .bind(&product.updated_at)
        .bind(&sync_start_time)
        .execute(&mut *transaction)
        .await?;
        
        upserted_count += 1;
    }
    
    // Step 7: Delete old products (safe, parameterized)
    let deleted = sqlx::query(
        "DELETE FROM products WHERE last_synced_at < ?1 OR last_synced_at IS NULL"
    )
    .bind(&sync_start_time)
    .execute(&mut *transaction)
    .await?
    .rows_affected();
    
    if deleted > 0 {
        info!("Removed {} products no longer in catalog", deleted);
    }
    
    // Step 8: Commit transaction
    transaction.commit().await?;
    
    // Step 9: Update state and emit events
    let count = db::get_product_count(&pool).await?;
    let duration_ms = start_instant.elapsed().as_millis() as u64;
    
    state.update_product_sync_state(|s| {
        s.status = ProductSyncStatus::Synced;
        s.last_synced = Some(Utc::now());
        s.products_count = count;
        s.error_message = None;
    }).await;
    
    emit_products_updated(app_handle).await;
    emit_sync_status(app_handle, &state).await;
    
    info!(
        "Smart sync completed successfully in {}ms. Upserted: {}, Deleted: {}", 
        duration_ms, upserted_count, deleted
    );
    
    Ok(())
}

// Helper to emit products updated event
async fn emit_products_updated(app_handle: &AppHandle) {
    app_handle.emit("products-updated", json!({})).ok();
}

// Helper to emit sync status
async fn emit_sync_status(app_handle: &AppHandle, state: &AppState) {
    let sync_state = state.get_product_sync_state().await;
    app_handle.emit("sync-status-changed", &sync_state).ok();
}

// Force sync function for manual trigger
pub async fn force_sync(app_handle: &AppHandle) -> Result<(), AppError> {
    info!("Force sync requested...");
    
    let config = SupabaseConfig::from_env()?;
    
    // Initialize Postgrest client
    let postgrest = Postgrest::new(&format!("{}/rest/v1", config.url))
        .insert_header("apikey", &config.anon_key)
        .insert_header("Authorization", format!("Bearer {}", &config.anon_key));
    
    // Use smart sync
    smart_sync(app_handle, &postgrest).await
}