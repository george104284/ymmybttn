// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod csv_import;
mod sync;
mod commands;
mod state;
mod error;
mod config;

use state::AppState;
use tauri::Manager;
use tracing::{error, info};

fn main() {
    // Initialize tracing/logging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();
    
    info!("Starting ymmybttn desktop app...");
    
    // Run the Tauri app
    tauri::Builder::default()
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .manage(AppState::default())
        .invoke_handler(tauri::generate_handler![
            commands::ping,
            commands::get_current_user,
            commands::get_restaurants,
            commands::get_products,
            commands::get_all_products,
            commands::get_sync_status,
            commands::get_auth_status,
            commands::force_sync,
            commands::get_current_prices,
            commands::get_distributors,
            commands::init_demo_data,
        ])
        .setup(|app| {
            let app_handle = app.handle();
            
            // Initialize database and sync on app start
            tauri::async_runtime::block_on(async move {
                let state = app_handle.state::<AppState>();
                
                // Step 1: Initialize database connection
                match db::init_database(&app_handle).await {
                    Ok(pool) => {
                        info!("Database initialized successfully");
                        let mut db_lock = state.db.lock().await;
                        *db_lock = Some(pool);
                        drop(db_lock); // Explicitly drop the lock
                        
                        // Step 2: Load Supabase configuration
                        match config::SupabaseConfig::from_env() {
                            Ok(config) => {
                                info!("Configuration loaded successfully");
                                
                                // Create postgrest client for auth check
                                let postgrest = postgrest::Postgrest::new(&format!("{}/rest/v1", config.url))
                                    .insert_header("apikey", &config.anon_key)
                                    .insert_header("Authorization", format!("Bearer {}", &config.anon_key));
                                
                                // Step 3: Perform initial authentication check
                                match sync::verify_authentication(&postgrest).await {
                                    Ok(true) => {
                                        info!("Authentication verified successfully");
                                        sync::update_auth_state(&app_handle, true, None).await;
                                        
                                        // Step 4: Spawn background task for sync
                                        let app_handle_clone = app_handle.clone();
                                        tauri::async_runtime::spawn(async move {
                                            info!("Starting product sync system...");
                                            if let Err(e) = sync::start_product_sync(app_handle_clone, config).await {
                                                error!("Failed to start product sync: {}", e);
                                            }
                                        });
                                    }
                                    Ok(false) => {
                                        error!("Authentication check returned false");
                                        sync::update_auth_state(&app_handle, false, Some("Authentication failed".to_string())).await;
                                        // App continues to run but without sync
                                    }
                                    Err(e) => {
                                        error!("Authentication check failed: {}", e);
                                        sync::update_auth_state(&app_handle, false, Some(e.to_string())).await;
                                        // App continues to run but without sync
                                    }
                                }
                            }
                            Err(e) => {
                                error!("Failed to load configuration: {}", e);
                                // App continues to run but without sync
                                // Update auth state to show config error
                                sync::update_auth_state(&app_handle, false, Some(format!("Configuration error: {}", e))).await;
                            }
                        }
                    }
                    Err(e) => {
                        error!("Failed to initialize database: {}", e);
                        // Could show an error dialog here, but for now just log
                    }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}