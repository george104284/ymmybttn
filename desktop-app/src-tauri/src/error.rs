use serde::{Deserialize, Serialize};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),
    
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    
    #[error("CSV error: {0}")]
    Csv(#[from] csv::Error),
    
    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),
    
    #[error("Authentication error: {0}")]
    Auth(String),
    
    #[error("Validation error: {0}")]
    Validation(String),
    
    #[error("Sync error: {0}")]
    Sync(String),
    
    #[error("Not found: {0}")]
    NotFound(String),
    
    #[error("Already exists: {0}")]
    AlreadyExists(String),
    
    #[error("Internal error: {0}")]
    Internal(String),
    
    #[error("Configuration error: {0}")]
    Config(String),
}

// Convert AppError to a serializable format for the frontend
impl AppError {
    pub fn to_frontend_error(&self) -> FrontendError {
        FrontendError {
            error_type: match self {
                AppError::Database(_) => "database",
                AppError::Io(_) => "io",
                AppError::Csv(_) => "csv",
                AppError::Serialization(_) => "serialization",
                AppError::Auth(_) => "auth",
                AppError::Validation(_) => "validation",
                AppError::Sync(_) => "sync",
                AppError::NotFound(_) => "not_found",
                AppError::AlreadyExists(_) => "already_exists",
                AppError::Internal(_) => "internal",
                AppError::Config(_) => "config",
            },
            message: self.to_string(),
        }
    }
}

#[derive(Serialize, Deserialize)]
pub struct FrontendError {
    pub error_type: &'static str,
    pub message: String,
}

// Implement conversion for Tauri commands
impl From<AppError> for tauri::Error {
    fn from(err: AppError) -> Self {
        tauri::Error::from(anyhow::anyhow!("{}", err))
    }
}

pub type Result<T> = std::result::Result<T, AppError>;