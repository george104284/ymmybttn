use sqlx::{Pool, Sqlite};
use std::sync::Arc;
use tokio::sync::Mutex;
use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Default)]
pub struct AppState {
    pub db: Arc<Mutex<Option<Pool<Sqlite>>>>,
    pub current_user: Arc<Mutex<Option<CurrentUser>>>,
    pub sync_status: Arc<Mutex<SyncStatus>>,
    pub product_sync_state: Arc<Mutex<ProductSyncState>>,
    pub auth_state: Arc<Mutex<AuthState>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurrentUser {
    pub user_id: String,
    pub email: String,
    pub full_name: String,
    pub restaurants: Vec<String>,
    pub organization_id: String,
    pub expires_at: DateTime<Utc>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct SyncStatus {
    pub is_syncing: bool,
    pub last_sync: Option<DateTime<Utc>>,
    pub pending_count: i32,
    pub last_error: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum ProductSyncStatus {
    Synced,
    Syncing,
    Error(String),
}

impl Default for ProductSyncStatus {
    fn default() -> Self {
        ProductSyncStatus::Synced
    }
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct ProductSyncState {
    pub status: ProductSyncStatus,
    pub last_synced: Option<DateTime<Utc>>,
    pub products_count: usize,
    pub error_message: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AuthState {
    pub is_authenticated: bool,
    pub last_auth_check: Option<DateTime<Utc>>,
    pub auth_error: Option<String>,
}

impl Default for AuthState {
    fn default() -> Self {
        Self {
            is_authenticated: false,
            last_auth_check: None,
            auth_error: None,
        }
    }
}

impl AppState {
    pub async fn get_db(&self) -> Result<Pool<Sqlite>, crate::error::AppError> {
        let db_lock = self.db.lock().await;
        db_lock
            .as_ref()
            .cloned()
            .ok_or_else(|| crate::error::AppError::Internal("Database not initialized".to_string()))
    }
    
    pub async fn set_db(&self, pool: Pool<Sqlite>) {
        let mut db_lock = self.db.lock().await;
        *db_lock = Some(pool);
    }
    
    pub async fn get_current_user(&self) -> Option<CurrentUser> {
        let user_lock = self.current_user.lock().await;
        user_lock.clone()
    }
    
    pub async fn set_current_user(&self, user: Option<CurrentUser>) {
        let mut user_lock = self.current_user.lock().await;
        *user_lock = user;
    }
    
    pub async fn is_authenticated(&self) -> bool {
        let user_lock = self.current_user.lock().await;
        if let Some(user) = user_lock.as_ref() {
            user.expires_at > Utc::now()
        } else {
            false
        }
    }
    
    pub async fn update_sync_status<F>(&self, updater: F) 
    where
        F: FnOnce(&mut SyncStatus),
    {
        let mut status = self.sync_status.lock().await;
        updater(&mut status);
    }
    
    pub async fn get_sync_status(&self) -> SyncStatus {
        let status = self.sync_status.lock().await;
        status.clone()
    }
    
    pub async fn update_product_sync_state<F>(&self, updater: F) 
    where
        F: FnOnce(&mut ProductSyncState),
    {
        let mut state = self.product_sync_state.lock().await;
        updater(&mut state);
    }
    
    pub async fn get_product_sync_state(&self) -> ProductSyncState {
        let state = self.product_sync_state.lock().await;
        state.clone()
    }
    
    pub async fn update_auth_state<F>(&self, updater: F) 
    where
        F: FnOnce(&mut AuthState),
    {
        let mut state = self.auth_state.lock().await;
        updater(&mut state);
    }
    
    pub async fn get_auth_state(&self) -> AuthState {
        let state = self.auth_state.lock().await;
        state.clone()
    }
}