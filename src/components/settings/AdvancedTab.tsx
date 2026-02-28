import { Toggle, NumberField, TextField, SelectField, PasswordField, CollapsibleSection } from './shared';
import type { TabProps } from './types';

export default function AdvancedTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-4">
            {/* Gateway */}
            <CollapsibleSection title="Gateway">
                <Toggle label="Enabled" value={settings.gateway.enabled} onChange={(v) => updateSettings('gateway', 'enabled', v)} />
                {settings.gateway.enabled && (
                    <>
                        <TextField label="Host" value={settings.gateway.host} onChange={(v) => updateSettings('gateway', 'host', v)} placeholder="127.0.0.1" />
                        <NumberField label="Port" value={settings.gateway.port} onChange={(v) => updateSettings('gateway', 'port', v)} min={1024} max={65535} />
                        <Toggle label="Require Pairing" value={settings.gateway.require_pairing} onChange={(v) => updateSettings('gateway', 'require_pairing', v)} />
                        <NumberField label="Rate Limit (req/min)" value={settings.gateway.rate_limit_rpm} onChange={(v) => updateSettings('gateway', 'rate_limit_rpm', v)} min={1} max={10000} />
                        <NumberField label="Rate Limit Burst" value={settings.gateway.rate_limit_burst} onChange={(v) => updateSettings('gateway', 'rate_limit_burst', v)} min={1} max={1000} />
                        <Toggle label="Idempotency Enabled" value={settings.gateway.idempotency_enabled} onChange={(v) => updateSettings('gateway', 'idempotency_enabled', v)} />
                    </>
                )}
            </CollapsibleSection>

            {/* Tunnel */}
            <CollapsibleSection title="Tunnel">
                <SelectField
                    label="Provider"
                    value={settings.tunnel.provider}
                    onChange={(v) => updateSettings('tunnel', 'provider', v)}
                    options={[
                        { value: 'none', label: 'None' },
                        { value: 'cloudflare', label: 'Cloudflare' },
                        { value: 'tailscale', label: 'Tailscale' },
                        { value: 'ngrok', label: 'ngrok' },
                        { value: 'custom', label: 'Custom' },
                    ]}
                />
            </CollapsibleSection>

            {/* Identity */}
            <CollapsibleSection title="Identity">
                <SelectField
                    label="Format"
                    value={settings.identity.format}
                    onChange={(v) => updateSettings('identity', 'format', v)}
                    options={[
                        { value: 'openclaw', label: 'OpenClaw' },
                        { value: 'aieos', label: 'AIEOS' },
                    ]}
                />
                <TextField label="AIEOS Path" value={settings.identity.aieos_path} onChange={(v) => updateSettings('identity', 'aieos_path', v)} placeholder="identity.json" />
            </CollapsibleSection>

            {/* Secrets */}
            <CollapsibleSection title="Secrets">
                <Toggle label="Encryption Enabled" value={settings.secrets.encryption_enabled} onChange={(v) => updateSettings('secrets', 'encryption_enabled', v)} />
            </CollapsibleSection>

            {/* Observability */}
            <CollapsibleSection title="Observability">
                <SelectField
                    label="Backend"
                    value={settings.observability.backend}
                    onChange={(v) => updateSettings('observability', 'backend', v)}
                    options={[
                        { value: 'none', label: 'None' },
                        { value: 'log', label: 'Log File' },
                        { value: 'prometheus', label: 'Prometheus' },
                        { value: 'otel', label: 'OpenTelemetry' },
                    ]}
                />
                {settings.observability.backend === 'otel' && (
                    <TextField label="OTLP Endpoint" value={settings.observability.otlp_endpoint} onChange={(v) => updateSettings('observability', 'otlp_endpoint', v)} placeholder="http://localhost:4317" />
                )}
                <SelectField
                    label="Log Level"
                    value={settings.observability.log_level}
                    onChange={(v) => updateSettings('observability', 'log_level', v)}
                    options={[
                        { value: 'trace', label: 'Trace' },
                        { value: 'debug', label: 'Debug' },
                        { value: 'info', label: 'Info' },
                        { value: 'warn', label: 'Warn' },
                        { value: 'error', label: 'Error' },
                    ]}
                />
                <SelectField
                    label="Trace Storage"
                    value={settings.observability.trace_storage}
                    onChange={(v) => updateSettings('observability', 'trace_storage', v)}
                    options={[
                        { value: 'none', label: 'None' },
                        { value: 'memory', label: 'Memory' },
                        { value: 'file', label: 'File' },
                    ]}
                />
                <Toggle label="Metrics Enabled" value={settings.observability.metrics_enabled} onChange={(v) => updateSettings('observability', 'metrics_enabled', v)} />
                <Toggle label="Trace Enabled" value={settings.observability.trace_enabled} onChange={(v) => updateSettings('observability', 'trace_enabled', v)} />
            </CollapsibleSection>

            {/* Storage */}
            <CollapsibleSection title="Storage">
                <SelectField
                    label="Provider"
                    value={settings.storage.provider}
                    onChange={(v) => updateSettings('storage', 'provider', v)}
                    options={[
                        { value: 'sqlite', label: 'SQLite' },
                        { value: 'postgres', label: 'PostgreSQL' },
                    ]}
                />
                <PasswordField label="Database URL" value={settings.storage.db_url} onChange={(v) => updateSettings('storage', 'db_url', v)} placeholder="sqlite://data.db" />
                <NumberField label="Connection Pool Size" value={settings.storage.pool_size} onChange={(v) => updateSettings('storage', 'pool_size', v)} min={1} max={100} />
                <Toggle label="Migrate on Start" value={settings.storage.migrate_on_start} onChange={(v) => updateSettings('storage', 'migrate_on_start', v)} />
            </CollapsibleSection>
        </div>
    );
}
