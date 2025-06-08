use crate::db::models::*;
use crate::state::{AppState, ProductSyncState, AuthState};
use crate::sync;
use tauri::{State, AppHandle};
use uuid::Uuid;
use chrono::Utc;

// Basic ping command for testing IPC
#[tauri::command]
pub async fn ping() -> Result<String, String> {
    Ok("pong".to_string())
}

// Get current user information from auth cache
#[tauri::command]
pub async fn get_current_user(
    state: State<'_, AppState>,
) -> Result<Option<AuthCache>, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        let user = sqlx::query_as::<_, AuthCache>(
            "SELECT * FROM auth_cache LIMIT 1"
        )
        .fetch_optional(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
        
        Ok(user)
    } else {
        Err("Database not initialized".to_string())
    }
}

// Get restaurant list for current user
#[tauri::command]
pub async fn get_restaurants(
    state: State<'_, AppState>,
) -> Result<Vec<Restaurant>, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        let restaurants = sqlx::query_as::<_, Restaurant>(
            "SELECT * FROM restaurants"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
        
        Ok(restaurants)
    } else {
        Err("Database not initialized".to_string())
    }
}

// Get products for a restaurant
#[tauri::command]
pub async fn get_products(
    state: State<'_, AppState>,
) -> Result<Vec<Product>, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        let products = sqlx::query_as::<_, Product>(
            "SELECT * FROM products"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
        
        Ok(products)
    } else {
        Err("Database not initialized".to_string())
    }
}

// Get all products (new implementation using db helper)
#[tauri::command]
pub async fn get_all_products(
    state: State<'_, AppState>,
) -> Result<Vec<Product>, String> {
    let pool = state.get_db().await
        .map_err(|e| format!("Database error: {}", e))?;
    
    crate::db::get_all_products(&pool).await
        .map_err(|e| format!("Failed to get products: {}", e))
}

// Get sync status
#[tauri::command]
pub async fn get_sync_status(
    state: State<'_, AppState>,
) -> Result<ProductSyncState, String> {
    Ok(state.get_product_sync_state().await)
}

// Force sync - now much simpler with postgrest
#[tauri::command]
pub async fn force_sync(
    app_handle: AppHandle,
) -> Result<(), String> {
    sync::force_sync(&app_handle).await
        .map_err(|e| format!("Sync failed: {}", e))
}

// Get authentication status
#[tauri::command]
pub async fn get_auth_status(
    state: State<'_, AppState>,
) -> Result<AuthState, String> {
    Ok(state.get_auth_state().await)
}

// Get current prices for a restaurant
#[tauri::command]
pub async fn get_current_prices(
    restaurant_id: String,
    state: State<'_, AppState>,
) -> Result<Vec<LocalCurrentPrice>, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        let prices = sqlx::query_as::<_, LocalCurrentPrice>(
            "SELECT * FROM local_current_prices WHERE restaurant_id = ? ORDER BY effective_date DESC"
        )
        .bind(restaurant_id)
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
        
        Ok(prices)
    } else {
        Err("Database not initialized".to_string())
    }
}

// Get distributors
#[tauri::command]
pub async fn get_distributors(
    state: State<'_, AppState>,
) -> Result<Vec<Distributor>, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        let distributors = sqlx::query_as::<_, Distributor>(
            "SELECT * FROM distributors"
        )
        .fetch_all(pool)
        .await
        .map_err(|e| format!("Database error: {}", e))?;
        
        Ok(distributors)
    } else {
        Err("Database not initialized".to_string())
    }
}

