use serde::Serialize;
use thiserror::Error;

#[derive(Debug, Error)]
pub enum AppError {
    #[error("Failed to acquire state lock: {0}")]
    LockError(String),

    #[error("Serialization error: {0}")]
    SerializationError(#[from] serde_json::Error),

    #[error("I/O error: {0}")]
    IoError(#[from] std::io::Error),

    #[error("Engine error: {0}")]
    EngineError(#[from] anyhow::Error),

    #[error("Configuration error: {0}")]
    ConfigError(String),

    #[error("Network binding error: {0}")]
    NetworkError(String),
}

// Convert our custom error into a String that Tauri can return to the frontend
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

pub type AppResult<T> = Result<T, AppError>;
