use keyring::Entry;
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, oneshot};
use tauri::Emitter;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use zeroclaw_engine::Config;
use zeroclaw_engine::agent::Agent;
use zeroclaw_engine::skills::Skill;
use zeroclaw_engine::memory::{MemoryCategory, MemoryEntry};
use zeroclaw_engine::tools::Tool;
use zeroclaw_engine::observability::traits::ObserverMetric;
use std::sync::Arc;
use std::time::Instant;

pub mod error;
use crate::error::{AppError, AppResult};

#[derive(Default, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub provider_id: String,
    pub model_name: String,
    #[serde(skip_serializing)]
    pub api_key: String,
    pub api_url: Option<String>,
    pub temperature: f64,
    pub max_tokens: Option<u32>,
}

/// Sectioned engine config that frontend can read/write
#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsAgent {
    pub max_tool_iterations: usize,
    pub max_history_messages: usize,
    pub parallel_tools: bool,
    pub compact_context: bool,
    pub tool_dispatcher: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsAutonomy {
    pub level: String, // "ReadOnly" | "Supervised" | "Full"
    pub workspace_only: bool,
    pub allowed_commands: Vec<String>,
    pub forbidden_paths: Vec<String>,
    pub max_actions_per_hour: u32,
    pub auto_approve: Vec<String>,
    pub max_cost_per_day_cents: u32,
    pub require_approval_for_medium_risk: bool,
    pub block_high_risk_commands: bool,
    pub shell_env_passthrough: Vec<String>,
    pub always_ask: Vec<String>,
    pub allowed_roots: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsMemory {
    pub backend: String,
    pub auto_save: bool,
    pub hygiene_enabled: bool,
    pub archive_after_days: u32,
    pub purge_after_days: u32,
    pub embedding_provider: String,
    pub embedding_model: String,
    pub response_cache_enabled: bool,
    pub snapshot_enabled: bool,
    pub conversation_retention_days: u32,
    pub embedding_dimensions: u32,
    pub vector_weight: f64,
    pub keyword_weight: f64,
    pub min_relevance_score: f64,
    pub embedding_cache_size: usize,
    pub chunk_max_tokens: usize,
    pub response_cache_ttl_minutes: u32,
    pub response_cache_max_entries: usize,
    pub snapshot_on_hygiene: bool,
    pub auto_hydrate: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsNetwork {
    pub proxy_enabled: bool,
    pub http_proxy: Option<String>,
    pub https_proxy: Option<String>,
    pub no_proxy: Vec<String>,
    pub http_timeout_secs: u64,
    pub http_max_retries: u32,
    pub all_proxy: Option<String>,
    pub proxy_scope: String,
    pub proxy_services: Vec<String>,
    pub provider_backoff_ms: u64,
    pub fallback_providers: Vec<String>,
    pub model_fallbacks: HashMap<String, Vec<String>>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsSecurity {
    pub sandbox_enabled: bool,
    pub sandbox_backend: String,
    pub audit_enabled: bool,
    pub audit_log_path: String,
    pub estop_enabled: bool,
    pub max_memory_mb: u32,
    pub max_cpu_time_seconds: u64,
    pub max_subprocesses: u32,
    pub memory_monitoring: bool,
    pub audit_max_size_mb: u32,
    pub audit_sign_events: bool,
    pub estop_state_file: String,
    pub estop_require_otp_to_resume: bool,
    pub otp_enabled: bool,
    pub otp_method: String,
    pub otp_token_ttl_secs: u64,
    pub otp_gated_actions: Vec<String>,
    pub otp_gated_domains: Vec<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsCost {
    pub enabled: bool,
    pub daily_limit_usd: f64,
    pub monthly_limit_usd: f64,
    pub warn_at_percent: u8,
    pub allow_override: bool,
}

// ─── New Phase 3 bridge structs ─────────────────────────────────────────

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsWebSearch {
    pub enabled: bool,
    pub provider: String,
    pub api_key: String,
    pub max_results: usize,
    pub timeout_secs: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsBrowser {
    pub enabled: bool,
    pub backend: String,
    pub webdriver_url: String,
    pub chrome_path: String,
    pub headless: bool,
    pub page_timeout_secs: u64,
    pub computer_use_enabled: bool,
    pub computer_use_sidecar_port: u16,
    pub computer_use_display: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsHttpRequest {
    pub enabled: bool,
    pub allowed_domains: Vec<String>,
    pub max_response_bytes: u64,
    pub timeout_secs: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsComposio {
    pub enabled: bool,
    pub api_key: String,
    pub entity_id: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsRuntime {
    pub kind: String,
    pub docker_image: String,
    pub docker_network: String,
    pub docker_memory_mb: u32,
    pub docker_cpu_limit: f64,
    pub docker_readonly_fs: bool,
    pub docker_workspace_mount: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsScheduler {
    pub enabled: bool,
    pub max_tasks: usize,
    pub max_concurrent: usize,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsHeartbeat {
    pub enabled: bool,
    pub interval_secs: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsMultimodal {
    pub enabled: bool,
    pub max_images: usize,
    pub max_image_size_mb: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsTranscription {
    pub enabled: bool,
    pub provider: String,
    pub model: String,
    pub language: String,
    pub max_duration_secs: u64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsHardware {
    pub enabled: bool,
    pub transport: String,
    pub serial_port: String,
    pub baud_rate: u32,
    pub probe_target: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsHooks {
    pub enabled: bool,
    pub command_logger: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsGateway {
    pub enabled: bool,
    pub host: String,
    pub port: u16,
    pub require_pairing: bool,
    pub rate_limit_rpm: u32,
    pub rate_limit_burst: u32,
    pub idempotency_enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsTunnel {
    pub provider: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsIdentity {
    pub format: String,
    pub aieos_path: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsSecrets {
    pub encryption_enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsObservability {
    pub backend: String,
    pub otlp_endpoint: String,
    pub log_level: String,
    pub trace_storage: String,
    pub metrics_enabled: bool,
    pub trace_enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsStorage {
    pub provider: String,
    pub db_url: String,
    pub pool_size: u32,
    pub migrate_on_start: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsModelRoute {
    pub hint: String,
    pub provider: String,
    pub model: String,
    pub api_key: String,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsEmbeddingRoute {
    pub hint: String,
    pub provider: String,
    pub model: String,
    pub dimensions: u32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsDelegateAgent {
    pub name: String,
    pub provider: String,
    pub model: String,
    pub system_prompt: String,
    pub temperature: f64,
    pub max_depth: usize,
    pub agentic: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsModelPricing {
    pub model: String,
    pub input_price_per_1m: f64,
    pub output_price_per_1m: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
pub struct EngineSettingsQueryClassification {
    pub enabled: bool,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EngineSettingsAll {
    pub agent: EngineSettingsAgent,
    pub autonomy: EngineSettingsAutonomy,
    pub memory: EngineSettingsMemory,
    pub network: EngineSettingsNetwork,
    pub security: EngineSettingsSecurity,
    pub cost: EngineSettingsCost,
    pub web_search: EngineSettingsWebSearch,
    pub browser: EngineSettingsBrowser,
    pub http_request: EngineSettingsHttpRequest,
    pub composio: EngineSettingsComposio,
    pub runtime: EngineSettingsRuntime,
    pub scheduler: EngineSettingsScheduler,
    pub heartbeat: EngineSettingsHeartbeat,
    pub multimodal: EngineSettingsMultimodal,
    pub transcription: EngineSettingsTranscription,
    pub hardware: EngineSettingsHardware,
    pub hooks: EngineSettingsHooks,
    pub gateway: EngineSettingsGateway,
    pub tunnel: EngineSettingsTunnel,
    pub identity: EngineSettingsIdentity,
    pub secrets: EngineSettingsSecrets,
    pub observability: EngineSettingsObservability,
    pub storage: EngineSettingsStorage,
    pub model_routes: Vec<EngineSettingsModelRoute>,
    pub embedding_routes: Vec<EngineSettingsEmbeddingRoute>,
    pub query_classification: EngineSettingsQueryClassification,
    pub delegate_agents: Vec<EngineSettingsDelegateAgent>,
    pub model_pricing: Vec<EngineSettingsModelPricing>,
}

pub struct DaemonState {
    pub is_running: bool,
    pub active_providers: Vec<String>,
    pub zeroclaw_config: Option<Config>,
}

#[derive(Clone)]
pub struct AuthManager {
    pub pending: Arc<Mutex<HashMap<String, oneshot::Sender<bool>>>>,
}

pub struct AppState {
    pub config: Mutex<AppConfig>,
    pub daemon: Mutex<DaemonState>,
    pub agent: Mutex<Option<Agent>>,
    pub auth_manager: AuthManager,
    pub started_at: Instant,
    pub channel_configs: Mutex<HashMap<String, ChannelConfig>>,
    pub log_buffer: Arc<std::sync::Mutex<Vec<LogEntry>>>,
}

/// Channel integration configuration stored locally
#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChannelConfig {
    pub id: String,
    pub name: String,
    pub enabled: bool,
    pub token: String,
    pub webhook_url: String,
}

#[derive(Serialize, Clone, Debug)]
pub struct LogEntry {
    pub timestamp: String,
    pub level: String,
    pub message: String,
}

/// SEC-02: Validate that a resolved path stays within the allowed base directory.
/// Returns the canonicalized path on success, or an error if path traversal is detected.
fn ensure_within(base: &Path, name: &str) -> AppResult<PathBuf> {
    // Reject obvious traversal patterns before touching the filesystem
    if name.contains("..") || name.starts_with('/') || name.starts_with('\\') {
        return Err(AppError::ConfigError("Invalid path: traversal pattern detected".to_string()));
    }
    let target = base.join(name);
    // For paths that don't exist yet, verify the parent resolves within base
    if let Ok(canonical) = target.canonicalize() {
        let canonical_base = base.canonicalize().unwrap_or_else(|_| base.to_path_buf());
        if !canonical.starts_with(&canonical_base) {
            return Err(AppError::ConfigError("Path traversal blocked".to_string()));
        }
        Ok(canonical)
    } else {
        // Target doesn't exist yet (e.g., create_skill) — check parent
        if let Some(parent) = target.parent() {
            if let Ok(canonical_parent) = parent.canonicalize() {
                let canonical_base = base.canonicalize().unwrap_or_else(|_| base.to_path_buf());
                if !canonical_parent.starts_with(&canonical_base) {
                    return Err(AppError::ConfigError("Path traversal blocked".to_string()));
                }
            }
        }
        Ok(target)
    }
}

/// A ZeroClaw Observer that bridges engine events to Tauri IPC.
pub struct TauriObserver {
    app_handle: tauri::AppHandle,
    log_buffer: Arc<std::sync::Mutex<Vec<LogEntry>>>,
}

pub struct TauriAuthorizedTool {
    pub inner: Box<dyn Tool>,
    pub app_handle: tauri::AppHandle,
    pub auth_manager: AuthManager,
}

#[async_trait::async_trait]
impl zeroclaw_engine::tools::Tool for TauriAuthorizedTool {
    fn name(&self) -> &str { self.inner.name() }
    fn description(&self) -> &str { self.inner.description() }
    fn parameters_schema(&self) -> serde_json::Value { self.inner.parameters_schema() }

    async fn execute(&self, mut args: serde_json::Value) -> anyhow::Result<zeroclaw_engine::tools::ToolResult> {
        let is_approved = args.get("approved").and_then(|v| v.as_bool()).unwrap_or(false);

        if !is_approved && self.inner.name() == "shell" {
            let request_id = uuid::Uuid::new_v4().to_string();
            let (tx, rx) = oneshot::channel();

            {
                let mut pending = self.auth_manager.pending.lock().await;
                pending.insert(request_id.clone(), tx);
            }

            // Emit request to frontend
            let _ = self.app_handle.emit("zeroclaw-tool-auth-request", serde_json::json!({
                "id": request_id,
                "tool": self.inner.name(),
                "arguments": args,
            }));

            // Wait for user or timeout (30s)
            tokio::select! {
                res = rx => {
                    match res {
                        Ok(true) => {
                            if let Some(obj) = args.as_object_mut() {
                                obj.insert("approved".to_string(), serde_json::Value::Bool(true));
                            }
                        }
                        _ => return Ok(zeroclaw_engine::tools::ToolResult {
                            success: false,
                            output: String::new(),
                            error: Some("User denied tool execution.".to_string())
                        }),
                    }
                }
                _ = tokio::time::sleep(std::time::Duration::from_secs(30)) => {
                    let mut pending = self.auth_manager.pending.lock().await;
                    pending.remove(&request_id);
                    return Ok(zeroclaw_engine::tools::ToolResult {
                        success: false,
                        output: String::new(),
                        error: Some("Authorization timeout.".to_string())
                    });
                }
            }
        }

        self.inner.execute(args).await
    }
}

impl TauriObserver {
    pub fn new(app_handle: tauri::AppHandle, log_buffer: Arc<std::sync::Mutex<Vec<LogEntry>>>) -> Self {
        Self { app_handle, log_buffer }
    }

    fn push_log(&self, level: &str, msg: &str) {
        let entry = LogEntry {
            timestamp: chrono::Local::now().format("%H:%M:%S%.3f").to_string(),
            level: level.to_string(),
            message: msg.to_string(),
        };
        let _ = self.app_handle.emit("zeroclaw-log", &entry);
        if let Ok(mut buf) = self.log_buffer.lock() {
            buf.push(entry);
            if buf.len() > 200 {
                let excess = buf.len() - 200;
                buf.drain(0..excess);
            }
        }
    }
}

impl zeroclaw_engine::observability::Observer for TauriObserver {
    fn record_event(&self, event: &zeroclaw_engine::observability::ObserverEvent) {
        match event {
            zeroclaw_engine::observability::ObserverEvent::TextDelta { delta } => {
                let _ = self.app_handle.emit("zeroclaw-delta", delta);
            }
            zeroclaw_engine::observability::ObserverEvent::AgentStart { provider, model } => {
                let _ = self.app_handle.emit("zeroclaw-status", format!("Agent starting with {} ({})", provider, model));
                self.push_log("info", &format!("Agent starting with {} ({})", provider, model));
            }
            zeroclaw_engine::observability::ObserverEvent::ToolCallStart { tool, arguments } => {
                let _ = self.app_handle.emit("zeroclaw-tool-start", serde_json::json!({
                    "tool": tool,
                    "arguments": arguments,
                }));
                self.push_log("debug", &format!("Tool call: {} started", tool));
            }
            zeroclaw_engine::observability::ObserverEvent::ToolCall { tool, duration, success, output } => {
                let _ = self.app_handle.emit("zeroclaw-tool-result", serde_json::json!({
                    "tool": tool,
                    "duration_ms": duration.as_millis(),
                    "success": success,
                    "output": output,
                }));
                let status = if *success { "success" } else { "error" };
                self.push_log(status, &format!("Tool {} finished in {}ms", tool, duration.as_millis()));
            }
            _ => {}
        }
    }

    fn record_metric(&self, _metric: &ObserverMetric) {}

    fn name(&self) -> &str {
        "tauri"
    }

    fn as_any(&self) -> &dyn std::any::Any {
        self
    }
}

// ─── CHAOS-11 / Frontend hydration: get_config ─────────────────────────────

#[derive(Serialize)]
struct GetConfigResponse {
    configured: bool,
    provider_id: Option<String>,
    model: Option<String>,
}

#[tauri::command]
async fn get_config(state: tauri::State<'_, AppState>) -> AppResult<GetConfigResponse> {
    let st = state.config.lock().await;
    // Check if any provider has a stored key in the OS keyring
    let providers = ["openai", "anthropic", "groq", "ollama", "custom"];
    let mut found_provider: Option<String> = None;

    for pid in providers {
        if let Ok(entry) = Entry::new("pocketclaw_zero_engine", &format!("api_key_{}", pid)) {
            if entry.get_password().is_ok() {
                found_provider = Some(pid.to_string());
                break;
            }
        }
    }

    let configured = found_provider.is_some() || st.provider_id == "ollama";

    Ok(GetConfigResponse {
        configured,
        provider_id: found_provider.or_else(|| {
            if st.provider_id.is_empty() { None } else { Some(st.provider_id.clone()) }
        }),
        model: if st.model_name.is_empty() { None } else { Some(st.model_name.clone()) },
    })
}

// ─── Config persistence ────────────────────────────────────────────────────

#[tauri::command]
async fn save_config(state: tauri::State<'_, AppState>, provider_id: String, api_key: String, api_url: Option<String>) -> AppResult<()> {
    let mut st = state.config.lock().await;
    st.provider_id = provider_id.clone();
    st.api_key = "SECURE_VAULT".to_string(); // Never keep real key in memory struct
    st.api_url = api_url;

    // Persist the real secret to OS Keyring
    let entry = Entry::new("pocketclaw_zero_engine", &format!("api_key_{}", provider_id))
        .map_err(|e| AppError::ConfigError(format!("Keyring init error: {}", e)))?;

    entry.set_password(&api_key)
        .map_err(|e| AppError::ConfigError(format!("Failed to securely store key: {}", e)))?;

    // If custom API URL provided, persist it too
    if let Some(ref url) = st.api_url {
        let url_entry = Entry::new("pocketclaw_zero_engine", &format!("api_url_{}", provider_id))
            .map_err(|e| AppError::ConfigError(format!("Keyring init error: {}", e)))?;
        url_entry.set_password(url)
            .map_err(|e| AppError::ConfigError(format!("Failed to store API URL: {}", e)))?;
    }

    // Force agent re-init on next message to pick up new config
    let mut agent = state.agent.lock().await;
    *agent = None;

    println!("[SECURITY] API Key for {} written to OS Secure Enclave.", provider_id);
    Ok(())
}

// SEC-05: load_config no longer returns the actual API key to the frontend
#[tauri::command]
async fn load_config(state: tauri::State<'_, AppState>, provider_id: String) -> AppResult<String> {
    let st = state.config.lock().await;

    let entry = Entry::new("pocketclaw_zero_engine", &format!("api_key_{}", provider_id))
        .map_err(|e| AppError::ConfigError(format!("Keyring init error: {}", e)))?;

    let has_key = entry.get_password().is_ok();

    // Load stored API URL if any
    let api_url = Entry::new("pocketclaw_zero_engine", &format!("api_url_{}", provider_id))
        .ok()
        .and_then(|e| e.get_password().ok());

    // Return config metadata only — never the actual API key
    let response = serde_json::json!({
        "provider_id": st.provider_id,
        "model_name": st.model_name,
        "has_api_key": has_key,
        "api_url": api_url,
        "temperature": st.temperature,
    });

    Ok(response.to_string())
}

#[tauri::command]
async fn authorize_tool(state: tauri::State<'_, AppState>, id: String, approved: bool) -> AppResult<()> {
    let mut pending = state.auth_manager.pending.lock().await;
    if let Some(tx) = pending.remove(&id) {
        let _ = tx.send(approved);
    }
    Ok(())
}

// ─── Workspace / File operations ───────────────────────────────────────────

#[derive(Serialize)]
pub struct FileInfo {
    pub name: String,
    pub is_dir: bool,
    pub size: u64,
}

#[tauri::command]
async fn list_workspace_files(state: tauri::State<'_, AppState>) -> AppResult<Vec<FileInfo>> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;

    let workspace = &config.workspace_dir;
    if !workspace.exists() {
        return Ok(Vec::new());
    }

    let mut files = Vec::new();
    if let Ok(entries) = std::fs::read_dir(workspace) {
        for entry in entries.flatten() {
            if let Ok(meta) = entry.metadata() {
                files.push(FileInfo {
                    name: entry.file_name().to_string_lossy().to_string(),
                    is_dir: meta.is_dir(),
                    size: meta.len(),
                });
            }
        }
    }

    files.sort_by(|a, b| {
        if a.is_dir != b.is_dir {
            b.is_dir.cmp(&a.is_dir)
        } else {
            a.name.cmp(&b.name)
        }
    });

    Ok(files)
}

// XPLAT-04: sanitize file:// URL prefix from file paths
fn sanitize_file_path(file_path: &str) -> String {
    if let Some(stripped) = file_path.strip_prefix("file:///") {
        // On Windows: file:///C:/Users/... → C:/Users/...
        // On Unix: file:///home/... → /home/...
        #[cfg(target_os = "windows")]
        { return stripped.to_string(); }
        #[cfg(not(target_os = "windows"))]
        { return format!("/{}", stripped); }
    }
    if let Some(stripped) = file_path.strip_prefix("file://") {
        return stripped.to_string();
    }
    file_path.to_string()
}

#[tauri::command]
async fn process_document(state: tauri::State<'_, AppState>, file_path: String) -> AppResult<String> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;

    // XPLAT-04: Clean potential file:// URL prefix
    let clean_path = sanitize_file_path(&file_path);
    let source = Path::new(&clean_path);
    if !source.exists() {
        return Err(AppError::ConfigError(format!("File not found: {}", clean_path)));
    }

    let filename = source.file_name().ok_or_else(|| AppError::ConfigError("Invalid filename".to_string()))?;
    let dest = config.workspace_dir.join(filename);

    std::fs::create_dir_all(&config.workspace_dir)?;
    std::fs::copy(source, &dest).map_err(|e| AppError::ConfigError(format!("Failed to copy file to workspace: {}", e)))?;

    Ok(format!("Successfully ingested {} into ZeroClaw local workspace. AI now has direct access.", filename.to_string_lossy()))
}

// SEC-02: Path traversal guard on delete_file
#[tauri::command]
async fn delete_file(state: tauri::State<'_, AppState>, name: String) -> AppResult<()> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;

    let path = ensure_within(&config.workspace_dir, &name)?;
    if path.exists() {
        if path.is_dir() {
            std::fs::remove_dir_all(path)?;
        } else {
            std::fs::remove_file(path)?;
        }
    }
    Ok(())
}

// ─── Memory operations ─────────────────────────────────────────────────────
// BUILD-01: Now that AppError implements From<anyhow::Error>, we can use ? directly

#[tauri::command]
async fn list_memories(state: tauri::State<'_, AppState>) -> AppResult<Vec<MemoryEntry>> {
    let agent_guard = state.agent.lock().await;
    let agent = agent_guard.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let mem = agent.memory();
    Ok(mem.list(None, None).await?)
}

#[tauri::command]
async fn store_memory(
    state: tauri::State<'_, AppState>,
    key: String,
    content: String,
    category: String,
) -> AppResult<()> {
    let agent_guard = state.agent.lock().await;
    let agent = agent_guard.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let mem = agent.memory();

    let cat = match category.as_str() {
        "core" => MemoryCategory::Core,
        "daily" => MemoryCategory::Daily,
        "conversation" => MemoryCategory::Conversation,
        _ => MemoryCategory::Custom(category),
    };

    mem.store(&key, &content, cat, None).await?;
    Ok(())
}

#[tauri::command]
async fn forget_memory(state: tauri::State<'_, AppState>, key: String) -> AppResult<bool> {
    let agent_guard = state.agent.lock().await;
    let agent = agent_guard.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let mem = agent.memory();
    Ok(mem.forget(&key).await?)
}

#[tauri::command]
async fn search_memories(state: tauri::State<'_, AppState>, query: String, limit: usize) -> AppResult<Vec<MemoryEntry>> {
    let agent_guard = state.agent.lock().await;
    let agent = agent_guard.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let mem = agent.memory();
    Ok(mem.recall(&query, limit, None).await?)
}

// ─── Skills operations ─────────────────────────────────────────────────────

#[tauri::command]
async fn list_skills(state: tauri::State<'_, AppState>) -> AppResult<Vec<Skill>> {
    let daemon = state.daemon.lock().await;
    let config = daemon.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    Ok(zeroclaw_engine::skills::load_skills_with_config(&config.workspace_dir, config))
}

// SEC-03: Validate URL scheme before git clone
#[tauri::command]
async fn install_skill(state: tauri::State<'_, AppState>, source: String) -> AppResult<()> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let skills_dir = config.workspace_dir.join("skills");
    std::fs::create_dir_all(&skills_dir)?;

    if source.starts_with("https://") {
        let name = source.split('/').last().unwrap_or("skill").replace(".git", "");
        // SEC-02: Validate name doesn't escape skills_dir
        let dest = ensure_within(&skills_dir, &name)?;

        if dest.exists() {
            return Err(AppError::ConfigError("Skill already exists".to_string()));
        }

        let output = std::process::Command::new("git")
            .args(["clone", "--depth", "1", "--config", "core.hooksPath=/dev/null", &source])
            .arg(&dest)
            .output()
            .map_err(|e| {
                if e.kind() == std::io::ErrorKind::NotFound {
                    AppError::ConfigError("Git is not installed. Please install Git and try again.".to_string())
                } else {
                    AppError::ConfigError(format!("Git clone failed: {}", e))
                }
            })?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            return Err(AppError::ConfigError(format!("Git clone failed: {}", stderr.trim())));
        }

        // Remove git hooks from cloned repo for safety
        let hooks_dir = dest.join(".git").join("hooks");
        if hooks_dir.exists() {
            let _ = std::fs::remove_dir_all(hooks_dir);
        }
    } else if !source.starts_with("http") {
        return Err(AppError::ConfigError("Only HTTPS URLs are supported for skill installation.".to_string()));
    } else {
        return Err(AppError::ConfigError("Insecure HTTP URLs are not allowed. Use HTTPS.".to_string()));
    }

    Ok(())
}

// SEC-02: Path traversal guard on create_skill
#[tauri::command]
async fn create_skill(state: tauri::State<'_, AppState>, name: String, content: String) -> AppResult<()> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let skills_dir = config.workspace_dir.join("skills");
    let _ = ensure_within(&skills_dir, &name)?;
    let path = skills_dir.join(&name).join("SKILL.md");
    let parent = path.parent().ok_or_else(|| AppError::ConfigError("Invalid skill path".to_string()))?;
    std::fs::create_dir_all(parent)?;
    std::fs::write(path, content)?;
    Ok(())
}

// SEC-02: Path traversal guard on uninstall_skill
#[tauri::command]
async fn uninstall_skill(state: tauri::State<'_, AppState>, name: String) -> AppResult<()> {
    let st = state.daemon.lock().await;
    let config = st.zeroclaw_config.as_ref().ok_or_else(|| AppError::ConfigError("Agent not initialized".to_string()))?;
    let skills_dir = config.workspace_dir.join("skills");
    let path = ensure_within(&skills_dir, &name)?;
    if path.exists() {
        std::fs::remove_dir_all(path)?;
    }
    Ok(())
}

// ─── Tool config ───────────────────────────────────────────────────────────

#[tauri::command]
async fn update_tool_config(state: tauri::State<'_, AppState>, tool_id: String, enabled: bool) -> AppResult<()> {
    println!("Updating tool config: {} -> {}", tool_id, enabled);

    let mut st = state.daemon.lock().await;
    if let Some(config) = st.zeroclaw_config.as_mut() {
        match tool_id.as_str() {
            "shell" => {
                // Toggle autonomy level: Full allows shell, ReadOnly disables it
                config.autonomy.level = if enabled {
                    zeroclaw_engine::security::AutonomyLevel::Full
                } else {
                    zeroclaw_engine::security::AutonomyLevel::ReadOnly
                };
            }
            "fs_read" | "fs_write" => {
                let tool_name = if tool_id == "fs_read" { "file_read" } else { "file_write" };
                if enabled {
                    if !config.autonomy.auto_approve.contains(&tool_name.to_string()) {
                        config.autonomy.auto_approve.push(tool_name.to_string());
                    }
                } else {
                    config.autonomy.auto_approve.retain(|t| t != tool_name);
                }
            }
            _ => {}
        }

        println!("[CONFIG] Tool {} is now {}", tool_id, if enabled { "ENABLED" } else { "DISABLED" });

        // Force agent re-init on next message to pick up changes
        let mut agent = state.agent.lock().await;
        *agent = None;
    }

    Ok(())
}

// ─── Agent lifecycle ───────────────────────────────────────────────────────

#[tauri::command]
async fn abort_generation(state: tauri::State<'_, AppState>) -> AppResult<()> {
    println!("[SIGNAL] Aborting current AI generation...");
    // NOTE (SEC-06): Dropping the Agent doesn't cancel in-flight HTTP requests.
    // A proper CancellationToken pattern should be implemented in zeroclaw_engine
    // to allow cooperative cancellation of ongoing provider calls.
    let mut agent = state.agent.lock().await;
    *agent = None;
    Ok(())
}

#[tauri::command]
async fn send_chat_message(
    app_handle: tauri::AppHandle,
    state: tauri::State<'_, AppState>,
    message: String,
    provider_id: String,
    model: String,
) -> AppResult<String> {
    println!("ZeroClaw Engine: Processing message for provider [{}]", provider_id);

    // 1. Check daemon is running
    {
        let daemon = state.daemon.lock().await;
        if !daemon.is_running {
            return Err(AppError::NetworkError("ZeroClaw Daemon is not running.".to_string()));
        }
    }

    // 2. Check/Init Agent
    let mut agent_guard = state.agent.lock().await;

    if agent_guard.is_none() {
        println!("Initializing ZeroClaw Agent with TauriObserver...");

        let entry = Entry::new("pocketclaw_zero_engine", &format!("api_key_{}", provider_id))
            .map_err(|e| AppError::ConfigError(format!("Keyring init error: {}", e)))?;

        let api_key = entry.get_password()
            .map_err(|_| AppError::ConfigError(format!("No API Key found for {}. Please configure it in Providers view.", provider_id)))?;

        let mut config = Config::load_or_init().await
            .unwrap_or_else(|_| Config::default());
        config.api_key = Some(api_key);
        config.default_provider = Some(provider_id.clone());

        // Load custom API URL from Keyring if stored
        let custom_url = Entry::new("pocketclaw_zero_engine", &format!("api_url_{}", provider_id))
            .ok()
            .and_then(|e| e.get_password().ok());
        config.api_url = custom_url;

        // Apply stored temperature from AppConfig (temperature=0 is valid)
        {
            let app_config = state.config.lock().await;
            config.default_temperature = app_config.temperature;
        }

        config.default_model = Some(model.clone());

        let observer = Arc::new(TauriObserver::new(app_handle.clone(), state.log_buffer.clone()));
        let security = Arc::new(zeroclaw_engine::security::SecurityPolicy::from_config(&config.autonomy, &config.workspace_dir));

        let memory: Arc<dyn zeroclaw_engine::memory::Memory> = Arc::from(zeroclaw_engine::memory::create_memory_with_storage_and_routes(
            &config.memory,
            &config.embedding_routes,
            None,
            &config.workspace_dir,
            config.api_key.as_deref()
        ).map_err(|e| AppError::ConfigError(format!("Memory init failed: {}", e)))?);

        let _runtime: Arc<dyn zeroclaw_engine::runtime::RuntimeAdapter> = Arc::from(zeroclaw_engine::runtime::create_runtime(&config.runtime)
            .map_err(|e| AppError::ConfigError(format!("Runtime init failed: {}", e)))?);

        let raw_tools = zeroclaw_engine::tools::all_tools_with_runtime(
            Arc::new(config.clone()),
            &security,
            _runtime,
            memory.clone(),
            None, None, &config.browser, &config.http_request, &config.workspace_dir, &config.agents, config.api_key.as_deref(), &config
        );

        let wrapped_tools: Vec<Box<dyn zeroclaw_engine::tools::Tool>> = raw_tools.into_iter().map(|tool| {
            if tool.name() == "shell" {
                Box::new(TauriAuthorizedTool {
                    inner: tool,
                    app_handle: app_handle.clone(),
                    auth_manager: state.auth_manager.clone(),
                }) as Box<dyn zeroclaw_engine::tools::Tool>
            } else {
                tool
            }
        }).collect();

        let model_name = config.default_model.clone().unwrap_or_else(|| "gpt-3.5-turbo".into());
        let provider = zeroclaw_engine::providers::create_routed_provider(
            &provider_id,
            config.api_key.as_deref(),
            config.api_url.as_deref(),
            &config.reliability,
            &config.model_routes,
            &model_name
        ).map_err(|e| AppError::NetworkError(format!("Provider init failed: {}", e)))?;

        let agent = zeroclaw_engine::agent::Agent::builder()
            .provider(provider)
            .tools(wrapped_tools)
            .observer(observer)
            .memory(memory)
            .model_name(model_name)
            .skills(zeroclaw_engine::skills::load_skills_with_config(&config.workspace_dir, &config))
            .build()
            .map_err(|e| AppError::ConfigError(format!("Failed to build Agent: {}", e)))?;

        *agent_guard = Some(agent);

        // Update daemon state with config
        let mut daemon = state.daemon.lock().await;
        daemon.zeroclaw_config = Some(config);
    }

    // 3. Perform the conversation turn
    let agent = agent_guard.as_mut().unwrap();

    let response: String = match agent.turn(&message).await {
        Ok(res) => res,
        Err(e) => return Err(AppError::NetworkError(format!("ZeroClaw Engine Error: {}", e))),
    };

    Ok(response)
}

// ─── System Metrics ─────────────────────────────────────────────────────

#[derive(Serialize)]
struct SystemMetrics {
    memory_used_mb: f64,
    memory_total_mb: f64,
    cpu_usage: f32,
    uptime_seconds: u64,
    knowledge_units: usize,
    active_skills: usize,
    gateway_status: String,
}

#[tauri::command]
async fn get_system_metrics(state: tauri::State<'_, AppState>) -> AppResult<SystemMetrics> {
    use sysinfo::System;

    let mut sys = System::new();
    sys.refresh_memory();
    sys.refresh_cpu_all();

    // Small delay for CPU to have meaningful readings
    let cpu_usage = sys.global_cpu_usage();

    let uptime = state.started_at.elapsed().as_secs();

    // Count knowledge units from memory
    let knowledge_count = {
        let agent_guard = state.agent.lock().await;
        if let Some(agent) = agent_guard.as_ref() {
            let mem = agent.memory();
            mem.list(None, None).await.map(|v| v.len()).unwrap_or(0)
        } else {
            0
        }
    };

    // Count active skills
    let skill_count = {
        let daemon = state.daemon.lock().await;
        if let Some(config) = daemon.zeroclaw_config.as_ref() {
            zeroclaw_engine::skills::load_skills_with_config(&config.workspace_dir, config).len()
        } else {
            0
        }
    };

    let gateway = {
        let daemon = state.daemon.lock().await;
        if daemon.is_running { "Online".to_string() } else { "Offline".to_string() }
    };

    Ok(SystemMetrics {
        memory_used_mb: sys.used_memory() as f64 / 1024.0 / 1024.0,
        memory_total_mb: sys.total_memory() as f64 / 1024.0 / 1024.0,
        cpu_usage,
        uptime_seconds: uptime,
        knowledge_units: knowledge_count,
        active_skills: skill_count,
        gateway_status: gateway,
    })
}

#[tauri::command]
async fn get_logs(state: tauri::State<'_, AppState>) -> AppResult<Vec<LogEntry>> {
    let buf = state.log_buffer.lock().map_err(|e| AppError::LockError(e.to_string()))?;
    Ok(buf.clone())
}

// ─── Channel configuration ──────────────────────────────────────────────
// FIX 🟡-5: Atomic save — write Keyring first, then update in-memory map

#[tauri::command]
async fn list_channel_configs(state: tauri::State<'_, AppState>) -> AppResult<Vec<ChannelConfig>> {
    let configs = state.channel_configs.lock().await;
    let mut result: Vec<ChannelConfig> = configs.values().cloned().collect();
    // Add has_token indicator: check Keyring for each
    for c in &mut result {
        let has_token = Entry::new("pocketclaw_channels", &format!("token_{}", c.id))
            .ok()
            .and_then(|e| e.get_password().ok())
            .is_some();
        c.token = if has_token { "HAS_TOKEN".to_string() } else { String::new() };
    }
    Ok(result)
}

#[tauri::command]
async fn save_channel_config(state: tauri::State<'_, AppState>, config: ChannelConfig) -> AppResult<()> {
    // FIX 🟡-5: Store token in Keyring FIRST (atomic — if this fails, we don't update state)
    if !config.token.is_empty() && config.token != "HAS_TOKEN" {
        let entry = Entry::new("pocketclaw_channels", &format!("token_{}", config.id))
            .map_err(|e| AppError::ConfigError(format!("Keyring init error: {}", e)))?;
        entry.set_password(&config.token)
            .map_err(|e| AppError::ConfigError(format!("Failed to store channel token: {}", e)))?;
    }

    // Only update in-memory state AFTER Keyring succeeds
    let mut configs = state.channel_configs.lock().await;
    configs.insert(config.id.clone(), ChannelConfig {
        token: String::new(), // Never keep real token in memory
        ..config
    });

    Ok(())
}

#[tauri::command]
async fn delete_channel_config(state: tauri::State<'_, AppState>, id: String) -> AppResult<()> {
    // Try to remove token from keyring
    if let Ok(entry) = Entry::new("pocketclaw_channels", &format!("token_{}", id)) {
        let _ = entry.delete_credential();
    }

    let mut configs = state.channel_configs.lock().await;
    configs.remove(&id);
    Ok(())
}

// ─── Sectioned engine settings ──────────────────────────────────────────

fn parse_sandbox_backend(s: &str) -> zeroclaw_engine::config::schema::SandboxBackend {
    match s {
        "Docker" => zeroclaw_engine::config::schema::SandboxBackend::Docker,
        "Firejail" => zeroclaw_engine::config::schema::SandboxBackend::Firejail,
        "Bubblewrap" => zeroclaw_engine::config::schema::SandboxBackend::Bubblewrap,
        "Landlock" => zeroclaw_engine::config::schema::SandboxBackend::Landlock,
        "None" => zeroclaw_engine::config::schema::SandboxBackend::None,
        _ => zeroclaw_engine::config::schema::SandboxBackend::Auto,
    }
}

/// Mask sensitive values when sending to frontend; returns "***" if non-empty
fn mask_secret(s: &str) -> String {
    if s.is_empty() { String::new() } else { "***".to_string() }
}

/// Returns true if value is the mask sentinel — caller should skip writing
fn is_masked(s: &str) -> bool {
    s == "***"
}

fn config_to_engine_settings(config: &Config) -> EngineSettingsAll {
    EngineSettingsAll {
        agent: EngineSettingsAgent {
            max_tool_iterations: config.agent.max_tool_iterations,
            max_history_messages: config.agent.max_history_messages,
            parallel_tools: config.agent.parallel_tools,
            compact_context: config.agent.compact_context,
            tool_dispatcher: config.agent.tool_dispatcher.clone(),
        },
        autonomy: EngineSettingsAutonomy {
            level: format!("{:?}", config.autonomy.level),
            workspace_only: config.autonomy.workspace_only,
            allowed_commands: config.autonomy.allowed_commands.clone(),
            forbidden_paths: config.autonomy.forbidden_paths.clone(),
            max_actions_per_hour: config.autonomy.max_actions_per_hour,
            auto_approve: config.autonomy.auto_approve.clone(),
            max_cost_per_day_cents: config.autonomy.max_cost_per_day_cents,
            require_approval_for_medium_risk: config.autonomy.require_approval_for_medium_risk,
            block_high_risk_commands: config.autonomy.block_high_risk_commands,
            shell_env_passthrough: config.autonomy.shell_env_passthrough.clone(),
            always_ask: config.autonomy.always_ask.clone(),
            allowed_roots: config.autonomy.allowed_roots.clone(),
        },
        memory: EngineSettingsMemory {
            backend: config.memory.backend.clone(),
            auto_save: config.memory.auto_save,
            hygiene_enabled: config.memory.hygiene_enabled,
            archive_after_days: config.memory.archive_after_days,
            purge_after_days: config.memory.purge_after_days,
            embedding_provider: config.memory.embedding_provider.clone(),
            embedding_model: config.memory.embedding_model.clone(),
            response_cache_enabled: config.memory.response_cache_enabled,
            snapshot_enabled: config.memory.snapshot_enabled,
            conversation_retention_days: config.memory.conversation_retention_days,
            embedding_dimensions: config.memory.embedding_dimensions as u32,
            vector_weight: config.memory.vector_weight,
            keyword_weight: config.memory.keyword_weight,
            min_relevance_score: config.memory.min_relevance_score,
            embedding_cache_size: config.memory.embedding_cache_size,
            chunk_max_tokens: config.memory.chunk_max_tokens,
            response_cache_ttl_minutes: config.memory.response_cache_ttl_minutes,
            response_cache_max_entries: config.memory.response_cache_max_entries,
            snapshot_on_hygiene: config.memory.snapshot_on_hygiene,
            auto_hydrate: config.memory.auto_hydrate,
        },
        network: EngineSettingsNetwork {
            proxy_enabled: config.proxy.enabled,
            http_proxy: config.proxy.http_proxy.clone(),
            https_proxy: config.proxy.https_proxy.clone(),
            no_proxy: config.proxy.no_proxy.clone(),
            http_timeout_secs: config.http_request.timeout_secs,
            http_max_retries: config.reliability.provider_retries,
            all_proxy: config.proxy.all_proxy.clone(),
            proxy_scope: format!("{:?}", config.proxy.scope),
            proxy_services: config.proxy.services.clone(),
            provider_backoff_ms: config.reliability.provider_backoff_ms,
            fallback_providers: config.reliability.fallback_providers.clone(),
            model_fallbacks: config.reliability.model_fallbacks.clone(),
        },
        security: EngineSettingsSecurity {
            sandbox_enabled: config.security.sandbox.enabled.unwrap_or(false),
            sandbox_backend: format!("{:?}", config.security.sandbox.backend),
            audit_enabled: config.security.audit.enabled,
            audit_log_path: config.security.audit.log_path.clone(),
            estop_enabled: config.security.estop.enabled,
            max_memory_mb: config.security.resources.max_memory_mb,
            max_cpu_time_seconds: config.security.resources.max_cpu_time_seconds,
            max_subprocesses: config.security.resources.max_subprocesses,
            memory_monitoring: config.security.resources.memory_monitoring,
            audit_max_size_mb: config.security.audit.max_size_mb,
            audit_sign_events: config.security.audit.sign_events,
            estop_state_file: config.security.estop.state_file.clone(),
            estop_require_otp_to_resume: config.security.estop.require_otp_to_resume,
            otp_enabled: config.security.otp.enabled,
            otp_method: format!("{:?}", config.security.otp.method).to_lowercase(),
            otp_token_ttl_secs: config.security.otp.token_ttl_secs,
            otp_gated_actions: config.security.otp.gated_actions.clone(),
            otp_gated_domains: config.security.otp.gated_domains.clone(),
        },
        cost: EngineSettingsCost {
            enabled: config.cost.enabled,
            daily_limit_usd: config.cost.daily_limit_usd,
            monthly_limit_usd: config.cost.monthly_limit_usd,
            warn_at_percent: config.cost.warn_at_percent,
            allow_override: config.cost.allow_override,
        },
        web_search: EngineSettingsWebSearch {
            enabled: config.web_search.enabled,
            provider: config.web_search.provider.clone(),
            api_key: mask_secret(&config.web_search.brave_api_key.clone().unwrap_or_default()),
            max_results: config.web_search.max_results,
            timeout_secs: config.web_search.timeout_secs,
        },
        browser: EngineSettingsBrowser {
            enabled: config.browser.enabled,
            backend: format!("{:?}", config.browser.backend),
            webdriver_url: config.browser.native_webdriver_url.clone(),
            chrome_path: config.browser.native_chrome_path.clone().unwrap_or_default(),
            headless: config.browser.native_headless,
            page_timeout_secs: 30, // no direct schema field; use sensible default
            computer_use_enabled: !config.browser.computer_use.endpoint.is_empty(),
            computer_use_sidecar_port: 0, // no direct schema field
            computer_use_display: config.browser.computer_use.endpoint.clone(),
        },
        http_request: EngineSettingsHttpRequest {
            enabled: config.http_request.enabled,
            allowed_domains: config.http_request.allowed_domains.clone(),
            max_response_bytes: config.http_request.max_response_size as u64,
            timeout_secs: config.http_request.timeout_secs,
        },
        composio: EngineSettingsComposio {
            enabled: config.composio.enabled,
            api_key: mask_secret(&config.composio.api_key.clone().unwrap_or_default()),
            entity_id: config.composio.entity_id.clone(),
        },
        runtime: EngineSettingsRuntime {
            kind: format!("{:?}", config.runtime.kind),
            docker_image: config.runtime.docker.image.clone(),
            docker_network: config.runtime.docker.network.clone(),
            docker_memory_mb: config.runtime.docker.memory_limit_mb.unwrap_or(512) as u32,
            docker_cpu_limit: config.runtime.docker.cpu_limit.unwrap_or(1.0),
            docker_readonly_fs: config.runtime.docker.read_only_rootfs,
            docker_workspace_mount: if config.runtime.docker.mount_workspace { "true".to_string() } else { "false".to_string() },
        },
        scheduler: EngineSettingsScheduler {
            enabled: config.scheduler.enabled,
            max_tasks: config.scheduler.max_tasks,
            max_concurrent: config.scheduler.max_concurrent,
        },
        heartbeat: EngineSettingsHeartbeat {
            enabled: config.heartbeat.enabled,
            interval_secs: (config.heartbeat.interval_minutes as u64) * 60,
        },
        multimodal: EngineSettingsMultimodal {
            enabled: true, // no enabled field in schema; always available
            max_images: config.multimodal.max_images,
            max_image_size_mb: config.multimodal.max_image_size_mb as u32,
        },
        transcription: EngineSettingsTranscription {
            enabled: config.transcription.enabled,
            provider: config.transcription.api_url.clone(),
            model: config.transcription.model.clone(),
            language: config.transcription.language.clone().unwrap_or_default(),
            max_duration_secs: config.transcription.max_duration_secs,
        },
        hardware: EngineSettingsHardware {
            enabled: config.hardware.enabled,
            transport: format!("{:?}", config.hardware.transport),
            serial_port: config.hardware.serial_port.clone().unwrap_or_default(),
            baud_rate: config.hardware.baud_rate,
            probe_target: config.hardware.probe_target.clone().unwrap_or_default(),
        },
        hooks: EngineSettingsHooks {
            enabled: config.hooks.enabled,
            command_logger: config.hooks.builtin.command_logger,
        },
        gateway: EngineSettingsGateway {
            enabled: true, // no enabled field; gateway is always available
            host: config.gateway.host.clone(),
            port: config.gateway.port,
            require_pairing: config.gateway.require_pairing,
            rate_limit_rpm: config.gateway.webhook_rate_limit_per_minute,
            rate_limit_burst: config.gateway.rate_limit_max_keys as u32,
            idempotency_enabled: config.gateway.idempotency_ttl_secs > 0,
        },
        tunnel: EngineSettingsTunnel {
            provider: format!("{:?}", config.tunnel.provider),
        },
        identity: EngineSettingsIdentity {
            format: config.identity.format.clone(),
            aieos_path: config.identity.aieos_path.clone().unwrap_or_default(),
        },
        secrets: EngineSettingsSecrets {
            encryption_enabled: config.secrets.encrypt,
        },
        observability: EngineSettingsObservability {
            backend: format!("{:?}", config.observability.backend),
            otlp_endpoint: config.observability.otel_endpoint.clone().unwrap_or_default(),
            log_level: String::new(), // no direct field; managed via env
            trace_storage: format!("{:?}", config.observability.runtime_trace_mode),
            metrics_enabled: true, // no direct field
            trace_enabled: true,   // no direct field
        },
        storage: EngineSettingsStorage {
            provider: format!("{:?}", config.storage.provider),
            db_url: String::new(), // complex nested; masked
            pool_size: 0,          // no direct field
            migrate_on_start: true, // no direct field
        },
        model_routes: config.model_routes.iter().map(|r| EngineSettingsModelRoute {
            hint: r.hint.clone(),
            provider: r.provider.clone(),
            model: r.model.clone(),
            api_key: mask_secret(&r.api_key.clone().unwrap_or_default()),
        }).collect(),
        embedding_routes: config.embedding_routes.iter().map(|r| EngineSettingsEmbeddingRoute {
            hint: r.hint.clone(),
            provider: r.provider.clone(),
            model: r.model.clone(),
            dimensions: r.dimensions.unwrap_or(0) as u32,
        }).collect(),
        query_classification: EngineSettingsQueryClassification {
            enabled: config.query_classification.enabled,
        },
        delegate_agents: config.agents.iter().map(|(name, agent)| {
            EngineSettingsDelegateAgent {
                name: name.clone(),
                provider: agent.provider.clone(),
                model: agent.model.clone(),
                system_prompt: agent.system_prompt.clone().unwrap_or_default(),
                temperature: agent.temperature.unwrap_or(0.7),
                max_depth: agent.max_depth as usize,
                agentic: agent.agentic,
            }
        }).collect(),
        model_pricing: config.cost.prices.iter().map(|(model, pricing)| {
            EngineSettingsModelPricing {
                model: model.clone(),
                input_price_per_1m: pricing.input,
                output_price_per_1m: pricing.output,
            }
        }).collect(),
    }
}

#[tauri::command]
async fn get_engine_settings(state: tauri::State<'_, AppState>) -> AppResult<EngineSettingsAll> {
    let daemon = state.daemon.lock().await;
    if let Some(config) = daemon.zeroclaw_config.as_ref() {
        Ok(config_to_engine_settings(config))
    } else {
        let config = Config::default();
        Ok(config_to_engine_settings(&config))
    }
}

#[tauri::command]
async fn save_engine_settings(state: tauri::State<'_, AppState>, settings: EngineSettingsAll) -> AppResult<()> {
    let mut daemon = state.daemon.lock().await;
    if daemon.zeroclaw_config.is_none() {
        // Initialize config so settings can be saved before first message
        daemon.zeroclaw_config = Some(Config::default());
    }
    let config = daemon.zeroclaw_config.as_mut().unwrap();
        // Apply agent settings
        config.agent.max_tool_iterations = settings.agent.max_tool_iterations;
        config.agent.max_history_messages = settings.agent.max_history_messages;
        config.agent.parallel_tools = settings.agent.parallel_tools;
        config.agent.compact_context = settings.agent.compact_context;
        config.agent.tool_dispatcher = settings.agent.tool_dispatcher;

        // Apply autonomy settings
        config.autonomy.level = match settings.autonomy.level.as_str() {
            "Full" => zeroclaw_engine::security::AutonomyLevel::Full,
            "ReadOnly" => zeroclaw_engine::security::AutonomyLevel::ReadOnly,
            _ => zeroclaw_engine::security::AutonomyLevel::Supervised,
        };
        config.autonomy.workspace_only = settings.autonomy.workspace_only;
        config.autonomy.allowed_commands = settings.autonomy.allowed_commands;
        config.autonomy.forbidden_paths = settings.autonomy.forbidden_paths;
        config.autonomy.max_actions_per_hour = settings.autonomy.max_actions_per_hour;
        config.autonomy.auto_approve = settings.autonomy.auto_approve;
        config.autonomy.max_cost_per_day_cents = settings.autonomy.max_cost_per_day_cents;
        config.autonomy.require_approval_for_medium_risk = settings.autonomy.require_approval_for_medium_risk;
        config.autonomy.block_high_risk_commands = settings.autonomy.block_high_risk_commands;
        config.autonomy.shell_env_passthrough = settings.autonomy.shell_env_passthrough;
        config.autonomy.always_ask = settings.autonomy.always_ask;
        config.autonomy.allowed_roots = settings.autonomy.allowed_roots;

        // Apply memory settings
        config.memory.backend = settings.memory.backend;
        config.memory.auto_save = settings.memory.auto_save;
        config.memory.hygiene_enabled = settings.memory.hygiene_enabled;
        config.memory.archive_after_days = settings.memory.archive_after_days;
        config.memory.purge_after_days = settings.memory.purge_after_days;
        config.memory.embedding_provider = settings.memory.embedding_provider;
        config.memory.embedding_model = settings.memory.embedding_model;
        config.memory.response_cache_enabled = settings.memory.response_cache_enabled;
        config.memory.snapshot_enabled = settings.memory.snapshot_enabled;
        config.memory.conversation_retention_days = settings.memory.conversation_retention_days;
        config.memory.embedding_dimensions = settings.memory.embedding_dimensions as usize;
        config.memory.vector_weight = settings.memory.vector_weight;
        config.memory.keyword_weight = settings.memory.keyword_weight;
        config.memory.min_relevance_score = settings.memory.min_relevance_score;
        config.memory.embedding_cache_size = settings.memory.embedding_cache_size;
        config.memory.chunk_max_tokens = settings.memory.chunk_max_tokens;
        config.memory.response_cache_ttl_minutes = settings.memory.response_cache_ttl_minutes;
        config.memory.response_cache_max_entries = settings.memory.response_cache_max_entries;
        config.memory.snapshot_on_hygiene = settings.memory.snapshot_on_hygiene;
        config.memory.auto_hydrate = settings.memory.auto_hydrate;

        // Apply network settings
        config.proxy.enabled = settings.network.proxy_enabled;
        config.proxy.http_proxy = settings.network.http_proxy;
        config.proxy.https_proxy = settings.network.https_proxy;
        config.proxy.no_proxy = settings.network.no_proxy;
        config.http_request.timeout_secs = settings.network.http_timeout_secs;
        config.reliability.provider_retries = settings.network.http_max_retries;
        config.proxy.all_proxy = settings.network.all_proxy;
        config.proxy.services = settings.network.proxy_services;
        config.reliability.provider_backoff_ms = settings.network.provider_backoff_ms;
        config.reliability.fallback_providers = settings.network.fallback_providers;
        config.reliability.model_fallbacks = settings.network.model_fallbacks;

        // Apply security settings
        config.security.sandbox.enabled = Some(settings.security.sandbox_enabled);
        config.security.sandbox.backend = parse_sandbox_backend(&settings.security.sandbox_backend);
        config.security.audit.enabled = settings.security.audit_enabled;
        config.security.audit.log_path = settings.security.audit_log_path;
        config.security.estop.enabled = settings.security.estop_enabled;
        config.security.resources.max_memory_mb = settings.security.max_memory_mb;
        config.security.resources.max_cpu_time_seconds = settings.security.max_cpu_time_seconds;
        config.security.resources.max_subprocesses = settings.security.max_subprocesses;
        config.security.resources.memory_monitoring = settings.security.memory_monitoring;
        config.security.audit.max_size_mb = settings.security.audit_max_size_mb;
        config.security.audit.sign_events = settings.security.audit_sign_events;
        config.security.estop.state_file = settings.security.estop_state_file;
        config.security.estop.require_otp_to_resume = settings.security.estop_require_otp_to_resume;
        config.security.otp.enabled = settings.security.otp_enabled;
        config.security.otp.method = zeroclaw_engine::config::schema::OtpMethod::Totp;
        config.security.otp.token_ttl_secs = settings.security.otp_token_ttl_secs;
        config.security.otp.gated_actions = settings.security.otp_gated_actions;
        config.security.otp.gated_domains = settings.security.otp_gated_domains;

        // Apply cost settings
        config.cost.enabled = settings.cost.enabled;
        config.cost.daily_limit_usd = settings.cost.daily_limit_usd;
        config.cost.monthly_limit_usd = settings.cost.monthly_limit_usd;
        config.cost.warn_at_percent = settings.cost.warn_at_percent;
        config.cost.allow_override = settings.cost.allow_override;

        // Apply web_search settings
        config.web_search.enabled = settings.web_search.enabled;
        config.web_search.provider = settings.web_search.provider;
        if !is_masked(&settings.web_search.api_key) {
            config.web_search.brave_api_key = if settings.web_search.api_key.is_empty() { None } else { Some(settings.web_search.api_key) };
        }
        config.web_search.max_results = settings.web_search.max_results;
        config.web_search.timeout_secs = settings.web_search.timeout_secs;

        // Apply browser settings
        config.browser.enabled = settings.browser.enabled;
        config.browser.native_headless = settings.browser.headless;
        config.browser.native_webdriver_url = settings.browser.webdriver_url;
        config.browser.native_chrome_path = Some(settings.browser.chrome_path);
        config.browser.computer_use.endpoint = settings.browser.computer_use_display;

        // Apply http_request settings
        config.http_request.enabled = settings.http_request.enabled;
        config.http_request.allowed_domains = settings.http_request.allowed_domains;
        config.http_request.max_response_size = settings.http_request.max_response_bytes as usize;

        // Apply composio settings
        config.composio.enabled = settings.composio.enabled;
        if !is_masked(&settings.composio.api_key) {
            config.composio.api_key = if settings.composio.api_key.is_empty() { None } else { Some(settings.composio.api_key) };
        }
        config.composio.entity_id = settings.composio.entity_id;

        // Apply runtime settings
        config.runtime.docker.image = settings.runtime.docker_image;
        config.runtime.docker.network = settings.runtime.docker_network;
        config.runtime.docker.memory_limit_mb = Some(settings.runtime.docker_memory_mb as u64);
        config.runtime.docker.cpu_limit = Some(settings.runtime.docker_cpu_limit);
        config.runtime.docker.read_only_rootfs = settings.runtime.docker_readonly_fs;
        config.runtime.docker.mount_workspace = settings.runtime.docker_workspace_mount == "true";

        // Apply scheduler settings
        config.scheduler.enabled = settings.scheduler.enabled;
        config.scheduler.max_tasks = settings.scheduler.max_tasks;
        config.scheduler.max_concurrent = settings.scheduler.max_concurrent;

        // Apply heartbeat settings
        config.heartbeat.enabled = settings.heartbeat.enabled;
        config.heartbeat.interval_minutes = (settings.heartbeat.interval_secs / 60).max(1) as u32;

        // Apply multimodal settings
        config.multimodal.max_images = settings.multimodal.max_images;
        config.multimodal.max_image_size_mb = settings.multimodal.max_image_size_mb as usize;

        // Apply transcription settings
        config.transcription.enabled = settings.transcription.enabled;
        config.transcription.api_url = settings.transcription.provider;
        config.transcription.model = settings.transcription.model;
        config.transcription.language = if settings.transcription.language.is_empty() { None } else { Some(settings.transcription.language) };
        config.transcription.max_duration_secs = settings.transcription.max_duration_secs;

        // Apply hardware settings
        config.hardware.enabled = settings.hardware.enabled;
        config.hardware.serial_port = if settings.hardware.serial_port.is_empty() { None } else { Some(settings.hardware.serial_port) };
        config.hardware.baud_rate = settings.hardware.baud_rate;
        config.hardware.probe_target = if settings.hardware.probe_target.is_empty() { None } else { Some(settings.hardware.probe_target) };

        // Apply hooks settings
        config.hooks.enabled = settings.hooks.enabled;
        config.hooks.builtin.command_logger = settings.hooks.command_logger;

        // Apply gateway settings
        config.gateway.host = settings.gateway.host;
        config.gateway.port = settings.gateway.port;
        config.gateway.require_pairing = settings.gateway.require_pairing;
        config.gateway.webhook_rate_limit_per_minute = settings.gateway.rate_limit_rpm;
        config.gateway.rate_limit_max_keys = settings.gateway.rate_limit_burst as usize;
        if settings.gateway.idempotency_enabled && config.gateway.idempotency_ttl_secs == 0 {
            config.gateway.idempotency_ttl_secs = 300; // default 5min
        } else if !settings.gateway.idempotency_enabled {
            config.gateway.idempotency_ttl_secs = 0;
        }

        // Apply identity settings
        config.identity.format = settings.identity.format;
        config.identity.aieos_path = if settings.identity.aieos_path.is_empty() { None } else { Some(settings.identity.aieos_path) };

        // Apply secrets settings
        config.secrets.encrypt = settings.secrets.encryption_enabled;

        // Apply observability settings
        config.observability.otel_endpoint = Some(settings.observability.otlp_endpoint);

        // Storage settings are read-only complex structs; skip fields without direct mapping

        // Apply model routes
        config.model_routes = settings.model_routes.into_iter().map(|r| {
            let mut route = zeroclaw_engine::config::schema::ModelRouteConfig {
                hint: r.hint,
                provider: r.provider,
                model: r.model,
                api_key: None,
            };
            if !is_masked(&r.api_key) && !r.api_key.is_empty() {
                route.api_key = Some(r.api_key);
            }
            route
        }).collect();

        // Apply embedding routes
        config.embedding_routes = settings.embedding_routes.into_iter().map(|r| {
            zeroclaw_engine::config::schema::EmbeddingRouteConfig {
                hint: r.hint,
                provider: r.provider,
                model: r.model,
                dimensions: if r.dimensions > 0 { Some(r.dimensions as usize) } else { None },
                api_key: None,
            }
        }).collect();

        // Apply query classification
        config.query_classification.enabled = settings.query_classification.enabled;

        // Apply delegate agents
        config.agents.clear();
        for agent in settings.delegate_agents {
            config.agents.insert(agent.name, zeroclaw_engine::config::schema::DelegateAgentConfig {
                provider: agent.provider,
                model: agent.model,
                system_prompt: if agent.system_prompt.is_empty() { None } else { Some(agent.system_prompt) },
                api_key: None,
                temperature: Some(agent.temperature),
                max_depth: agent.max_depth as u32,
                agentic: agent.agentic,
                allowed_tools: Vec::new(),
                max_iterations: 25,
            });
        }

        // Apply model pricing
        config.cost.prices.clear();
        for pricing in settings.model_pricing {
            config.cost.prices.insert(pricing.model, zeroclaw_engine::config::schema::ModelPricing {
                input: pricing.input_price_per_1m,
                output: pricing.output_price_per_1m,
            });
        }

        // Force agent re-init to pick up new settings
        drop(daemon);
        let mut agent = state.agent.lock().await;
        *agent = None;

        // Persist config to disk (config.toml)
        {
            let daemon = state.daemon.lock().await;
            if let Some(config) = daemon.zeroclaw_config.as_ref() {
                if let Err(e) = config.save().await {
                    println!("[CONFIG] Warning: failed to persist config.toml: {}", e);
                }
            }
        }

        println!("[CONFIG] Engine settings updated via sectioned IPC.");

    Ok(())
}

#[tauri::command]
async fn save_inference_config(state: tauri::State<'_, AppState>, temperature: f64, max_tokens: Option<u32>) -> AppResult<()> {
    let mut st = state.config.lock().await;
    st.temperature = temperature;
    st.max_tokens = max_tokens;

    // Apply to running engine config if available
    drop(st);
    let mut daemon = state.daemon.lock().await;
    if let Some(config) = daemon.zeroclaw_config.as_mut() {
        config.default_temperature = temperature;
    }

    // Force agent re-init
    drop(daemon);
    let mut agent = state.agent.lock().await;
    *agent = None;

    Ok(())
}

// ─── Dynamic provider list ──────────────────────────────────────────────

#[derive(Serialize)]
struct ProviderInfo {
    id: String,
    name: String,
    needs_key: bool,
    has_key: bool,
    api_url: Option<String>,
}

#[tauri::command]
async fn list_available_providers(_state: tauri::State<'_, AppState>) -> AppResult<Vec<ProviderInfo>> {
    let providers = vec![
        ("openai", "OpenAI", true),
        ("anthropic", "Anthropic", true),
        ("ollama", "Ollama (Local)", false),
        ("groq", "Groq", true),
        ("custom", "Custom OpenAI-Compatible", true),
    ];

    let mut result = Vec::new();
    for (id, name, needs_key) in providers {
        let has_key = if needs_key {
            Entry::new("pocketclaw_zero_engine", &format!("api_key_{}", id))
                .ok()
                .and_then(|e| e.get_password().ok())
                .is_some()
        } else {
            true // Ollama doesn't need a key
        };

        let api_url = Entry::new("pocketclaw_zero_engine", &format!("api_url_{}", id))
            .ok()
            .and_then(|e| e.get_password().ok());

        result.push(ProviderInfo {
            id: id.to_string(),
            name: name.to_string(),
            needs_key,
            has_key,
            api_url,
        });
    }

    Ok(result)
}

// ─── Application entry point ───────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .manage(AppState {
            config: Mutex::new(AppConfig::default()),
            daemon: Mutex::new(DaemonState {
                is_running: true,
                active_providers: vec!["openai".to_string()],
                zeroclaw_config: None,
            }),
            agent: Mutex::new(None),
            auth_manager: AuthManager {
                pending: Arc::new(Mutex::new(HashMap::new())),
            },
            started_at: Instant::now(),
            channel_configs: Mutex::new(HashMap::new()),
            log_buffer: Arc::new(std::sync::Mutex::new(vec![LogEntry {
                timestamp: chrono::Local::now().format("%H:%M:%S%.3f").to_string(),
                level: "info".to_string(),
                message: "PocketClaw engine initialized.".to_string(),
            }])),
        })
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            get_config,
            save_config,
            load_config,
            update_tool_config,
            process_document,
            abort_generation,
            send_chat_message,
            authorize_tool,
            list_workspace_files,
            delete_file,
            list_memories,
            store_memory,
            forget_memory,
            search_memories,
            list_skills,
            install_skill,
            uninstall_skill,
            create_skill,
            get_system_metrics,
            get_logs,
            list_channel_configs,
            save_channel_config,
            delete_channel_config,
            get_engine_settings,
            save_engine_settings,
            save_inference_config,
            list_available_providers
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
