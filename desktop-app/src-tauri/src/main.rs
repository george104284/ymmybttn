// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod db;
mod csv_import;
mod sync;
mod commands;
mod state;
mod error;

use state::AppState;
use tauri::Manager;

fn main() {
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
            commands::get_current_prices,
            commands::get_distributors,
            commands::init_demo_data,
        ])
        .setup(|app| {
            let app_handle = app.handle();
            
            // Initialize database on app start
            tauri::async_runtime::block_on(async move {
                let state = app_handle.state::<AppState>();
                let mut db_lock = state.db.lock().await;
                
                match db::init_database(&app_handle).await {
                    Ok(pool) => {
                        *db_lock = Some(pool);
                        println!("Database initialized successfully");
                    }
                    Err(e) => {
                        eprintln!("Failed to initialize database: {}", e);
                    }
                }
            });
            
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}