// Initialize demo data (for development)
#[tauri::command]
pub async fn init_demo_data(
    state: State<'_, AppState>,
) -> Result<String, String> {
    let pool = state.db.lock().await;
    
    if let Some(pool) = pool.as_ref() {
        // Check if data already exists
        let count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM auth_cache")
            .fetch_one(pool)
            .await
            .map_err(|e| format!("Database error: {}", e))?;
        
        if count > 0 {
            return Ok("Demo data already exists".to_string());
        }
        
        let user_id = Uuid::new_v4().to_string();
        let org_id = Uuid::new_v4().to_string();
        let restaurant_id = Uuid::new_v4().to_string();
        let tomorrow = Utc::now() + chrono::Duration::days(1);
        
        // Insert demo auth cache
        sqlx::query(
            r#"INSERT INTO auth_cache (user_id, email, full_name, restaurants, permissions, expires_at) 
               VALUES (?, ?, ?, ?, ?, ?)"#
        )
        .bind(&user_id)
        .bind("demo@ymmybttn.com")
        .bind("Demo User")
        .bind(format!("[\"{}\"]", restaurant_id)) // JSON array of restaurant IDs
        .bind("{\"products.view\": true, \"orders.create\": true}") // Sample permissions
        .bind(tomorrow)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert auth cache: {}", e))?;
        
        // Insert demo subscription cache
        sqlx::query(
            r#"INSERT INTO subscription_cache (organization_id, organization_name, plan_name, max_restaurants, features, expires_at) 
               VALUES (?, ?, ?, ?, ?, ?)"#
        )
        .bind(&org_id)
        .bind("Demo Restaurant Group")
        .bind("Professional")
        .bind(3)
        .bind("{\"csv_upload\": true, \"invoice_scanning\": true}")
        .bind(tomorrow)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert subscription cache: {}", e))?;
        
        // Insert demo restaurant
        sqlx::query(
            r#"INSERT INTO restaurants (restaurant_id, restaurant_name, organization_id) 
               VALUES (?, ?, ?)"#
        )
        .bind(&restaurant_id)
        .bind("Demo Restaurant")
        .bind(&org_id)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert restaurant: {}", e))?;
        
        // Insert demo distributors
        let sysco_id = Uuid::new_v4().to_string();
        let usf_id = Uuid::new_v4().to_string();
        
        sqlx::query(
            "INSERT INTO distributors (distributor_id, distributor_name, distributor_code) VALUES (?, ?, ?)"
        )
        .bind(&sysco_id)
        .bind("Sysco")
        .bind("SYSCO")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert Sysco: {}", e))?;
        
        sqlx::query(
            "INSERT INTO distributors (distributor_id, distributor_name, distributor_code) VALUES (?, ?, ?)"
        )
        .bind(&usf_id)
        .bind("US Foods")
        .bind("USF")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert US Foods: {}", e))?;
        
        // Insert demo products
        let tomato_id = Uuid::new_v4().to_string();
        let onion_id = Uuid::new_v4().to_string();
        
        sqlx::query(
            r#"INSERT INTO products (catalog_product_id, product_name, preferred_measurement, measurement_type) 
               VALUES (?, ?, ?, ?)"#
        )
        .bind(&tomato_id)
        .bind("Tomatoes 6x6")
        .bind("lb")
        .bind("weight")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert tomato: {}", e))?;
        
        sqlx::query(
            r#"INSERT INTO products (catalog_product_id, product_name, preferred_measurement, measurement_type) 
               VALUES (?, ?, ?, ?)"#
        )
        .bind(&onion_id)
        .bind("Yellow Onions 50#")
        .bind("lb")
        .bind("weight")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert onion: {}", e))?;
        
        // Insert demo distributor specs
        // Sysco tomatoes: 25 lb case
        sqlx::query(
            r#"INSERT INTO distributor_specs (spec_id, catalog_product_id, distributor_id, distributor_item_code, 
               case_packs, pack_size, pack_unit_of_measure, total_preferred_units) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&Uuid::new_v4().to_string())
        .bind(&tomato_id)
        .bind(&sysco_id)
        .bind("SYS-TOM-66")
        .bind(1)
        .bind(25.0)
        .bind("lb")
        .bind(25.0)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert Sysco tomato spec: {}", e))?;
        
        // US Foods tomatoes: 20 lb case
        sqlx::query(
            r#"INSERT INTO distributor_specs (spec_id, catalog_product_id, distributor_id, distributor_item_code, 
               case_packs, pack_size, pack_unit_of_measure, total_preferred_units) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&Uuid::new_v4().to_string())
        .bind(&tomato_id)
        .bind(&usf_id)
        .bind("USF-8374")
        .bind(1)
        .bind(20.0)
        .bind("lb")
        .bind(20.0)
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert USF tomato spec: {}", e))?;
        
        // Insert demo prices
        let today = chrono::Local::now().date_naive();
        
        // Sysco tomato price: $18.50/case ($0.74/lb)
        sqlx::query(
            r#"INSERT INTO local_current_prices (price_id, restaurant_id, catalog_product_id, distributor_id, 
               case_price, total_preferred_units, effective_date, source_type) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&Uuid::new_v4().to_string())
        .bind(&restaurant_id)
        .bind(&tomato_id)
        .bind(&sysco_id)
        .bind(18.50)
        .bind(25.0)
        .bind(today)
        .bind("manual_entry")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert Sysco tomato price: {}", e))?;
        
        // US Foods tomato price: $16.00/case ($0.80/lb) - more expensive per lb!
        sqlx::query(
            r#"INSERT INTO local_current_prices (price_id, restaurant_id, catalog_product_id, distributor_id, 
               case_price, total_preferred_units, effective_date, source_type) 
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)"#
        )
        .bind(&Uuid::new_v4().to_string())
        .bind(&restaurant_id)
        .bind(&tomato_id)
        .bind(&usf_id)
        .bind(16.00)
        .bind(20.0)
        .bind(today)
        .bind("manual_entry")
        .execute(pool)
        .await
        .map_err(|e| format!("Failed to insert USF tomato price: {}", e))?;
        
        Ok("Demo data initialized successfully! Sysco tomatoes are cheaper per pound.".to_string())
    } else {
        Err("Database not initialized".to_string())
    }
}
