import { Toggle, NumberField, TextField, TagsField, CollapsibleSection, MapField } from './shared';
import type { TabProps } from './types';

export default function NetworkTab({ settings, updateSettings }: TabProps) {
    return (
        <div className="space-y-4">
            <Toggle label="Enable Proxy" value={settings.network.proxy_enabled} onChange={(v) => updateSettings('network', 'proxy_enabled', v)} />
            {settings.network.proxy_enabled && (
                <>
                    <TextField label="HTTP Proxy" value={settings.network.http_proxy || ''} onChange={(v) => updateSettings('network', 'http_proxy', v || null)} placeholder="http://proxy:8080" />
                    <TextField label="HTTPS Proxy" value={settings.network.https_proxy || ''} onChange={(v) => updateSettings('network', 'https_proxy', v || null)} placeholder="https://proxy:8443" />
                    <TagsField label="No Proxy (bypass list)" value={settings.network.no_proxy} onChange={(v) => updateSettings('network', 'no_proxy', v)} placeholder="localhost, 127.0.0.1" />
                </>
            )}
            <NumberField label="HTTP Timeout (seconds)" value={settings.network.http_timeout_secs} onChange={(v) => updateSettings('network', 'http_timeout_secs', v)} min={5} max={300} />
            <NumberField label="Provider Retries" value={settings.network.http_max_retries} onChange={(v) => updateSettings('network', 'http_max_retries', v)} min={0} max={10} />

            <CollapsibleSection title="Advanced">
                <TextField label="All Proxy (SOCKS5)" value={settings.network.all_proxy || ''} onChange={(v) => updateSettings('network', 'all_proxy', v || null)} placeholder="socks5://proxy:1080" />
                <TextField label="Proxy Scope" value={settings.network.proxy_scope} onChange={(v) => updateSettings('network', 'proxy_scope', v)} placeholder="Environment | Zeroclaw | Services" />
                <TagsField label="Proxy Services" value={settings.network.proxy_services} onChange={(v) => updateSettings('network', 'proxy_services', v)} placeholder="e.g. openai, anthropic" />
                <NumberField label="Provider Backoff (ms)" value={settings.network.provider_backoff_ms} onChange={(v) => updateSettings('network', 'provider_backoff_ms', v)} min={100} max={60000} />
                <TagsField label="Fallback Providers" value={settings.network.fallback_providers} onChange={(v) => updateSettings('network', 'fallback_providers', v)} placeholder="e.g. anthropic, openai" />
                <MapField
                    label="Model Fallbacks"
                    value={settings.network.model_fallbacks}
                    onChange={(v) => updateSettings('network', 'model_fallbacks', v)}
                    keyPlaceholder="Model name"
                    valuePlaceholder="Fallback models (comma-sep)"
                />
            </CollapsibleSection>
        </div>
    );
}
