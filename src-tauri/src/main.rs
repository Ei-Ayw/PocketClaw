#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::env;
use axum::{routing::{get, post}, Router, Json};
use serde::{Deserialize, Serialize};

#[derive(Deserialize)]
struct ChatRequest {
    message: String,
    provider_id: String,
}

#[derive(Serialize)]
struct ChatResponse {
    response: String,
    status: String,
}

#[tokio::main]
async fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Check if we should boot into Headless Server mode
    if args.iter().any(|arg| arg == "--server") {
        println!("Starting PocketClaw in Headless Server mode...");

        let port: u16 = args.iter()
            .position(|a| a == "--port")
            .and_then(|i| args.get(i + 1))
            .and_then(|v| v.parse().ok())
            .unwrap_or(8080);

        // XPLAT-06: Default to 127.0.0.1 (loopback only) to avoid Windows firewall popups.
        // Use --bind 0.0.0.0 to explicitly listen on all interfaces.
        let host = args.iter()
            .position(|a| a == "--bind")
            .and_then(|i| args.get(i + 1))
            .map(|s| s.as_str())
            .unwrap_or("127.0.0.1");

        println!("Listening on http://{}:{}", host, port);

        let app = Router::new()
            .route("/", get(|| async { "PocketClaw Core Server is running!\nIn production, this will serve the React SPA directly." }))
            .route("/api/chat", post(handle_chat_request));

        let addr = format!("{}:{}", host, port);
        
        // Handle potentially failing network binding without unwrap()
        match tokio::net::TcpListener::bind(&addr).await {
            Ok(listener) => {
                if let Err(e) = axum::serve(listener, app).await {
                    eprintln!("Fatal server error: {}", e);
                    std::process::exit(1);
                }
            }
            Err(e) => {
                eprintln!("Failed to bind to {}: {}", addr, e);
                std::process::exit(1);
            }
        }
    } else {
        // Normal Desktop / Desktop GUI Mode
        tauri_app_lib::run()
    }
}

// Simple HTTP handler to replicate Tauri IPC for Headless users
async fn handle_chat_request(Json(payload): Json<ChatRequest>) -> Json<ChatResponse> {
    // In a full implementation, this handler would share the same DaemonState & Keyring memory
    // as the Tauri command using Axum State. For this demo, we'll return a stub indicating
    // the REST API is wired up and ready for the shared State extraction phase.
    
    println!("Server received API request for provider: {}", payload.provider_id);
    println!("Message: {}", payload.message);
    
    Json(ChatResponse {
        response: format!("Headless API received your message for {}. Note: Requires linking Axum State to Tauri DaemonState for live OS Keyring decryption.", payload.provider_id),
        status: "success".to_string()
    })
}
