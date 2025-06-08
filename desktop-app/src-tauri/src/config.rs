use dotenv::dotenv;
use std::env;
use crate::error::AppError;

#[derive(Debug, Clone)]
pub struct SupabaseConfig {
    pub url: String,
    pub anon_key: String,
}

impl SupabaseConfig {
    pub fn from_env() -> Result<Self, AppError> {
        // Load .env file if it exists
        dotenv().ok();

        let url = env::var("SUPABASE_URL")
            .map_err(|_| AppError::Config(
                "SUPABASE_URL not found. Please set it in .env file or environment variables".to_string()
            ))?;
        
        let anon_key = env::var("SUPABASE_ANON_KEY")
            .map_err(|_| AppError::Config(
                "SUPABASE_ANON_KEY not found. Please set it in .env file or environment variables".to_string()
            ))?;

        Ok(Self {
            url,
            anon_key,
        })
    }

    pub fn realtime_url(&self) -> String {
        self.url.replace("https://", "wss://").replace("http://", "ws://") + "/realtime/v1/websocket"
    }
}