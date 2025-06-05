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
}