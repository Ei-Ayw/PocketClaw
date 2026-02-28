export type EngineSettings = {
    agent: {
        max_tool_iterations: number;
        max_history_messages: number;
        parallel_tools: boolean;
        compact_context: boolean;
        tool_dispatcher: string;
    };
    autonomy: {
        level: string;
        workspace_only: boolean;
        allowed_commands: string[];
        forbidden_paths: string[];
        max_actions_per_hour: number;
        auto_approve: string[];
        max_cost_per_day_cents: number;
        require_approval_for_medium_risk: boolean;
        block_high_risk_commands: boolean;
        shell_env_passthrough: string[];
        always_ask: string[];
        allowed_roots: string[];
    };
    memory: {
        backend: string;
        auto_save: boolean;
        hygiene_enabled: boolean;
        archive_after_days: number;
        purge_after_days: number;
        embedding_provider: string;
        embedding_model: string;
        response_cache_enabled: boolean;
        snapshot_enabled: boolean;
        conversation_retention_days: number;
        embedding_dimensions: number;
        vector_weight: number;
        keyword_weight: number;
        min_relevance_score: number;
        embedding_cache_size: number;
        chunk_max_tokens: number;
        response_cache_ttl_minutes: number;
        response_cache_max_entries: number;
        snapshot_on_hygiene: boolean;
        auto_hydrate: boolean;
    };
    network: {
        proxy_enabled: boolean;
        http_proxy: string | null;
        https_proxy: string | null;
        no_proxy: string[];
        http_timeout_secs: number;
        http_max_retries: number;
        all_proxy: string | null;
        proxy_scope: string;
        proxy_services: string[];
        provider_backoff_ms: number;
        fallback_providers: string[];
        model_fallbacks: Record<string, string[]>;
    };
    security: {
        sandbox_enabled: boolean;
        sandbox_backend: string;
        audit_enabled: boolean;
        audit_log_path: string;
        estop_enabled: boolean;
        max_memory_mb: number;
        max_cpu_time_seconds: number;
        max_subprocesses: number;
        memory_monitoring: boolean;
        audit_max_size_mb: number;
        audit_sign_events: boolean;
        estop_state_file: string;
        estop_require_otp_to_resume: boolean;
        otp_enabled: boolean;
        otp_method: string;
        otp_token_ttl_secs: number;
        otp_gated_actions: string[];
        otp_gated_domains: string[];
    };
    cost: {
        enabled: boolean;
        daily_limit_usd: number;
        monthly_limit_usd: number;
        warn_at_percent: number;
        allow_override: boolean;
    };
    // New sections (Phase 3)
    web_search: {
        enabled: boolean;
        provider: string;
        api_key: string;
        max_results: number;
        timeout_secs: number;
    };
    browser: {
        enabled: boolean;
        backend: string;
        webdriver_url: string;
        chrome_path: string;
        headless: boolean;
        page_timeout_secs: number;
        computer_use_enabled: boolean;
        computer_use_sidecar_port: number;
        computer_use_display: string;
    };
    http_request: {
        enabled: boolean;
        allowed_domains: string[];
        max_response_bytes: number;
        timeout_secs: number;
    };
    composio: {
        enabled: boolean;
        api_key: string;
        entity_id: string;
    };
    runtime: {
        kind: string;
        docker_image: string;
        docker_network: string;
        docker_memory_mb: number;
        docker_cpu_limit: number;
        docker_readonly_fs: boolean;
        docker_workspace_mount: string;
    };
    scheduler: {
        enabled: boolean;
        max_tasks: number;
        max_concurrent: number;
    };
    heartbeat: {
        enabled: boolean;
        interval_secs: number;
    };
    multimodal: {
        enabled: boolean;
        max_images: number;
        max_image_size_mb: number;
    };
    transcription: {
        enabled: boolean;
        provider: string;
        model: string;
        language: string;
        max_duration_secs: number;
    };
    hardware: {
        enabled: boolean;
        transport: string;
        serial_port: string;
        baud_rate: number;
        probe_target: string;
    };
    hooks: {
        enabled: boolean;
        command_logger: boolean;
    };
    gateway: {
        enabled: boolean;
        host: string;
        port: number;
        require_pairing: boolean;
        rate_limit_rpm: number;
        rate_limit_burst: number;
        idempotency_enabled: boolean;
    };
    tunnel: {
        provider: string;
    };
    identity: {
        format: string;
        aieos_path: string;
    };
    secrets: {
        encryption_enabled: boolean;
    };
    observability: {
        backend: string;
        otlp_endpoint: string;
        log_level: string;
        trace_storage: string;
        metrics_enabled: boolean;
        trace_enabled: boolean;
    };
    storage: {
        provider: string;
        db_url: string;
        pool_size: number;
        migrate_on_start: boolean;
    };
    model_routes: EngineSettingsModelRoute[];
    embedding_routes: EngineSettingsEmbeddingRoute[];
    query_classification: {
        enabled: boolean;
    };
    delegate_agents: EngineSettingsDelegateAgent[];
    model_pricing: EngineSettingsModelPricing[];
};

export type EngineSettingsModelRoute = {
    hint: string;
    provider: string;
    model: string;
    api_key: string;
};

export type EngineSettingsEmbeddingRoute = {
    hint: string;
    provider: string;
    model: string;
    dimensions: number;
};

export type EngineSettingsDelegateAgent = {
    name: string;
    provider: string;
    model: string;
    system_prompt: string;
    temperature: number;
    max_depth: number;
    agentic: boolean;
};

export type EngineSettingsModelPricing = {
    model: string;
    input_price_per_1m: number;
    output_price_per_1m: number;
};

export type TabId = 'general' | 'agent' | 'autonomy' | 'memory' | 'network' | 'security' | 'cost' | 'tools' | 'runtime' | 'integrations' | 'routing' | 'advanced';

export type TabProps = {
    settings: EngineSettings;
    updateSettings: <K extends keyof EngineSettings>(section: K, field: string, value: any) => void;
};
