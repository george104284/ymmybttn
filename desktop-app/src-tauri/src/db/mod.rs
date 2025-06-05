use sqlx::{migrate::Migrator, sqlite::SqlitePoolOptions, Pool, Sqlite};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

use crate::error::AppError;

pub mod models;

// Static migrator that will be initialized with our migrations directory
static MIGRATOR: Migrator = sqlx::migrate!("./migrations");

pub type DbPool = Pool<Sqlite>;

pub async fn init_database(app: &AppHandle) -> Result<DbPool, AppError> {
    // Get app data directory
    let app_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| AppError::Io(std::io::Error::new(
            std::io::ErrorKind::Other, 
            format!("Failed to get app data directory: {}", e)
        )))?;
    
    println!("App data directory: {}", app_dir.display());
    
    // Create directory if it doesn't exist
    if let Err(e) = std::fs::create_dir_all(&app_dir) {
        eprintln!("Failed to create app directory: {}", e);
        return Err(AppError::Io(e));
    }
    
    let db_path = app_dir.join("ymmybttn.db");
    println!("Database path: {}", db_path.display());
    
    // Check if we can write to this location
    if let Some(parent) = db_path.parent() {
        if !parent.exists() {
            eprintln!("Parent directory doesn't exist: {}", parent.display());
        } else if parent.metadata().map(|m| m.permissions().readonly()).unwrap_or(true) {
            eprintln!("Parent directory is read-only: {}", parent.display());
        }
    }
    
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    println!("Database URL: {}", db_url);
    
    // Create the database connection pool with better error handling
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await
        .map_err(|e| {
            eprintln!("Failed to connect to database at {}: {}", db_url, e);
            eprintln!("SQLite error details: {:?}", e);
            eprintln!("Does parent directory exist: {}", app_dir.exists());
            eprintln!("Trying to create empty file first...");
            
            // Try to create the database file manually if it doesn't exist
            if !db_path.exists() {
                if let Err(create_err) = std::fs::File::create(&db_path) {
                    eprintln!("Failed to create database file: {}", create_err);
                }
            }
            
            e  // Return the original error
        })?;
    
    println!("Successfully connected to database");
    
    // Run migrations
    println!("Running database migrations...");
    run_migrations(&pool).await?;
    println!("Database initialization complete");
    
    Ok(pool)
}

async fn run_migrations(pool: &DbPool) -> Result<(), AppError> {
    // First, enable foreign keys for this connection
    sqlx::query("PRAGMA foreign_keys = ON")
        .execute(pool)
        .await
        .map_err(|e| {
            eprintln!("Failed to enable foreign keys: {}", e);
            AppError::Database(e)
        })?;
    
    println!("Running database migrations...");
    
    // Run SQLx migrations
    MIGRATOR.run(pool).await.map_err(|e| {
        eprintln!("Failed to run migrations: {}", e);
        AppError::Database(e.into())
    })?;
    
    println!("All migrations completed successfully");
    Ok(())
}

// Helper functions for common database operations
pub async fn get_restaurant_id(pool: &DbPool, user_id: &str) -> Result<Option<String>, AppError> {
    let result = sqlx::query_scalar::<_, String>(
        "SELECT restaurant_id FROM user_assignments WHERE user_id = ? AND is_active = 1 LIMIT 1"
    )
    .bind(user_id)
    .fetch_optional(pool)
    .await?;
    
    Ok(result)
}

pub async fn check_user_auth(pool: &DbPool, email: &str) -> Result<Option<models::User>, AppError> {
    let user = sqlx::query_as::<_, models::User>(
        "SELECT * FROM users WHERE email = ? AND is_active = 1"
    )
    .bind(email)
    .fetch_optional(pool)
    .await?;
    
    Ok(user)
}